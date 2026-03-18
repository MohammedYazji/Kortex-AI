import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";

const router = Router();
const controller = new NotificationController();

router
  .route("/")
  .get(controller.getAllNotifications)
  .post(controller.createNotification)
  .delete(controller.clearAllNotifications);

router
  .route("/:id")
  .get(controller.getNotification)
  .delete(controller.deleteNotification);

export { router as notificationRoutes };
