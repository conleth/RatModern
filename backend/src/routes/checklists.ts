import { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  getAsvsChecklist,
  AsvsLevel,
  ApplicationType,
  asvsMetadata
} from "../lib/asvsData.js";
import { UserRole } from "../types/auth.js";

const checklistRequestSchema = z.object({
  level: z.enum(["L1", "L2", "L3"]),
  applicationType: z.enum(["web", "mobile", "api"]),
  role: z.enum([
    "architect",
    "developer",
    "tester",
    "business-analyst",
    "executive"
  ])
});

export function registerChecklistRoutes(app: FastifyInstance) {
  app.post("/checklists", async (request, reply) => {
    const parseResult = checklistRequestSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.badRequest("Invalid checklist request payload");
    }

    const { level, applicationType, role } = parseResult.data as {
      level: AsvsLevel;
      applicationType: ApplicationType;
      role: UserRole;
    };

    const tasks = getAsvsChecklist(level, applicationType, role);

    return {
      metadata: {
        ...asvsMetadata,
        filters: { level, applicationType, role },
        resultCount: tasks.length
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        shortcode: task.shortcode,
        level: `L${task.level}` as AsvsLevel,
        category: task.category,
        categoryShortcode: task.categoryShortcode,
        section: task.section,
        sectionShortcode: task.sectionShortcode,
        description: task.description,
        recommendedRoles: task.recommendedRoles,
        applicationTypes: task.applicationTypes
      }))
    };
  });
}
