import { DeveloperDiscipline, TechnologyTag, AsvsLevel, ApplicationType } from "./asvsData.js";
import { UserRole } from "../types/auth.js";

export type QuestionnaireQuestion = {
  id: string;
  text: string;
  helpText?: string;
  tags: string[];
};

export type QuestionnaireAnswers = Record<string, boolean>;

export type QuestionnaireRecommendation = {
  level: AsvsLevel;
  applicationType: ApplicationType;
  discipline: DeveloperDiscipline;
  technology: TechnologyTag | "all";
  notes: string[];
  recommendedCategories: string[];
};

export const QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: "handlesPayments",
    text: "Does the application handle payment transactions or store financial data?",
    helpText: "Payment or financial workflows raise the bar for integrity and fraud protections.",
    tags: ["risk", "financial"]
  },
  {
    id: "storesPII",
    text: "Does the application store personally identifiable information (PII) or regulated data?",
    helpText: "PII and regulated data typically require stronger controls and evidencing.",
    tags: ["risk", "privacy"]
  },
  {
    id: "externallyFacing",
    text: "Is the application externally facing / internet accessible?",
    tags: ["risk"]
  },
  {
    id: "acceptsUserInput",
    text: "Does the application accept untrusted user input or user generated content?",
    tags: ["validation"]
  },
  {
    id: "usesDatabase",
    text: "Does the application persist data in a database or data store?",
    tags: ["data"]
  },
  {
    id: "integratesThirdParty",
    text: "Does the application integrate with third-party APIs or services?",
    tags: ["third-party"]
  },
  {
    id: "modernFramework",
    text: "Is the application built with modern, actively maintained frameworks?",
    helpText: "Legacy stacks often need additional hardening and patch-management focus.",
    tags: ["stack"]
  },
  {
    id: "hasFrontendUI",
    text: "Does the application provide a browser-based user interface for end-users?",
    tags: ["ui", "frontend"]
  },
  {
    id: "implementsAuthentication",
    text: "Does the application implement authentication or integrate with an identity provider (SSO/IdP)?",
    tags: ["auth"]
  },
  {
    id: "requiresRoleManagement",
    text: "Do you need role-based access control or multi-tenant authorization separation?",
    tags: ["authz"]
  },
  {
    id: "logsSensitiveEvents",
    text: "Does the application generate audit or security-relevant logs that require protection?",
    tags: ["logging", "monitoring"]
  },
  {
    id: "multiTenantDeployment",
    text: "Will the application run in a shared cloud or multi-tenant environment (SaaS)?",
    helpText: "Shared environments raise expectations around isolation, configuration, and secrets management.",
    tags: ["deployment"]
  },
  {
    id: "mobileClient",
    text: "Does the solution include a native or mobile client?",
    tags: ["platform"]
  },
  {
    id: "apiService",
    text: "Is the solution primarily an API or service consumed programmatically?",
    tags: ["platform"]
  }
];

function determineLevel(score: number): AsvsLevel {
  if (score >= 7) {
    return "L3";
  }
  if (score >= 4) {
    return "L2";
  }
  return "L1";
}

function determineApplicationType(answers: QuestionnaireAnswers): ApplicationType {
  if (answers.mobileClient) {
    return "mobile";
  }
  if (answers.apiService) {
    return "api";
  }
  return "web";
}

function determineDiscipline(
  answers: QuestionnaireAnswers,
  role: UserRole
): DeveloperDiscipline {
  if (answers.hasFrontendUI) {
    return "frontend";
  }
  if (answers.mobileClient) {
    return "mobile";
  }
  if (answers.apiService) {
    return "backend";
  }
  if (role === "developer") {
    return answers.externallyFacing ? "fullstack" : "backend";
  }
  if (role === "tester") {
    return "qa-engineer";
  }
  if (role === "architect" || role === "executive") {
    return "security-engineer";
  }
  return "project-manager";
}

