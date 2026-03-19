import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { settingsService } from "../services/settingsService";

export class SettingsController {
  toggleFocus = catchAsync(async (req: Request, res: Response) => {
    const { enabled } = req.body;

    const result = await settingsService.toggleFocusMode(enabled);

    res.status(200).json({
      status: "success",
      data: result,
    });
  });
}

export const settingsController = new SettingsController();
