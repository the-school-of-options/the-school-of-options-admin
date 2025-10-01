import express from "express";
import path from "path";
import dotenv from "dotenv";
import { initDB } from "./config/database.js";
import { RegisterAdminJS } from "./config/admin.config.js";

dotenv.config();

async function setupAdmin(port: number) {
  try {
    // Initialize database first
    await initDB();
    
    // Wait a moment to ensure the connection is fully established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now create AdminJS with the initialized database
    const { adminJs, router: adminJsRouter } = await RegisterAdminJS();
    
    const app = express();
    const publicPath = path.resolve(process.cwd(), "public"); // Use process.cwd() instead of __dirname
    console.log(`Serving static files from: ${publicPath}`);
    app.use(express.static(publicPath));

    app.use(adminJs.options.rootPath, adminJsRouter);

    app.get("/", (_, res) => {
      res.send(`
        <h1>The School of Options Admin Service</h1>
        <p>Visit <a href="/admin">/admin</a> for the Admin Panel.</p>
        <hr>
        <p><strong>🔐 AWS Cognito Authentication Enabled</strong></p>
        <p>Only users in the <strong>Super-Admin</strong> group can access this admin panel.</p>
        <small>You will be redirected to login if not authenticated.</small>
      `);
    });

    app.listen(port, () => {
      console.log(
        `AdminJS started on http://localhost:${port}${adminJs.options.rootPath}`
      );
      console.log(`🔐 AWS Cognito Authentication: Only Super-Admin group members can login`);
    });
  } catch (error) {
    console.error("Failed to setup admin:", error);
    process.exit(1);
  }
}

async function start() {
  try {
    await setupAdmin(9000);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();