import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "antd";
import { saveAs } from "file-saver";
import { useSocket } from "@/context/SocketProvider";
import {
  CHUNK_SIZE,
  ICE_SERVERS,
  MAX_BUFFERED_AMOUNT,
  SOCKET_SERVER_URL,
} from "@/utils/constants";
import type {
  ChatMessage,
  DataChannelPayload,
  IncomingCall,
  ReceivedFile,
} from "@/utils/types";

interface SignalingPayload {
  from: string;
  to: string;
  signalData: RTCSessionDescriptionInit;
}

interface AnswerPayload {
  to: string;
  signalData: RTCSessionDescriptionInit;
}

interface WorkerProgressMessage {
  type: "progress";
  progress: number;
}

interface WorkerDoneMessage {
  type: "done";
  blob: Blob;
  totalBytes: number;
}

type WorkerResponse = WorkerProgressMessage | WorkerDoneMessage;

function waitForIceGathering(peer: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (peer.iceGatheringState === "complete") {
      resolve();
      return;
    }

    const handleStateChange = () => {
      if (peer.iceGatheringState === "complete") {
        peer.removeEventListener("icegatheringstatechange", handleStateChange);
        resolve();
      }
    };

    peer.addEventListener("icegatheringstatechange", handleStateChange);
    setTimeout(() => {
      peer.removeEventListener("icegatheringstatechange", handleStateChange);
      resolve();
    }, 3000);
  });
}

function waitForBufferDrain(channel: RTCDataChannel) {
  return new Promise<void>((resolve) => {
    channel.bufferedAmountLowThreshold = MAX_BUFFERED_AMOUNT / 2;
    const handleDrain = () => {
      channel.removeEventListener("bufferedamountlow", handleDrain);
      resolve();
    };
    channel.addEventListener("bufferedamountlow", handleDrain);
    setTimeout(() => {
      channel.removeEventListener("bufferedamountlow", handleDrain);
      resolve();
    }, 1000);
  });
}

