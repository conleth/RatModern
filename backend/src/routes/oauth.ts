import { FastifyInstance } from "fastify";

import {
  exchangeRallyCode,
  startRallyOAuth
} from "../controllers/oauthController.js";

export function registerOAuthRoutes(app: FastifyInstance) {
  app.get("/oauth/rally/authorize", startRallyOAuth);

  app.get("/oauth/rally/callback", async (request, reply) => {
    const state =
      typeof request.query === "object" && request.query
        ? (request.query as Record<string, string>).state
        : undefined;

    // Placeholder view and redirect; production would set cookie and redirect to frontend.
    const targetUrl =
      process.env.CLIENT_ORIGIN ?? "http://localhost:5173/dashboard";
    const redirectUrl = state ? `${targetUrl}?state=${state}` : targetUrl;

    return reply.redirect(redirectUrl);
  });

  app.post("/oauth/rally/token", exchangeRallyCode);
}

