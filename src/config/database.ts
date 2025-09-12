import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Subscribers } from "../entities/subscriber.entity.js";
import { Webinar } from "../entities/webinar.entity.js";
import { User } from "../entities/user.entity.js";

dotenv.config();

const ssl =
  process.env.DB_SSL === "false"
    ? undefined
    : // For RDS: you can start with rejectUnauthorized:false.
      // Later, switch to proper CA bundle for stronger security.
      { rejectUnauthorized: false };

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "theschoolofoptionsdatbase.cpm0s28o0c5k.ap-south-1.rds.amazonaws.com",
  port: 5432,
  username: "postgres",
  password: "TotalProfit1!",
  database: "theschoolofoptions",
  entities: [Subscribers, Webinar, User],
  synchronize: true,
  logging: false,
  ssl,
});

export async function initDB() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}
