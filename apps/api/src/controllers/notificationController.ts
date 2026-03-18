import { notifications } from "./../db/schema";
import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notificationService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../errors/AppError";

export class NotificationController {
  private notificationService = new NotificationService();
  // CREATE A NEW NOTIFICATION
  public createNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // FETCH THE DATA FROM THE REQUEST
      const { title, body, senderName, appName, packageName, deviceTimestamp } =
        req.body;

      // VALIDATE THE MAIN DATA
      if (!title || !body) {
        return next(new AppError("Title and Body are required", 400));
      }

      // THE CREATION PROCESS USING THE SERVICE
      const notification = await this.notificationService.create({
        title,
        body,
        senderName,
        appName,
        packageName,
        deviceTimestamp: deviceTimestamp
          ? new Date(deviceTimestamp)
          : new Date(),
      });

      res.status(201).json({
        status: "success",
        data: { notification },
      });
    },
  );

  // GET ALL NOTIFICATIONS
  public getAllNotifications = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const notifications = await this.notificationService.findAll();

      res.status(200).json({
        status: "success",
        results: notifications.length,
        data: {
          notifications,
        },
      });
    },
  );

  // GET NOTIFICATION BY ID
  public getNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return next(new AppError("Invalid ID format", 400));
      }

      const notification = await this.notificationService.findById(id);

      if (!notification) {
        return next(new AppError("No notification found with this ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: { notification },
      });
    },
  );
}
