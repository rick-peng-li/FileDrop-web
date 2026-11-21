/// <reference lib="webworker" />

interface StartMessage {
  type: "start";
  size: number;
}

interface ChunkMessage {
  type: "chunk";
  chunk: ArrayBuffer;
}

interface FinishMessage {
  type: "finish";
}

type IncomingMessage = StartMessage | ChunkMessage | FinishMessage;

const scope = self as unknown as DedicatedWorkerGlobalScope;

let chunks: BlobPart[] = [];
let receivedBytes = 0;
let totalBytes = 0;
let lastProgress = -1;

scope.onmessage = (event: MessageEvent<IncomingMessage>) => {
  const data = event.data;

  if (data.type === "start") {
    chunks = [];
    receivedBytes = 0;
    totalBytes = data.size;
    lastProgress = -1;
    return;
  }

  if (data.type === "chunk") {
    chunks.push(data.chunk);
    receivedBytes += data.chunk.byteLength;
    const progress =
      totalBytes > 0
        ? Math.min(100, Math.floor((receivedBytes / totalBytes) * 100))
        : 0;
    if (progress !== lastProgress) {
      lastProgress = progress;
      scope.postMessage({ type: "progress", progress });
    }
    return;
  }

  if (data.type === "finish") {
    const blob = new Blob(chunks, { type: "application/octet-stream" });
    scope.postMessage({ type: "done", blob, totalBytes });
    chunks = [];
    receivedBytes = 0;
    totalBytes = 0;
    lastProgress = -1;
  }
};
