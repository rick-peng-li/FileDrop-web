const usersToSocketIds = new Map();
const socketIdsToUsers = new Map();

export function registerPeer(socketId, uniqueId) {
  if (!socketId || !uniqueId) {
    return;
  }
  usersToSocketIds.set(uniqueId, socketId);
  socketIdsToUsers.set(socketId, uniqueId);
}

export function removePeerBySocket(socketId) {
  const uniqueId = socketIdsToUsers.get(socketId);
  if (!uniqueId) {
    return;
  }
  socketIdsToUsers.delete(socketId);
  usersToSocketIds.delete(uniqueId);
}

export function getSocketId(uniqueId) {
  return usersToSocketIds.get(uniqueId);
}

export function isPeerOnline(uniqueId) {
  return usersToSocketIds.has(uniqueId);
}

export function getOnlinePeerCount() {
  return usersToSocketIds.size;
}
