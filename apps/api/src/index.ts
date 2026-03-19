import express, { Response, Request, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/env";
import { globalErrorHandler } from "./middlewares/errorMiddleware";
import { settingsService } from "./services/settingsService";
import { AppError } from "./errors/AppError";
import { notificationRoutes } from "./routes/notificationRoutes";
import { settingsRouter } from "./routes/settingsRoutes";
import { statsRoutes } from "./routes/statisticsRoutes";

const bootstrap = async () => {
  // SETUP EXPRESS
  const app = express();

  // USE MIDDLEWARES
  app.use(express.json());
  app.use(cors());

  // ROUTES
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/settings", settingsRouter);
  app.use("/api/v1/stats", statsRoutes);

  // SET THE APP SETTINGS
  try {
    await settingsService.getCurrentSettings();
    console.log("Default app settings initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize settings on startup:", error);
  }

  // HANDLE UNHANDLED ROUTES
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  // GLOBAL ERROR HANDLER
  app.use(globalErrorHandler);

  // START SERVER
  app.listen(config.PORT, () => {
    console.log(`Kortex Server listening on port: ${config.PORT}`);
  });
};
bootstrap();
