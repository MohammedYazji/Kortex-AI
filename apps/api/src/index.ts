import express, { Response, Request } from "express";
import cors from "cors";
import { config } from "./config/env";

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

  // START SERVER
  app.listen(config.PORT, () => {
    console.log(`Kortex Server listening on port: ${config.PORT}`);
  });
};
bootstrap();