export function usePeerTransfer() {
  const { socket, userId } = useSocket();
  const { message } = App.useApp();

  const [partnerInput, setPartnerInput] = useState("");
  const [connectedPeer, setConnectedPeer] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [receivedFile, setReceivedFile] = useState<ReceivedFile | null>(null);
  const [receivedFileName, setReceivedFileName] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const remotePeerRef = useRef("");
  const receivedMetaRef = useRef<{ name: string; size: number } | null>(null);

  const resetConnection = useCallback(
    (notify: boolean) => {
      channelRef.current?.close();
      channelRef.current = null;
      peerRef.current?.close();
      peerRef.current = null;

      setIsConnected(false);
      setIsConnecting(false);
      setIsSending(false);
      setIsReceiving(false);
      setIncomingCall(null);
      setDownloadProgress(0);

      if (notify && remotePeerRef.current) {
        message.error(`${remotePeerRef.current} disconnected`);
      }
    },
    [message]
  );

  // 注册在线用户，并监听对端发起的呼叫信令
  useEffect(() => {
    const registerPeer = () => {
      socket.emit("details", { socketId: socket.id, uniqueId: userId });
    };

    if (socket.connected) {
      registerPeer();
    }
    socket.on("connect", registerPeer);

    const handleSignaling = (payload: {
      from: string;
      signalData: RTCSessionDescriptionInit;
    }) => {
      remotePeerRef.current = payload.from;
      setIncomingCall(payload);
    };
    socket.on("signaling", handleSignaling);

    return () => {
      socket.off("connect", registerPeer);
      socket.off("signaling", handleSignaling);
    };
  }, [socket, userId]);

  // 接收分片后由 Worker 在后台线程合并
  useEffect(() => {
    const worker = new Worker(
      new URL("../utils/transferWorker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const data = event.data;
      if (data.type === "progress") {
        setDownloadProgress(data.progress);
        return;
      }
      setDownloadProgress(100);
      setIsReceiving(false);
      setReceivedFile({
        blob: data.blob,
        name: receivedMetaRef.current?.name || "download",
      });
      message.success("File received successfully");
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [message]);

  const setupChannel = useCallback(
    (channel: RTCDataChannel) => {
      channel.binaryType = "arraybuffer";
      channelRef.current = channel;

      channel.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setIncomingCall(null);
        setConnectedPeer(remotePeerRef.current);
        message.success(`Connected with ${remotePeerRef.current}`);
      };

      channel.onclose = () => {
        resetConnection(true);
        setConnectedPeer("");
      };

      channel.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
        if (typeof event.data === "string") {
          const payload = JSON.parse(event.data) as DataChannelPayload;

          if (payload.type === "file-info") {
            receivedMetaRef.current = {
              name: payload.fileName,
              size: payload.fileSize,
            };
            setReceivedFileName(payload.fileName);
            setReceivedFile(null);
            setDownloadProgress(0);
            setIsReceiving(true);
            workerRef.current?.postMessage({
              type: "start",
              size: payload.fileSize,
            });
            return;
          }

          if (payload.type === "file-done") {
            workerRef.current?.postMessage({ type: "finish" });
            return;
          }

          if (payload.type === "chat") {
            setMessages((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${prev.length}`,
                text: payload.text,
                sender: "peer",
              },
            ]);
          }
          return;
        }

        if (event.data instanceof ArrayBuffer) {
          workerRef.current?.postMessage(
            { type: "chunk", chunk: event.data },
            [event.data]
          );
        }
      };
    },
    [message, resetConnection]
  );

  const createPeerConnection = useCallback(() => {
    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === "failed" ||
        peer.connectionState === "disconnected"
      ) {
        resetConnection(true);
        setConnectedPeer("");
      }
    };
    peerRef.current = peer;
    return peer;
  }, [resetConnection]);

  const connectToPeer = useCallback(async () => {
    const target = partnerInput.trim();

    if (target.length !== 10 || target === userId) {
      message.error("Enter a valid Peer ID");
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch(
        `${SOCKET_SERVER_URL}/api/peers/${encodeURIComponent(target)}`
      );
      if (!response.ok) {
        throw new Error("Request failed");
      }
      const data = (await response.json()) as { online: boolean };
      if (!data.online) {
        message.error("Peer is offline or not registered");
        setIsConnecting(false);
        return;
      }
    } catch {
      message.error("Unable to reach the server");
      setIsConnecting(false);
      return;
    }

    try {
      const peer = createPeerConnection();
      remotePeerRef.current = target;
      setupChannel(peer.createDataChannel("filedrop", { ordered: true }));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIceGathering(peer);

      socket.once("callAccepted", async (payload: AnswerPayload) => {
        try {
          await peer.setRemoteDescription(payload.signalData);
        } catch {
          message.error("Failed to establish the connection");
          resetConnection(false);
        }
      });

      const signaling: SignalingPayload = {
        from: userId,
        to: target,
        signalData: peer.localDescription as RTCSessionDescriptionInit,
      };
      socket.emit("send-signal", signaling);
    } catch {
      message.error("Failed to create the connection");
      resetConnection(false);
      setIsConnecting(false);
    }
  }, [
    createPeerConnection,
    message,
    partnerInput,
    resetConnection,
    setupChannel,
    socket,
    userId,
  ]);

  const acceptIncomingCall = useCallback(async () => {
    if (!incomingCall) {
      return;
    }

    try {
      const peer = createPeerConnection();
      peer.ondatachannel = (event) => {
        setupChannel(event.channel);
      };

      await peer.setRemoteDescription(incomingCall.signalData);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await waitForIceGathering(peer);

      const payload: AnswerPayload = {
        to: incomingCall.from,
        signalData: peer.localDescription as RTCSessionDescriptionInit,
      };
      socket.emit("accept-signal", payload);

      remotePeerRef.current = incomingCall.from;
      setIncomingCall(null);
    } catch {
      message.error("Failed to accept the call");
      resetConnection(false);
    }
  }, [createPeerConnection, incomingCall, message, resetConnection, setupChannel, socket]);

  const terminateConnection = useCallback(() => {
    resetConnection(false);
    remotePeerRef.current = "";
    setConnectedPeer("");
    message.info("Connection closed");
  }, [message, resetConnection]);

  const selectFile = useCallback((file: File | null) => {
    setSelectedFile(file);
    setUploadProgress(0);
  }, []);

  const sendFile = useCallback(async () => {
    const channel = channelRef.current;
    if (!selectedFile || !channel || channel.readyState !== "open") {
      message.error("No active connection");
      return;
    }

    setIsSending(true);
    setUploadProgress(0);

    try {
      channel.send(
        JSON.stringify({
          type: "file-info",
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        })
      );

      let offset = 0;
      while (offset < selectedFile.size) {
        if (channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
          await waitForBufferDrain(channel);
        }
        const chunk = await selectedFile
          .slice(offset, offset + CHUNK_SIZE)
          .arrayBuffer();
        channel.send(chunk);
        offset += chunk.byteLength;
        setUploadProgress(
          Math.min(100, Math.round((offset / selectedFile.size) * 100))
        );
      }

      channel.send(
        JSON.stringify({
          type: "file-done",
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        })
      );
      setUploadProgress(100);
      message.success("File sent successfully");
    } catch {
      message.error("Failed to send the file");
    } finally {
      setIsSending(false);
    }
  }, [message, selectedFile]);

  const sendMessage = useCallback(
    (text: string) => {
      const channel = channelRef.current;
      const content = text.trim();
      if (!channel || channel.readyState !== "open" || !content) {
        return;
      }

      channel.send(JSON.stringify({ type: "chat", text: content }));
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          text: content,
          sender: "me",
        },
      ]);
    },
    []
  );

  const downloadReceivedFile = useCallback(() => {
    if (!receivedFile) {
      return;
    }
    saveAs(receivedFile.blob, receivedFile.name || receivedFileName);
  }, [receivedFile, receivedFileName]);

  useEffect(() => {
    return () => {
      channelRef.current?.close();
      peerRef.current?.close();
      workerRef.current?.terminate();
    };
  }, []);

  return {
    userId,
    partnerInput,
    setPartnerInput,
    connectedPeer,
    isConnecting,
    isConnected,
    incomingCall,
    connectToPeer,
    acceptIncomingCall,
    terminateConnection,
    messages,
    sendMessage,
    selectedFile,
    selectFile,
    isSending,
    uploadProgress,
    sendFile,
    receivedFile,
    receivedFileName,
    isReceiving,
    downloadProgress,
    downloadReceivedFile,
  };
}

export type PeerTransferState = ReturnType<typeof usePeerTransfer>;
