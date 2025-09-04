import { type AdminJSOptions, ComponentLoader } from "adminjs";
import path from "path";
import { fileURLToPath } from "url";

import User from "../models/user.model.js";
import Subscriber from "../models/subscriber.model.js";
import TalkToUs from "../models/talktous.js";
import Newsletter from "../models/newsletter.js";
import Blog from "../models/blogs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register custom components
const componentLoader = new ComponentLoader();
const Components = {
  RichTextEditor: componentLoader.add(
    "RichTextEditor",
    path.resolve(__dirname, "../admin/components/RichText.tsx")
  ),
};

export const adminOptions: AdminJSOptions = {
  rootPath: "/admin",
  branding: {
    companyName: "The School of Options",
    withMadeWithLove: false,
  },
  componentLoader,
  resources: [
    {
      resource: User,
      options: {
        // Top-level item (no accordion group) by omitting navigation
        properties: {
          password: { isVisible: false },
          otp: { isVisible: { list: false, edit: false, show: false, filter: false } },
          googleId: { isVisible: { list: false, edit: false, show: false, filter: false } },
          isGoogleAcc: { isVisible: { list: false, edit: false, show: false, filter: false } },
          __v: { isVisible: false },
        },
        actions: {
          new: { isAccessible: true },
          edit: { isAccessible: true },
          delete: { isAccessible: true },
        },
      },
    },
    {
      resource: Subscriber,
      options: {
        navigation: { name: "Engagement", icon: "Email" },
        properties: { __v: { isVisible: false } },
      },
    },
    {
      resource: TalkToUs,
      options: {
        navigation: { name: "Engagement", icon: "ChatBubble" },
        properties: { __v: { isVisible: false } },
      },
    },
    {
      resource: Newsletter,
      options: {
        navigation: { name: "Content", icon: "DocumentText" },
        listProperties: ["title", "status", "updatedAt"],
        showProperties: ["title", "content", "status", "createdAt", "updatedAt"],
        properties: {
          __v: { isVisible: false },
          content: {
            type: "richtext" as any,
            components: {
              edit: Components.RichTextEditor,
              show: Components.RichTextEditor,
            },
          },
        },
      },
    },
    {
      resource: Blog,
      options: {
        navigation: { name: "Content", icon: "Document" },
        listProperties: ["title", "slug", "status", "readingTime", "updatedAt"],
        showProperties: [
          "title",
          "slug",
          "displayPicture",
          "content",
          "status",
          "readingTime",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          __v: { isVisible: false },
          content: {
            type: "richtext" as any,
            components: {
              edit: Components.RichTextEditor,
              show: Components.RichTextEditor,
            },
          },
          slug: { isDisabled: true },
          readingTime: { isDisabled: true },
        },
      },
    },
  ],
};
