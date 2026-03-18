import express, { Response, Request, NextFunction } from "express";
import cors from "cors";
import { config } from "./config/env";
import { globalErrorHandler } from "./middlewares/errorMiddleware";
import { AppError } from "./errors/AppError";

const bootstrap = async () => {
  // SETUP EXPRESS
  const app = express();

  // USE MIDDLEWARES
  app.use(express.json());
  app.use(cors());

  // ROUTES
  app.get("/", async (req: Request, res: Response) => {
    res.send("Let's begin the new journey");
  });

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
