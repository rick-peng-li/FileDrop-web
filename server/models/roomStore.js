const socketIdToRoom = new Map();

export function joinRoom(socketId, roomId) {
  socketIdToRoom.set(socketId, roomId);
}

export function getRoom(socketId) {
  return socketIdToRoom.get(socketId);
}

export function leaveRoom(socketId) {
  socketIdToRoom.delete(socketId);
}

export function getActiveRoomCount() {
  return new Set(socketIdToRoom.values()).size;
}
