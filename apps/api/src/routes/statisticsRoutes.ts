import { Router } from "express";
import { statisticsController } from "../controllers/statisticsController";

const router = Router();

// GET /api/stats/overview
router.get("/overview", statisticsController.getOverview);

export { router as statsRoutes };
