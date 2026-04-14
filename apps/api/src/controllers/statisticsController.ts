import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { statisticsService } from "../services/statisticsService";
export class StatisticsController {
  getOverview = catchAsync(async (req: Request, res: Response) => {
    const stats = await statisticsService.getOverviewStats();

    res.status(200).json({
      status: "success",
      data: stats,
    });
  });
}

export const statisticsController = new StatisticsController();
