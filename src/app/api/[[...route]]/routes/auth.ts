import { Hono } from "hono";
import { auth } from "@/server/db/better-auth";

const authRouter = new Hono();

// Better Auth handles all auth routes automatically
authRouter.all("/*", (c) => {
  return auth.handler(c.req.raw);
});

export { authRouter };
