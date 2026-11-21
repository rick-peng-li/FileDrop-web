import http from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import { CORS_ORIGIN, PORT } from "./config/env.js";
import { registerSocketHandlers } from "./socket/index.js";

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`FileDrop signaling server listening on port ${PORT}`);
});
