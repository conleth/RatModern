import { FastifyInstance } from "fastify";
import { z } from "zod";

import { getTicketingAdapter } from "../ticketing/index.js";
import { TicketingContext } from "../ticketing/ticketingAdapter.js";

const linkSchema = z.object({
  taskId: z.string(),
  workItemId: z.string(),
  role: z
    .enum([
      "architect",
      "developer",
      "tester",
      "business-analyst",
      "data-scientist",
      "executive"
    ])
    .optional(),
  metadata: z.record(z.any()).optional()
});

const createSchema = z.object({
  ticketType: z.enum(["story", "task", "defect", "epic"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  relatedItems: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export function registerTicketingRoutes(app: FastifyInstance) {
  app.post("/ticketing/rally/link", async (request, reply) => {
    const parseResult = linkSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.badRequest("Invalid link payload");
    }

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return reply.unauthorized("Missing Rally access token");
    }

    const accessToken = authorization.replace("Bearer ", "");

    const adapter = getTicketingAdapter("rally");

    const context: TicketingContext = {
      accessToken,
      userRole: parseResult.data.role ?? "developer"
    };

    try {
      await adapter.linkTask(parseResult.data, context);
      return reply.status(204).send();
    } catch (error) {
      request.log.error({ err: error }, "Failed to link Rally work item");
      return reply.internalServerError("Failed to link Rally work item");
    }
  });

  app.post("/ticketing/rally/create", async (request, reply) => {
    const parseResult = createSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.badRequest(parseResult.error.message);
    }

    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return reply.unauthorized("Missing Rally access token");
    }

    const accessToken = authorization.replace("Bearer ", "");

    const adapter = getTicketingAdapter("rally");

    const context: TicketingContext = {
      accessToken,
      userRole: "developer"
    };

    try {
      const result = await adapter.createTask(parseResult.data, context);
      return reply.status(201).send(result);
    } catch (error) {
      request.log.error({ err: error }, "Failed to create Rally ticket");
      const errorMsg = error instanceof Error ? error.message : "Failed to create ticket";
      return reply.internalServerError(errorMsg);
    }
  });
}
