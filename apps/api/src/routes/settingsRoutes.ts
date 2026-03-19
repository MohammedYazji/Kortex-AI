import { Router } from "express";
import { settingsController } from "../controllers/settingsController";

const router = Router();

router.get("/focus", settingsController.getStatus);
router.post("/focus", settingsController.toggleFocus);

export { router as settingsRouter };
