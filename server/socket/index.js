import { getSocketId, registerPeer, removePeerBySocket } from "../models/peerStore.js";
import { getRoom, joinRoom, leaveRoom } from "../models/roomStore.js";

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("details", ({ socketId, uniqueId }) => {
      registerPeer(socketId || socket.id, uniqueId);
    });

    socket.on("joinRoom", (roomId) => {
      const room = Number(roomId);
      socket.join(room);
      joinRoom(socket.id, room);
      socket.emit("ack", `You have joined room ${roomId}`);
    });

    socket.on("message", (payload) => {
      const room = getRoom(socket.id);
      if (room !== undefined) {
        io.to(room).emit("roomMsg", payload);
      }
    });

    socket.on("send-signal", ({ from, to, signalData }) => {
      const targetSocketId = getSocketId(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("signaling", { from, signalData, to });
      }
    });

    socket.on("accept-signal", ({ to, signalData }) => {
      const targetSocketId = getSocketId(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("callAccepted", { signalData, to });
      }
    });

    socket.on("disconnect", () => {
      removePeerBySocket(socket.id);
      leaveRoom(socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
