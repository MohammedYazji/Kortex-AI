import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { settingsService } from "../services/settingsService";

export class SettingsController {
  // Toggle the focus mode
  toggleFocus = catchAsync(async (req: Request, res: Response) => {
    const { enabled } = req.body;

    const result = await settingsService.toggleFocusMode(enabled);

    res.status(200).json({
      status: "success",
      data: result,
    });
  });

  // Fetch the current focus mode status
  getStatus = catchAsync(async (req: Request, res: Response) => {
    const settings = await settingsService.getCurrentSettings();

    res.status(200).json({
      status: "success",
      data: settings,
    });
  });
}

export const settingsController = new SettingsController();
