import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";

const router = Router();
const controller = new NotificationController();

router.route("/").post(controller.createNotification);

export { router as notificationRoutes };
