import { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  getAsvsChecklist,
  AsvsLevel,
  ApplicationType,
  DeveloperDiscipline,
  TechnologyTag,
  asvsMetadata,
  ASVS_CATEGORIES
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
  ]),
  technology: z
    .enum([
      "typescript",
      "javascript",
      "python",
      "java",
      "csharp",
      "go",
      "ruby",
      "php",
      "kotlin",
      "swift"
    ])
    .optional()
    .nullable(),
  discipline: z
    .enum([
      "frontend",
      "backend",
      "mobile",
      "fullstack",
      "data-analyst",
      "devops",
      "security-engineer",
      "qa-engineer",
      "project-manager"
    ])
    .optional()
    .nullable(),
  categories: z
    .array(z.string())
    .optional()
    .nullable()
});

export function registerChecklistRoutes(app: FastifyInstance) {
  app.get("/checklists/categories", async () => ({
    categories: ASVS_CATEGORIES
  }));

  app.post("/checklists", async (request, reply) => {
    const parseResult = checklistRequestSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.badRequest("Invalid checklist request payload");
    }

    const { level, applicationType, role, technology, discipline, categories } =
      parseResult.data as {
        level: AsvsLevel;
        applicationType: ApplicationType;
        role: UserRole;
        technology?: TechnologyTag | null;
        discipline?: DeveloperDiscipline | null;
        categories?: string[] | null;
      };

    const tasks = getAsvsChecklist(level, applicationType, role, {
      technology: technology ?? undefined,
      discipline: discipline ?? undefined,
      categories:
        categories?.map((category) => category.toUpperCase()) ?? undefined
    });

    return {
      metadata: {
        ...asvsMetadata,
        filters: {
          level,
          applicationType,
          role,
          technology: technology ?? null,
          discipline: discipline ?? null,
          categories: categories ?? null
        },
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
        applicationTypes: task.applicationTypes,
        disciplines: task.disciplines,
        technologies: task.technologies
      }))
    };
  });
}
