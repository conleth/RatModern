import { FastifyInstance } from "fastify";

import { registerChecklistRoutes } from "./checklists.js";
import { registerAuthRoutes } from "./auth.js";
import { registerOAuthRoutes } from "./oauth.js";
import { registerTicketingRoutes } from "./ticketing.js";
import { registerQuestionnaireRoutes } from "./questionnaire.js";
import { registerSpvsRoutes } from "./spvs.js";

export function registerRoutes(app: FastifyInstance) {
  app.get("/healthz", async () => ({ status: "ok" }));

  registerAuthRoutes(app);
  registerOAuthRoutes(app);
  registerChecklistRoutes(app);
  registerQuestionnaireRoutes(app);
  registerSpvsRoutes(app);
  registerTicketingRoutes(app);
}
