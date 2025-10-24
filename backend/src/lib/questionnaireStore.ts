import { DeveloperDiscipline, TechnologyTag, AsvsLevel, ApplicationType } from "./asvsData.js";
import { QuestionnaireAnswers, QuestionnaireRecommendation } from "./questionnaireData.js";
import { UserRole } from "../types/auth.js";

export type QuestionnaireRecord = {
  userId: string;
  role: UserRole;
  answers: QuestionnaireAnswers;
  recommendations: QuestionnaireRecommendation;
  createdAt: string;
  updatedAt: string;
};

export interface QuestionnaireStore {
  get(userId: string): QuestionnaireRecord | undefined;
  save(record: QuestionnaireRecord): QuestionnaireRecord;
}

export class InMemoryQuestionnaireStore implements QuestionnaireStore {
  private readonly records = new Map<string, QuestionnaireRecord>();

  get(userId: string): QuestionnaireRecord | undefined {
    return this.records.get(userId);
  }

  save(record: QuestionnaireRecord): QuestionnaireRecord {
    const now = new Date().toISOString();
    const existing = this.records.get(record.userId);
    const stored: QuestionnaireRecord = {
      ...record,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };
    this.records.set(record.userId, stored);
    return stored;
  }
}

export const questionnaireStore: QuestionnaireStore =
  new InMemoryQuestionnaireStore();

