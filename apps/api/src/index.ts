import express, { Response, Request, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/env";
import { globalErrorHandler } from "./middlewares/errorMiddleware";
import { AppError } from "./errors/AppError";
import { notificationRoutes } from "./routes/notificationRoutes";
import { settingsRouter } from "./routes/settingsRoutes";

const bootstrap = async () => {
  // SETUP EXPRESS
  const app = express();

  // USE MIDDLEWARES
  app.use(express.json());
  app.use(cors());

  // ROUTES
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/settings", settingsRouter);

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
