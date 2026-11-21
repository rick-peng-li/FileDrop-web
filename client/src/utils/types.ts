export interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "peer";
}

export interface ReceivedFile {
  blob: Blob;
  name: string;
}

export interface IncomingCall {
  from: string;
  signalData: RTCSessionDescriptionInit;
}

export interface FileInfoPayload {
  type: "file-info";
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface FileDonePayload {
  type: "file-done";
  fileName: string;
  fileSize: number;
}

export interface ChatPayload {
  type: "chat";
  text: string;
}

export type DataChannelPayload =
  | FileInfoPayload
  | FileDonePayload
  | ChatPayload;
