import { SpvsQuestionnaireAnswers, SpvsQuestionnaireRecommendation } from "./spvsQuestionnaireData.js";

export type SpvsQuestionnaireRecord = {
  userId: string;
  answers: SpvsQuestionnaireAnswers;
  recommendations: SpvsQuestionnaireRecommendation;
  createdAt: string;
  updatedAt: string;
};

export interface SpvsQuestionnaireStore {
  get(userId: string): SpvsQuestionnaireRecord | undefined;
  save(record: SpvsQuestionnaireRecord): SpvsQuestionnaireRecord;
}

class InMemorySpvsQuestionnaireStore implements SpvsQuestionnaireStore {
  private readonly records = new Map<string, SpvsQuestionnaireRecord>();

  get(userId: string): SpvsQuestionnaireRecord | undefined {
    return this.records.get(userId);
  }

  save(record: SpvsQuestionnaireRecord): SpvsQuestionnaireRecord {
    const now = new Date().toISOString();
    const existing = this.records.get(record.userId);

    const stored: SpvsQuestionnaireRecord = {
      ...record,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.records.set(record.userId, stored);
    return stored;
  }
}

export const spvsQuestionnaireStore: SpvsQuestionnaireStore =
  new InMemorySpvsQuestionnaireStore();
