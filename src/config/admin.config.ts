import { Resource, Database } from "@adminjs/typeorm";
import AdminJS, { AdminJSOptions } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { User, UserRole } from "../entities/user.entity.js";
import { AppDataSource } from "./database.js";
import { Webinar } from "../entities/webinar.entity.js";
import { authenticateWithCognito } from "../services/cognito-auth.service.js";
import { ComponentLoader } from "adminjs";
import { Parser } from "json2csv";

export const RegisterAdminJS = async () => {
  // Register the adapter BEFORE creating AdminJS instance
  AdminJS.registerAdapter({ Database, Resource });

  // Create component loader
  const componentLoader = new ComponentLoader();

  // Ensure the database is initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const adminJs = new AdminJS({
    componentLoader,
    resources: [
      {
        resource: User,
        options: {
          id: "super-admin-users",
          navigation: {
            name: "User Management",
            icon: "Users",
          },
          properties: {
            fullName: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 1,
            },
            email: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 2,
            },
            createdAt: {
              isVisible: { list: true, filter: true, show: true, edit: false },
              position: 3,
            },
            role: {
              isVisible: { list: false, filter: true, show: true, edit: true },
              position: 4,
              availableValues: [
                { value: UserRole.SUPER_ADMIN, label: "Super-Admin" },
                { value: UserRole.USER, label: "User" },
              ],
            },
            id: { isVisible: { list: false, filter: false, show: true, edit: false } },
            cognitoId: { isVisible: false },
            googleId: { isVisible: false },
            isGoogleAcc: { isVisible: false },
            isVerified: { isVisible: { list: false, filter: true, show: true, edit: true } },
            isActive: { isVisible: { list: false, filter: true, show: true, edit: true } },
            lastLogin: { isVisible: { list: false, filter: false, show: true, edit: false } },
            loginCount: { isVisible: { list: false, filter: false, show: true, edit: false } },
            updatedAt: { isVisible: { list: false, filter: false, show: true, edit: false } },
          },
          listProperties: ["fullName", "email", "createdAt"],
          filterProperties: ["fullName", "email", "role", "createdAt", "isVerified", "isActive"],
          actions: {
            list: {
              before: async (request: any) => {
                if (!request.query?.["filters.role"]) {
                  request.query = request.query || {};
                  request.query["filters.role"] = UserRole.SUPER_ADMIN;
                }
                return request;
              },
            },
            exportCsv: {
              actionType: "resource",
              icon: "Download",
              label: "Export CSV",
              isVisible: true,
              component: false,
              handler: async (_request: any, response: any) => {
                try {
                  const userRepo = AppDataSource.getRepository(User);
                  const webinarRepo = AppDataSource.getRepository(Webinar);

                  const users = await userRepo.find({
                    where: { role: UserRole.SUPER_ADMIN },
                    order: { createdAt: 'DESC' },
                    take: 10000
                  });

                  if (users.length === 0) {
                    return {
                      notice: {
                        message: 'No records found to export',
                        type: 'info',
                      },
                    };
                  }

                  const csvData = await Promise.all(
                    users.map(async (user) => {
                      const webinarCount = await webinarRepo.count({
                        where: { email: user.email },
                      });

                      return {
                        "Full Name": user.fullName || '',
                        "Email": user.email || '',
                        "Created At": user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
                        "Is Verified": user.isVerified ? 'Yes' : 'No',
                        "Is Active": user.isActive ? 'Yes' : 'No',
                        "Last Login": user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
                        "Login Count": user.loginCount || 0,
                        "Webinars Enrolled": webinarCount,
                      };
                    })
                  );

                  const parser = new Parser({
                    fields: ["Full Name", "Email", "Created At", "Is Verified", "Is Active", "Last Login", "Login Count", "Webinars Enrolled"],
                  });
                  const csv = parser.parse(csvData);

                  const fileName = `super-admin-users-${new Date().toISOString().split('T')[0]}.csv`;
                  
                  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
                  response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                  response.setHeader('Content-Length', Buffer.byteLength(csv).toString());

                  return response.send(csv);
                } catch (error: any) {
                  console.error("Error exporting CSV:", error);
                  return {
                    notice: {
                      message: `Error exporting CSV: ${error.message}`,
                      type: 'error',
                    },
                  };
                }
              },
            },
            new: { isAccessible: true },
            edit: { isAccessible: true },
            delete: { isAccessible: true },
          },
        },
      },
      {
        resource: User,
        options: {
          id: "user-roles",
          navigation: {
            name: "User Management",
            icon: "Users",
          },
          properties: {
            fullName: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 1,
            },
            email: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 2,
            },
            mobileNumber: { 
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 3,
            },
            createdAt: {
              isVisible: { list: true, filter: true, show: true, edit: false },
              position: 4,
            },
            role: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 5,
              availableValues: [
                { value: UserRole.SUPER_ADMIN, label: "Super-Admin" },
                { value: UserRole.USER, label: "User" },
              ],
            },
            id: { isVisible: { list: false, filter: false, show: true, edit: false } },
            cognitoId: { isVisible: false },
            googleId: { isVisible: false },
            isGoogleAcc: { isVisible: false },
            isVerified: { isVisible: { list: false, filter: true, show: true, edit: true } },
            isActive: { isVisible: { list: false, filter: true, show: true, edit: true } },
            lastLogin: { isVisible: { list: false, filter: false, show: true, edit: false } },
            loginCount: { isVisible: { list: false, filter: false, show: true, edit: false } },
            updatedAt: { isVisible: { list: false, filter: false, show: true, edit: false } },
          },
          listProperties: ["fullName", "email", "mobileNumber", "createdAt", "role"],
          filterProperties: ["fullName", "email", "role", "createdAt", "isVerified", "isActive"],
          actions: {
            list: {
              before: async (request: any) => {
                if (!request.query?.["filters.role"]) {
                  request.query = request.query || {};
                  request.query["filters.role"] = UserRole.USER;
                }
                return request;
              },
            },
            exportCsv: {
              actionType: "resource",
              icon: "Download",
              label: "Export CSV",
              isVisible: true,
              component: false,
              handler: async (_request: any, response: any) => {
                try {
                  const userRepo = AppDataSource.getRepository(User);
                  const webinarRepo = AppDataSource.getRepository(Webinar);

                  const users = await userRepo.find({
                    where: { role: UserRole.USER },
                    order: { createdAt: 'DESC' },
                    take: 10000
                  });

                  if (users.length === 0) {
                    return {
                      notice: {
                        message: 'No records found to export',
                        type: 'info',
                      },
                    };
                  }

                  const csvData = await Promise.all(
                    users.map(async (user) => {
                      const webinarCount = await webinarRepo.count({
                        where: { email: user.email },
                      });

                      return {
                        "Full Name": user.fullName || '',
                        "Email": user.email || '',
                        "Mobile Number": user.mobileNumber || '',
                        "Created At": user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
                        "Is Verified": user.isVerified ? 'Yes' : 'No',
                        "Is Active": user.isActive ? 'Yes' : 'No',
                        "Last Login": user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
                        "Login Count": user.loginCount || 0,
                        "Webinars Enrolled": webinarCount,
                      };
                    })
                  );

                  const parser = new Parser({
                    fields: ["Full Name", "Email", "Mobile Number", "Created At", "Is Verified", "Is Active", "Last Login", "Login Count", "Webinars Enrolled"],
                  });
                  const csv = parser.parse(csvData);

                  const fileName = `users-${new Date().toISOString().split('T')[0]}.csv`;
                  
                  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
                  response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                  response.setHeader('Content-Length', Buffer.byteLength(csv).toString());

                  return response.send(csv);
                } catch (error: any) {
                  console.error("Error exporting CSV:", error);
                  return {
                    notice: {
                      message: `Error exporting CSV: ${error.message}`,
                      type: 'error',
                    },
                  };
                }
              },
            },
            new: { isAccessible: true },
            edit: { isAccessible: true },
            delete: { isAccessible: true },
          },
        },
      },
      {
        resource: Webinar,
        options: {
          id: "webinars",
          navigation: {
            name: "Webinars",
            icon: "Video",
          },
          properties: {
            email: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 1,
            },
            name: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 2,
            },
            webinarLink: {
              isVisible: { list: false, filter: false, show: true, edit: true },
              position: 3,
            },
            source: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 4,
            },
            preferedLanguage: {
              isVisible: { list: true, filter: true, show: true, edit: true },
              position: 5,
            },
            createdAt: {
              isVisible: { list: true, filter: true, show: true, edit: false },
              position: 6,
            },
          },
          listProperties: ["email", "name", "source", "preferedLanguage", "createdAt"],
          filterProperties: ["email", "name", "source", "preferedLanguage", "createdAt"],
          actions: {
            exportCsv: {
              actionType: "resource",
              icon: "Download",
              label: "Export CSV",
              isVisible: true,
              component: false,
              handler: async (_request: any, response: any) => {
                try {
                  const webinarRepo = AppDataSource.getRepository(Webinar);

                  const webinars = await webinarRepo.find({
                    order: { createdAt: 'DESC' },
                    take: 10000
                  });

                  if (webinars.length === 0) {
                    return {
                      notice: {
                        message: 'No records found to export',
                        type: 'info',
                      },
                    };
                  }

                  const csvData = webinars.map((webinar) => ({
                    "Email": webinar.email || '',
                    "Name": webinar.name || '',
                    "Webinar Link": webinar.webinarLink || '',
                    "Source": webinar.source || '',
                    "Preferred Language": webinar.preferedLanguage || '',
                    "Created At": webinar.createdAt ? new Date(webinar.createdAt).toLocaleDateString() : '',
                  }));

                  const parser = new Parser({
                    fields: ["Email", "Name", "Webinar Link", "Source", "Preferred Language", "Created At"],
                  });
                  const csv = parser.parse(csvData);

                  const fileName = `webinars-${new Date().toISOString().split('T')[0]}.csv`;
                  
                  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
                  response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                  response.setHeader('Content-Length', Buffer.byteLength(csv).toString());

                  return response.send(csv);
                } catch (error: any) {
                  console.error("Error exporting CSV:", error);
                  return {
                    notice: {
                      message: `Error exporting CSV: ${error.message}`,
                      type: 'error',
                    },
                  };
                }
              },
            },
            new: { isAccessible: true },
            edit: { isAccessible: true },
            delete: { isAccessible: true },
          },
        },
      },
    ],
    branding: {
      companyName: "The School of Options",
      logo: "/logo.png",
      withMadeWithLove: false,
    },
    assets: {
      styles: ["/custom-admin-styles.css"],
    },
    theme: {
      colors: {
        primary100: "#1e4356",
        primary80: "#2b6078",
        primary60: "#397c9a",
        primary40: "#4fa6d5",
        primary20: "#73bde3",
        accent: "#4fa6d5",
        filterBg: "#f8f9fa",
        hoverBg: "#e2e6ea",
      },
    },
    rootPath: "/admin",
  } as AdminJSOptions);

  const router = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
    authenticate: async (email: string, password: string) => {
      console.log("🔐 Attempting authentication for:", email);

      const cognitoUser = await authenticateWithCognito(email, password);

      console.log("Cognito authentication result:", cognitoUser);

      if (!cognitoUser) {
        console.log("❌ Authentication failed - Invalid credentials or not a Super-Admin");
        return null;
      }

      console.log("✅ Authentication successful for Super-Admin:", cognitoUser.email);

      return {
        email: cognitoUser.email,
        username: cognitoUser.username,
        role: "Super-Admin",
        groups: cognitoUser.groups,
      };
    },
    cookiePassword: process.env.ADMIN_COOKIE_PASSWORD || "ABbfibrirbOEUFBkbfrbHjahsj",
    cookieName: "theschoolofoptions-admin-session",
  });

  adminJs.watch();
  return { router, adminJs };
};