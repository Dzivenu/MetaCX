import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

// Add your other routes here
app.get("/", (c) => {
  return c.json({
    message: "Suku Learning Platform API v0.0.1",
    status: "Authentication Foundation",
    features: [
      "User registration and login system",
      "Password reset functionality",
      "Basic user profile creation",
      "Role assignment (Student, Organization Owner, Institution Admin)",
      "Email verification",
      "Basic dashboard routing by role",
    ],
  });
});

// Simple docs endpoint
app.get("/docs", (c) => {
  return c.json({
    title: "Suku Learning Platform API",
    version: "0.0.1",
    description:
      "Authentication Foundation - Basic user authentication and account management",
    endpoints: {
      "GET /": "API information",
      "POST /auth/sign-up": "User registration",
      "POST /auth/sign-in": "User login",
      "POST /auth/sign-out": "User logout",
      "POST /auth/forget-password": "Password reset",
      "GET /auth/verify-email": "Email verification",
    },
  });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
