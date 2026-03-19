import { Router } from "express";
import { notificationController } from "../controllers/notificationController";

const router = Router();

router
  .route("/")
  .get(notificationController.getAllNotifications)
  .post(notificationController.createNotification)
  .delete(notificationController.clearAllNotifications);

router
  .route("/:id")
  .get(notificationController.getNotification)
  .delete(notificationController.deleteNotification);

export { router as notificationRoutes };
