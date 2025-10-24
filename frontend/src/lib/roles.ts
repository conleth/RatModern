import { UserRole } from "./auth";

export const ROLE_LABELS: Record<UserRole, string> = {
  architect: "Security Architect",
  developer: "Developer",
  tester: "QA Tester",
  "business-analyst": "Business Analyst",
  "data-scientist": "Data Scientist",
  executive: "Executive Stakeholder"
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  architect:
    "Curate controls and architecture decisions based on the chosen ASVS profile.",
  developer:
    "Get implementation-ready guidance and defect tracking tied to ASVS items.",
  tester:
    "Plan verification activities and coverage for prioritized ASVS requirements.",
  "business-analyst":
    "Understand scope, risk, and delivery expectations for your release.",
  "data-scientist":
    "Protect analytics pipelines, data products, and ML experiments with the right controls.",
  executive:
    "View compliance readiness and program status across initiatives."
};

export const ROLE_ORDER: UserRole[] = [
  "architect",
  "developer",
  "tester",
  "business-analyst",
  "data-scientist",
  "executive"
];
