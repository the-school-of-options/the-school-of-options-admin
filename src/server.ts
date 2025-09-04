import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { Database, Resource } from "@adminjs/mongoose";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { adminOptions } from "./config/admin.config.js";
import { connectDB } from "./config/database.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- AdminJS Setup ---
async function setupAdmin(port: number) {
  AdminJS.registerAdapter({ Database, Resource });

  const admin = new AdminJS(adminOptions);

  // if (process.env.NODE_ENV === "development") {
  // }
  admin.watch();
  console.log("AdminJS is watching for component changes...");

  const app = express();

  const publicPath = path.resolve(__dirname, "../../public");
  console.log(`Serving static files from: ${publicPath}`);
  app.use(express.static(publicPath));

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(admin, {
    authenticate: async (email: string, password: string) => {
      return {
        email: "hello@theschoolofoptions.com",
        role: "admin",
        id: "admin-user",
      };
    },
    cookiePassword: "ABbfibrirbOEUFBkbfrbHjahsj",
    cookieName: "theschoolofoptions-admin-session",
  });

  app.use(admin.options.rootPath, adminRouter);

  app.get("/", (_, res) => {
    res.send(`
            <h1>The School of Options Admin Service</h1>
            <p>Visit <a href="/admin">/admin</a> for the Admin Panel.</p>
            <p>Login with email: hello@theschoolofoptions.com</p>
            <hr>
            <small>Authentication is enabled. You will be redirected to login if not authenticated.</small>
        `);
  });

  app.listen(port, () => {
    console.log(
      `AdminJS started on http://localhost:${port}${admin.options.rootPath}`
    );
    console.log(`Login with email: hello@theschoolofoptions.com`);
  });
}

async function start() {
  // if (!process.env.MONGO_URI) {
  //   console.error("MONGO_URI not found in .env file. Please add it.");
  //   process.exit(1);
  // }

  // if (
  //   !process.env.ADMIN_EMAIL ||
  //   !process.env.ADMIN_PASSWORD ||
  //   !process.env.SESSION_SECRET
  // ) {
  //   console.error(
  //     "Authentication configuration missing. Please ensure ADMIN_EMAIL, ADMIN_PASSWORD, and SESSION_SECRET are set in .env file."
  //   );
  //   process.exit(1);
  // }

  const port = parseInt(process.env.PORT || "3001");

  await connectDB(
    "mongodb+srv://tech:w4k4qEYbgSA1jdHc@cluster0.mk4kiod.mongodb.net/school-of-options?retryWrites=true&w=majority&appName=Cluster0"
  );
  await setupAdmin(port);
}

start();
