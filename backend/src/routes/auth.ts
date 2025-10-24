import { FastifyInstance } from "fastify";
import { z } from "zod";

import { UserRole } from "../types/auth.js";

const roleSchema = z.enum([
  "architect",
  "developer",
  "tester",
  "business-analyst",
  "data-scientist",
  "executive"
]);

export function registerAuthRoutes(app: FastifyInstance) {
  app.get("/auth/mock-session", async () => {
    const {
      MOCK_USER_ID = "local-user",
      MOCK_USER_NAME = "Local User",
      MOCK_USER_EMAIL = "local@example.com",
      MOCK_USER_ROLE = "developer"
    } = process.env;

    const roleParse = roleSchema.safeParse(MOCK_USER_ROLE);
    const role: UserRole = roleParse.success
      ? roleParse.data
      : "developer";

    return {
      user: {
        id: MOCK_USER_ID,
        name: MOCK_USER_NAME,
        email: MOCK_USER_EMAIL,
        role
      }
    };
  });
}
