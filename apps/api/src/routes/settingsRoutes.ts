import { Router } from "express";
import { settingsController } from "../controllers/settingsController";

const router = Router();

router.post("/focus", settingsController.toggleFocus);

export { router as settingsRouter };
