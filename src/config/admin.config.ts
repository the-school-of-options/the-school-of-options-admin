import { Resource, Database } from "@adminjs/typeorm";
import AdminJS, { AdminJSOptions } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { User, UserRole } from "../entities/user.entity.js";
import { AppDataSource } from "./database.js";
import { Webinar } from "../entities/webinar.entity.js";
import { authenticateWithCognito } from "../services/cognito-auth.service.js";
import { Parser } from "json2csv";

export const RegisterAdminJS = async () => {
  // Register the adapter BEFORE creating AdminJS instance
  AdminJS.registerAdapter({ Database, Resource });

  // Ensure the database is initialized
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const adminJs = new AdminJS({
    // Instead of databases, pass resources directly
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
            // Show only these fields in the list view
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
            // Hide all other fields from list
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
                // Filter to show only Super-Admin users
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
              label: "Export to CSV",
              handler: async (request: any, _response: any, context: any) => {
                const { resource } = context;

                // Get all records based on current filters
                const { records } = await resource.find(request.query, {
                  limit: 10000,
                });

                const webinarRepo = AppDataSource.getRepository(Webinar);

                // Prepare data with webinar enrollment count
                const csvData = await Promise.all(
                  records.map(async (record: any) => {
                    const webinarCount = await webinarRepo.count({
                      where: { email: record.params.email },
                    });

                    return {
                      fullName: record.params.fullName,
                      email: record.params.email,
                      createdAt: record.params.createdAt,
                      webinarEnrolled: webinarCount,
                    };
                  })
                );

                const parser = new Parser({
                  fields: ["fullName", "email", "createdAt", "webinarEnrolled"],
                });
                const csv = parser.parse(csvData);

                return {
                  headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename=super-admin-users-${new Date().toISOString().split('T')[0]}.csv`,
                  },
                  body: csv,
                };
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
              mobileNumber: { isVisible: true },
            createdAt: {
              isVisible: { list: true, filter: true, show: true, edit: false },
              position: 3,
            },
            role: {
              isVisible: { list: true, filter: true, show: true, edit: true },
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
          listProperties: ["fullName", "email", "createdAt", "role"],
          filterProperties: ["fullName", "email", "role", "createdAt", "isVerified", "isActive"],
          actions: {
            list: {
              before: async (request: any) => {
                // Filter to show only regular Users
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
              label: "Export to CSV",
              handler: async (request: any, _response: any, context: any) => {
                const { resource } = context;

                // Get all records based on current filters
                const { records } = await resource.find(request.query, {
                  limit: 10000,
                });

                const webinarRepo = AppDataSource.getRepository(Webinar);

                // Prepare data with webinar enrollment count
                const csvData = await Promise.all(
                  records.map(async (record: any) => {
                    const webinarCount = await webinarRepo.count({
                      where: { email: record.params.email },
                    });

                    return {
                      fullName: record.params.fullName,
                      email: record.params.email,
                      createdAt: record.params.createdAt,
                      mobileNumber: record.params.mobileNumber,
                      webinarEnrolled: webinarCount,
                    };
                  })
                );

                const parser = new Parser({
                  fields: ["fullName", "email", "createdAt", "mobileNumber", "webinarEnrolled"],
                });
                const csv = parser.parse(csvData);

                return {
                  headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename=users-${new Date().toISOString().split('T')[0]}.csv`,
                  },
                  body: csv,
                };
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

      // Authenticate with AWS Cognito and verify Super-Admin group membership
      const cognitoUser = await authenticateWithCognito(email, password);

      console.log("Cognito authentication result:", cognitoUser);

      if (!cognitoUser) {
        console.log("❌ Authentication failed - Invalid credentials or not a Super-Admin");
        return null;
      }

      console.log("✅ Authentication successful for Super-Admin:", cognitoUser.email);

      // Return user session data
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
