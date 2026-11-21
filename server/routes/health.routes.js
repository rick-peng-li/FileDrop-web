import { Router } from "express";
import { getHealth, getStats } from "../controllers/health.controller.js";

const router = Router();

router.get("/health", getHealth);
router.get("/stats", getStats);

export default router;
