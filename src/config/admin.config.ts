import { Resource, Database } from "@adminjs/typeorm";
import AdminJS, { AdminJSOptions } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { User } from "../entities/user.entity.js";
import { Subscribers } from "../entities/subscriber.entity.js";
import { AppDataSource } from "./database.js";
import { Webinar } from "../entities/webinar.entity.js";

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
          properties: {
            // Hide OTP-related columns
            otpCode: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
            otpExpiresAt: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
            otpAttempts: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
            otpLastSentAt: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
            otpVerified: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
            otpType: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
            googleId: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
            isGoogleAcc: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
            cognitoId: {
              isVisible: {
                list: false,
                edit: false,
                show: false,
                filter: false,
              },
            },
          },
          actions: {
            new: { isAccessible: true },
            edit: { isAccessible: true },
            delete: { isAccessible: true },
          },
        },
      },
      {
        resource: Subscribers,
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
      void password;
      if (email === "tech@atomclass.com") {
        return {
          email: "tech@atomclass.com",
          role: "admin",
          id: "admin-user",
        };
      }
      return null;
    },
    cookiePassword: "ABbfibrirbOEUFBkbfrbHjahsj",
    cookieName: "theschoolofoptions-admin-session",
  });

  adminJs.watch();
  return { router, adminJs };
};
