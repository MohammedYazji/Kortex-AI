import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notificationService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../errors/AppError";

export class NotificationController {
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
      const notification = await notificationService.create({
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
      const notifications = await notificationService.findAll();

      res.status(200).json({
        status: "success",
        results: notifications.length,
        data: {
          notifications,
        },
      });
    },
  );

  // GET ALL NOTIFICATIONS FOR EACH CATEGORY
  getCategorized = catchAsync(async (req: Request, res: Response) => {
    const data = await notificationService.getCategorizedNotifications();
    res.status(200).json({ status: "success", data });
  });

  // GET NOTIFICATION BY ID
  public getNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return next(new AppError("Invalid ID format", 400));
      }

      const notification = await notificationService.findById(id);

      if (!notification) {
        return next(new AppError("No notification found with this ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: { notification },
      });
    },
  );

  // DELETE A NOTIFICATION
  public deleteNotification = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return next(new AppError("Invalid ID format", 400));
      }

      const deleted = await notificationService.delete(id);

      if (!deleted) {
        return next(new AppError("No notification found with that ID", 404));
      }

      res.status(204).json({
        status: "success",
        data: null,
      });
    },
  );

  // DELETE ALL NOTIFICATIONS
  public clearAllNotifications = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await notificationService.deleteAll();

      res.status(204).json({
        status: "success",
        data: null,
      });
    },
  );
}

export const notificationController = new NotificationController();
