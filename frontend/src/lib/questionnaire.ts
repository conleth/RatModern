import type { DeveloperDiscipline, TechnologyTag } from "./api";
import type { ApplicationType, AsvsLevel } from "./asvs";

export type QuestionnaireQuestion = {
  id: string;
  text: string;
  helpText?: string;
  tags: string[];
};

export type QuestionnaireRecommendation = {
  level: AsvsLevel;
  applicationType: ApplicationType;
  discipline: DeveloperDiscipline;
  technology: TechnologyTag | "all";
  notes: string[];
  recommendedCategories: string[];
};

export type QuestionnaireAnswersResponse = {
  userId: string;
  role: string;
  answers: Record<string, boolean>;
  recommendations: QuestionnaireRecommendation;
  createdAt: string;
  updatedAt: string;
};

