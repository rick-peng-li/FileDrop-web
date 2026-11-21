import { Router } from "express";
import healthRoutes from "./health.routes.js";
import peerRoutes from "./peer.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("hello from server");
});

router.use("/api", healthRoutes);
router.use("/api", peerRoutes);

export default router;
