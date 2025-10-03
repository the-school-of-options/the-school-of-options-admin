import express from "express";
import path from "path";
import dotenv from "dotenv";
import { initDB, AppDataSource } from "./config/database.js";
import { RegisterAdminJS } from "./config/admin.config.js";
import { User, UserRole } from "./entities/user.entity.js";
import { Webinar } from "./entities/webinar.entity.js";
import { Parser } from "json2csv";

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
    const publicPath = path.resolve(process.cwd(), "public");
    console.log(`Serving static files from: ${publicPath}`);
    app.use(express.static(publicPath));

    // ============================================
    // CSV EXPORT ROUTES - MUST BE BEFORE ADMINJS
    // ============================================
    
    // Export Super Admin Users
    app.get("/admin/export/super-admins", async (_req, res) => {
      try {
        const userRepo = AppDataSource.getRepository(User);
        const webinarRepo = AppDataSource.getRepository(Webinar);

        // Fetch super admin users
        const users = await userRepo.find({
          where: { role: UserRole.SUPER_ADMIN },
          order: { createdAt: 'DESC' },
          take: 10000
        });

        if (users.length === 0) {
          return res.status(404).send("No super admin users found");
        }

        // Prepare data with webinar enrollment count
        const csvData = await Promise.all(
          users.map(async (user) => {
            const webinarCount = await webinarRepo.count({
              where: { email: user.email },
            });

            return {
              "Full Name": user.fullName || '',
              "Email": user.email || '',
              "Created At": user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
              "Is Verified": user.isVerified ? 'Yes' : 'No',
              "Is Active": user.isActive ? 'Yes' : 'No',
              "Last Login": user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : 'Never',
              "Login Count": user.loginCount || 0,
              "Webinars Enrolled": webinarCount,
            };
          })
        );

        const parser = new Parser({
          fields: ["Full Name", "Email", "Created At", "Is Verified", "Is Active", "Last Login", "Login Count", "Webinars Enrolled"],
        });
        const csv = parser.parse(csvData);

        // Force download with proper headers
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="super-admin-users-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Content-Length', Buffer.byteLength(csv).toString());
        
        return res.status(200).send(csv);
      } catch (error) {
        console.error("Error exporting super admins:", error);
        return res.status(500).send("Error generating CSV");
      }
    });

    // Export Regular Users
    app.get("/admin/export/users", async (_req, res) => {
      try {
        const userRepo = AppDataSource.getRepository(User);
        const webinarRepo = AppDataSource.getRepository(Webinar);

        // Fetch regular users
        const users = await userRepo.find({
          where: { role: UserRole.USER },
          order: { createdAt: 'DESC' },
          take: 10000
        });

        if (users.length === 0) {
          return res.status(404).send("No users found");
        }

        // Prepare data with webinar enrollment count
        const csvData = await Promise.all(
          users.map(async (user) => {
            const webinarCount = await webinarRepo.count({
              where: { email: user.email },
            });

            return {
              "Full Name": user.fullName || '',
              "Email": user.email || '',
              "Mobile Number": user.mobileNumber || '',
              "Created At": user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
              "Is Verified": user.isVerified ? 'Yes' : 'No',
              "Is Active": user.isActive ? 'Yes' : 'No',
              "Last Login": user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : 'Never',
              "Login Count": user.loginCount || 0,
              "Webinars Enrolled": webinarCount,
            };
          })
        );

        const parser = new Parser({
          fields: ["Full Name", "Email", "Mobile Number", "Created At", "Is Verified", "Is Active", "Last Login", "Login Count", "Webinars Enrolled"],
        });
        const csv = parser.parse(csvData);

        // Force download with proper headers
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Content-Length', Buffer.byteLength(csv).toString());
        
        return res.status(200).send(csv);
      } catch (error) {
        console.error("Error exporting users:", error);
        return res.status(500).send("Error generating CSV");
      }
    });

    // Export Webinars
    app.get("/admin/export/webinars", async (_req, res) => {
      try {
        const webinarRepo = AppDataSource.getRepository(Webinar);

        // Fetch all webinars
        const webinars = await webinarRepo.find({
          order: { createdAt: 'DESC' },
          take: 10000
        });

        if (webinars.length === 0) {
          return res.status(404).send("No webinars found");
        }

        // Prepare data for CSV
        const csvData = webinars.map((webinar) => ({
          "Email": webinar.email || '',
          "Name": webinar.name || '',
          "Webinar Link": webinar.webinarLink || '',
          "Source": webinar.source || '',
          "Preferred Language": webinar.preferedLanguage || '',
          "Created At": webinar.createdAt ? new Date(webinar.createdAt).toISOString().split('T')[0] : '',
        }));

        const parser = new Parser({
          fields: ["Email", "Name", "Webinar Link", "Source", "Preferred Language", "Created At"],
        });
        const csv = parser.parse(csvData);

        // Force download with proper headers
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="webinars-${new Date().toISOString().split('T')[0]}.csv"`);
        res.setHeader('Content-Length', Buffer.byteLength(csv).toString());
        
        return res.status(200).send(csv);
      } catch (error) {
        console.error("Error exporting webinars:", error);
        return res.status(500).send("Error generating CSV");
      }
    });

    // ============================================
    // MOUNT ADMINJS ROUTER AFTER CUSTOM ROUTES
    // ============================================
    app.use(adminJs.options.rootPath, adminJsRouter);

    // Home page with links
    app.get("/", (_, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>The School of Options Admin</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #1e4356;
              border-bottom: 2px solid #4fa6d5;
              padding-bottom: 10px;
            }
            h2 {
              color: #2b6078;
              margin-top: 30px;
            }
            .btn {
              display: inline-block;
              padding: 10px 20px;
              margin: 5px;
              background: #4fa6d5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              transition: background 0.3s;
            }
            .btn:hover {
              background: #397c9a;
            }
            .btn-primary {
              background: #1e4356;
              font-size: 18px;
              padding: 12px 30px;
            }
            .btn-primary:hover {
              background: #2b6078;
            }
            .export-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .info {
              background: #e3f2fd;
              padding: 15px;
              border-left: 4px solid #4fa6d5;
              margin-top: 20px;
            }
            ul {
              list-style: none;
              padding: 0;
            }
            li {
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎓 The School of Options Admin Service</h1>
            
            <p>
              <a href="/admin" class="btn btn-primary">📊 Open Admin Panel</a>
            </p>
            
            <div class="export-section">
              <h2>📥 Direct CSV Exports</h2>
              <ul>
                <li>
                  <a href="/admin/export/super-admins" download class="btn">
                    👤 Export Super Admin Users
                  </a>
                </li>
                <li>
                  <a href="/admin/export/users" download class="btn">
                    👥 Export Regular Users
                  </a>
                </li>
                <li>
                  <a href="/admin/export/webinars" download class="btn">
                    📹 Export Webinars
                  </a>
                </li>
              </ul>
            </div>
            
            <div class="info">
              <strong>🔐 Security Notice</strong>
              <p>AWS Cognito Authentication is enabled. Only users in the <strong>Super-Admin</strong> group can access the admin panel.</p>
              <small>You will be redirected to login if not authenticated.</small>
            </div>
          </div>
        </body>
        </html>
      `);
    });

    app.listen(port, () => {
      console.log("========================================");
      console.log("   The School of Options Admin Server   ");
      console.log("========================================");
      console.log(`✅ Server started on port ${port}`);
      console.log(`📊 AdminJS Panel: http://localhost:${port}${adminJs.options.rootPath}`);
      console.log(`🏠 Home Page: http://localhost:${port}`);
      console.log("----------------------------------------");
      console.log("📥 CSV Export Endpoints:");
      console.log(`   • Super Admins: http://localhost:${port}/admin/export/super-admins`);
      console.log(`   • Regular Users: http://localhost:${port}/admin/export/users`);
      console.log(`   • Webinars: http://localhost:${port}/admin/export/webinars`);
      console.log("----------------------------------------");
      console.log("🔐 Authentication: AWS Cognito (Super-Admin group only)");
      console.log("========================================");
    });
  } catch (error) {
    console.error("❌ Failed to setup admin:", error);
    process.exit(1);
  }
}

async function start() {
  try {
    await setupAdmin(9000);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();