import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";

const router = Router();
const controller = new NotificationController();

router
  .route("/")
  .get(controller.getAllNotifications)
  .post(controller.createNotification);

router.route("/:id").get(controller.getNotification);

export { router as notificationRoutes };
