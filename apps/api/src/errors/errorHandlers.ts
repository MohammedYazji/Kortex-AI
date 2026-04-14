import { AppError } from "./AppError";

// Postgres Unique Constraint Error (e.g., duplicate device_id)
export const handleDuplicateFieldsDB = (err: any) => {
  const detail = err.detail;
  const message = `Duplicate field value: ${detail}. Please use another value!`;
  return new AppError(message, 400);
};

// Postgres Foreign Key Violation
export const handleForeignKeyViolationDB = (err: any) => {
  const message = `Invalid reference: The related record was not found.`;
  return new AppError(message, 400);
};
