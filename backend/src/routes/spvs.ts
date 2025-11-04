import { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  SPVS_CATEGORIES,
  SPVS_SUBCATEGORIES,
  spvsMetadata,
  getSpvsRequirements,
  SpvsLevel
} from "../lib/spvsData.js";
import {
  SPVS_QUESTIONNAIRE_QUESTIONS,
  generateSpvsRecommendations,
  SpvsQuestionnaireAnswers
} from "../lib/spvsQuestionnaireData.js";
import {
  spvsQuestionnaireStore,
  SpvsQuestionnaireRecord
} from "../lib/spvsQuestionnaireStore.js";

const saveSchema = z.object({
  userId: z.string().min(1),
  answers: z.record(z.boolean())
});

const requirementQuerySchema = z.object({
  search: z.string().optional(),
  levels: z.string().optional(),
  categories: z.string().optional()
});

function parseLevelFilter(value: string | undefined): SpvsLevel[] | undefined {
  if (!value) {
    return undefined;
  }

  const levels = value
    .split(",")
    .map((level) => level.trim().toUpperCase())
    .filter(Boolean) as SpvsLevel[];

  const validLevels: SpvsLevel[] = ["L1", "L2", "L3"];
  return levels.filter((level) => validLevels.includes(level));
}

function parseListFilter(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const entries = value
    .split(",")
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);

  return entries.length ? Array.from(new Set(entries)) : undefined;
}

export function registerSpvsRoutes(app: FastifyInstance) {
  app.get("/spvs/questionnaire/questions", async () => ({
    questions: SPVS_QUESTIONNAIRE_QUESTIONS
  }));

  app.get("/spvs/questionnaire", async (request, reply) => {
    const userId = (request.query as Record<string, string | undefined>)?.userId;

    if (!userId) {
      return reply.badRequest("Missing userId query parameter.");
    }

    const record = spvsQuestionnaireStore.get(userId);
    if (!record) {
      return reply.notFound("No SPVS questionnaire data found for the supplied user.");
    }

    return record;
  });

  app.post("/spvs/questionnaire", async (request, reply) => {
    const parseResult = saveSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.badRequest("Invalid SPVS questionnaire payload.");
    }

    const { userId, answers } = parseResult.data as {
      userId: string;
      answers: SpvsQuestionnaireAnswers;
    };

    const recommendations = generateSpvsRecommendations(answers);
    const record: SpvsQuestionnaireRecord = spvsQuestionnaireStore.save({
      userId,
      answers,
      recommendations,
      createdAt: "",
      updatedAt: ""
    });

    return record;
  });

  app.put("/spvs/questionnaire", async (request, reply) => {
    const parseResult = saveSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.badRequest("Invalid SPVS questionnaire payload.");
    }

    const { userId, answers } = parseResult.data as {
      userId: string;
      answers: SpvsQuestionnaireAnswers;
    };

    const recommendations = generateSpvsRecommendations(answers);
    const record: SpvsQuestionnaireRecord = spvsQuestionnaireStore.save({
      userId,
      answers,
      recommendations,
      createdAt: "",
      updatedAt: ""
    });

    return record;
  });

  app.get("/spvs/taxonomy", async () => ({
    metadata: spvsMetadata,
    categories: SPVS_CATEGORIES,
    subcategories: SPVS_SUBCATEGORIES
  }));

  app.get("/spvs/requirements", async (request) => {
    const parseResult = requirementQuerySchema.safeParse(request.query);

    if (!parseResult.success) {
      return {
        metadata: {
          ...spvsMetadata,
          filters: {},
          resultCount: 0
        },
        requirements: []
      };
    }

    const { search, levels, categories } = parseResult.data;

    const levelFilters = parseLevelFilter(levels);
    const categoryFilters = parseListFilter(categories);

    const requirements = getSpvsRequirements({
      search,
      levels: levelFilters,
      categories: categoryFilters
    });

    return {
      metadata: {
        ...spvsMetadata,
        filters: {
          search: search ?? null,
          levels: levelFilters ?? [],
          categories: categoryFilters ?? []
        },
        resultCount: requirements.length
      },
      requirements
    };
  });
}
