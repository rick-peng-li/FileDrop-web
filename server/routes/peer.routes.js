import { Router } from "express";
import { getPeerStatus } from "../controllers/peer.controller.js";

const router = Router();

router.get("/peers/:uniqueId", getPeerStatus);

export default router;
