import { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  QUESTIONNAIRE_QUESTIONS,
  QuestionnaireAnswers,
  generateRecommendations
} from "../lib/questionnaireData.js";
import { questionnaireStore } from "../lib/questionnaireStore.js";
import { UserRole } from "../types/auth.js";

const answerSchema = z.record(z.boolean());

const saveSchema = z.object({
  userId: z.string().min(1),
  role: z.enum([
    "architect",
    "developer",
    "tester",
    "business-analyst",
    "data-scientist",
    "executive"
  ]),
  answers: answerSchema
});

export function registerQuestionnaireRoutes(app: FastifyInstance) {
  app.get("/questionnaire/questions", async () => ({
    questions: QUESTIONNAIRE_QUESTIONS
  }));

  app.get("/questionnaire", async (request, reply) => {
    const userId = (request.query as Record<string, string | undefined>)?.userId;

    if (!userId) {
      return reply.badRequest("Missing userId query parameter.");
    }

    const record = questionnaireStore.get(userId);
    if (!record) {
      return reply.notFound("No questionnaire data found for the supplied user.");
    }

    return record;
  });

  app.post("/questionnaire", async (request, reply) => {
    const parseResult = saveSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.badRequest("Invalid questionnaire payload.");
    }

    const { userId, role, answers } = parseResult.data as {
      userId: string;
      role: UserRole;
      answers: QuestionnaireAnswers;
    };

    const recommendations = generateRecommendations(answers, role);
    const record = questionnaireStore.save({
      userId,
      role,
      answers,
      recommendations,
      createdAt: "",
      updatedAt: ""
    });

    return record;
  });

  app.put("/questionnaire", async (request, reply) => {
    const parseResult = saveSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.badRequest("Invalid questionnaire payload.");
    }

    const { userId, role, answers } = parseResult.data as {
      userId: string;
      role: UserRole;
      answers: QuestionnaireAnswers;
    };

    const recommendations = generateRecommendations(answers, role);
    const record = questionnaireStore.save({
      userId,
      role,
      answers,
      recommendations,
      createdAt: "",
      updatedAt: ""
    });

    return record;
  });
}
