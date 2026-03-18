// apps/api/src/middleware/errorMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";
import {
  handleDuplicateFieldsDB,
  handleForeignKeyViolationDB,
} from "../errors/errorHandlers";

const sendDevError = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendProdError = (err: any, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (config.NODE_ENV === "development") {
    sendDevError(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Postgres Error Codes
    if (err.code === "23505") error = handleDuplicateFieldsDB(err);
    if (err.code === "23503") error = handleForeignKeyViolationDB(err);

    sendProdError(error, res);
  }
};
