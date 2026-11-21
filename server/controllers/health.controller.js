import { getOnlinePeerCount } from "../models/peerStore.js";
import { getActiveRoomCount } from "../models/roomStore.js";

export function getHealth(req, res) {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
}

export function getStats(req, res) {
  res.json({
    onlineUsers: getOnlinePeerCount(),
    activeRooms: getActiveRoomCount(),
  });
}