function determineTechnology(answers: QuestionnaireAnswers): TechnologyTag | "all" {
  if (answers.hasFrontendUI) {
    return "typescript";
  }
  if (answers.mobileClient) {
    return "kotlin";
  }
  if (answers.apiService) {
    return "java";
  }
  return "all";
}

function collectNotes(answers: QuestionnaireAnswers): string[] {
  const notes: string[] = [];

  if (answers.handlesPayments) {
    notes.push("Payment handling observed: ensure PCI-aligned controls and fraud monitoring.");
  }

  if (answers.storesPII) {
    notes.push("PII/regulated data present: document privacy controls and retention policies.");
  }

  if (answers.externallyFacing) {
    notes.push("Externally facing surface: reinforce perimeter, logging, and monitoring.");
  }

  if (!answers.modernFramework) {
    notes.push("Legacy stack detected: review patch cadence and hardening commitments.");
  }

  if (answers.integratesThirdParty) {
    notes.push("Third-party integrations: capture supply-chain security expectations.");
  }

  if (answers.implementsAuthentication) {
    notes.push("Authentication in scope: confirm MFA, session management, and credential hygiene.");
  }

  if (answers.requiresRoleManagement) {
    notes.push("Complex authorization: catalogue roles, least privilege, and tenant separation rules.");
  }

  if (answers.logsSensitiveEvents) {
    notes.push("Security logging present: ensure tamper resistance and monitoring coverage.");
  }

  if (answers.multiTenantDeployment) {
    notes.push("Multi-tenant/cloud deployment: document isolation, secrets, and configuration controls.");
  }

  if (answers.hasFrontendUI) {
    notes.push("Frontend UI detected: emphasise client-side security, content handling, and session controls.");
  }

  return notes;
}

function collectCategories(answers: QuestionnaireAnswers): string[] {
  const categories = new Set<string>();

  if (answers.handlesPayments || answers.storesPII) {
    categories.add("V2");
    categories.add("V3");
    categories.add("V6");
  }

  if (answers.acceptsUserInput) {
    categories.add("V5");
    categories.add("V11");
  }

  if (answers.usesDatabase) {
    categories.add("V9");
    categories.add("V10");
  }

  if (answers.integratesThirdParty) {
    categories.add("V12");
    categories.add("V13");
  }

  if (answers.externallyFacing) {
    categories.add("V1");
    categories.add("V2");
  }

  if (!answers.modernFramework) {
    categories.add("V14");
  }

  if (answers.hasFrontendUI) {
    categories.add("V1");
    categories.add("V5");
    categories.add("V11");
  }

  if (answers.implementsAuthentication) {
    categories.add("V2");
    categories.add("V3");
  }

  if (answers.requiresRoleManagement) {
    categories.add("V4");
  }

  if (answers.logsSensitiveEvents) {
    categories.add("V10");
  }

  if (answers.multiTenantDeployment) {
    categories.add("V14");
  }

  return Array.from(categories);
}

export function generateRecommendations(
  answers: QuestionnaireAnswers,
  role: UserRole
): QuestionnaireRecommendation {
  let score = 0;

  if (answers.handlesPayments) score += 3;
  if (answers.storesPII) score += 2;
  if (answers.externallyFacing) score += 2;
  if (answers.acceptsUserInput) score += 2;
  if (answers.usesDatabase) score += 1;
  if (answers.integratesThirdParty) score += 1;
  if (!answers.modernFramework) score += 1;
  if (answers.hasFrontendUI) score += 1;
  if (answers.implementsAuthentication) score += 1;
  if (answers.requiresRoleManagement) score += 1;
  if (answers.logsSensitiveEvents) score += 1;
  if (answers.multiTenantDeployment) score += 2;

  const level = determineLevel(score);
  const applicationType = determineApplicationType(answers);
  const discipline = determineDiscipline(answers, role);
  const technology = determineTechnology(answers);
  const notes = collectNotes(answers);
  const recommendedCategories = collectCategories(answers);

  return {
    level,
    applicationType,
    discipline,
    technology,
    notes,
    recommendedCategories
  };
}
