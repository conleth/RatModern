import { SpvsLevel, SPVS_CATEGORIES, SPVS_SUBCATEGORIES } from "./spvsData.js";

export type SpvsQuestionnaireQuestion = {
  id: string;
  text: string;
  helpText?: string;
  tags: string[];
};

export type SpvsQuestionnaireAnswers = Record<string, boolean>;

export type SpvsQuestionnaireRecommendation = {
  level: SpvsLevel;
  focusCategories: string[];
  focusSubcategories: string[];
  notes: string[];
};

export const SPVS_QUESTIONNAIRE_QUESTIONS: SpvsQuestionnaireQuestion[] = [
  {
    id: "usesHostedRunners",
    text: "Does your CI/CD pipeline rely on shared or SaaS-hosted runners/agents?",
    helpText:
      "Hosted runners increase exposure to shared infrastructure risk and require stronger hardening.",
    tags: ["environment", "integrate"]
  },
  {
    id: "usesSelfHostedRunners",
    text: "Do you operate self-hosted runners or build agents within your own infrastructure?",
    helpText:
      "Self-hosted runners require patching, credential hygiene, and isolation controls.",
    tags: ["environment", "integrate"]
  },
  {
    id: "managesPipelineSecrets",
    text: "Does the pipeline manage or inject credentials, secrets, or signing keys?",
    helpText:
      "Secret storage, rotation, and least-privilege policies are critical when pipelines broker credentials.",
    tags: ["secrets", "integrate"]
  },
  {
    id: "deploysToProduction",
    text: "Can the pipeline promote changes directly into production systems?",
    helpText:
      "Production deployments through automation typically require advanced change control and release governance.",
    tags: ["release", "operate"]
  },
  {
    id: "supportsMultipleEnvironments",
    text: "Does the pipeline orchestrate multiple environments (dev/test/stage/prod)?",
    helpText:
      "Promotion across environments demands guardrails around approvals, artifact integrity, and configuration drift.",
    tags: ["release"]
  },
  {
    id: "integratesThirdPartyServices",
    text: "Does the pipeline rely on third-party integrations or marketplace plug-ins?",
    helpText:
      "Third-party components introduce supply chain risk and require vetting, monitoring, and fallback plans.",
    tags: ["supply-chain"]
  },
  {
    id: "managesInfrastructureAsCode",
    text: "Does the pipeline apply infrastructure as code (IaC) or configuration changes?",
    helpText:
      "IaC pipelines must enforce policy-as-code, change reviews, and drift detection to avoid production misconfigurations.",
    tags: ["iac", "release"]
  },
  {
    id: "handlesSensitiveCode",
    text: "Does the pipeline process proprietary, regulated, or otherwise sensitive source code or data?",
    helpText:
      "Higher-sensitivity codebases require tightened access controls, auditing, and monitoring throughout the toolchain.",
    tags: ["governance"]
  },
  {
    id: "requiresAuditTrail",
    text: "Do compliance or governance programs require immutable audit trails for pipeline activity?",
    helpText:
      "Operational accountability pressures logging, detection, and incident response capabilities in release pipelines.",
    tags: ["compliance", "operate"]
  },
  {
    id: "usesAttestationOrSigning",
    text: "Do you require artifact signing, attestations, or provenance tracking before releases?",
    helpText:
      "Integrity controls tie directly into SPVS Integrate and Release practices, especially around artifact verification.",
    tags: ["integrity", "release"]
  }
];

function determineLevel(score: number): SpvsLevel {
  if (score >= 10) {
    return "L3";
  }
  if (score >= 5) {
    return "L2";
  }
  return "L1";
}

function normalizeRecommendations(recommendations: {
  categories: Set<string>;
  subcategories: Set<string>;
}) {
  const validCategoryIds = new Set(SPVS_CATEGORIES.map((category) => category.id));
  const validSubcategoryIds = new Set(SPVS_SUBCATEGORIES.map((subcategory) => subcategory.id));

  const categories = Array.from(recommendations.categories).filter((id) =>
    validCategoryIds.has(id)
  );
  const subcategories = Array.from(recommendations.subcategories).filter((id) =>
    validSubcategoryIds.has(id)
  );

  categories.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  subcategories.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  return { categories, subcategories };
}

export function generateSpvsRecommendations(answers: SpvsQuestionnaireAnswers) {
  let score = 0;
  const notes: string[] = [];
  const categories = new Set<string>();
  const subcategories = new Set<string>();

  if (answers.usesHostedRunners) {
    score += 2;
    categories.add("V3");
    subcategories.add("V3.1");
    notes.push("Shared/hosted runners detected: harden the build environment and enforce isolation.");
  }

  if (answers.usesSelfHostedRunners) {
    score += 2;
    categories.add("V3");
    subcategories.add("V3.1");
    notes.push("Self-hosted runners require patch management, credential rotation, and tamper monitoring.");
  }

  if (answers.managesPipelineSecrets) {
    score += 2;
    categories.add("V2");
    categories.add("V3");
    subcategories.add("V2.5");
    subcategories.add("V3.2");
    notes.push("Pipeline-managed secrets: emphasise vaulting, rotation, and least privilege across toolchains.");
  }

  if (answers.deploysToProduction) {
    score += 3;
    categories.add("V4");
    subcategories.add("V4.3");
    subcategories.add("V4.4");
    notes.push("Production automation in scope: tighten release approvals, deployment controls, and rollback plans.");
  }

  if (answers.supportsMultipleEnvironments) {
    score += 1;
    categories.add("V4");
    subcategories.add("V4.2");
    notes.push("Multi-environment promotion: standardise approvals and environment parity checks.");
  }

  if (answers.integratesThirdPartyServices) {
    score += 2;
    categories.add("V2");
    subcategories.add("V2.6");
    subcategories.add("V3.3");
    notes.push("Third-party integrations present: vet plug-ins, pin versions, and monitor marketplace risk.");
  }

  if (answers.managesInfrastructureAsCode) {
    score += 2;
    categories.add("V3");
    categories.add("V4");
    subcategories.add("V3.4");
    subcategories.add("V4.1");
    notes.push("IaC orchestration: enforce policy-as-code, scanning, and artifact integrity before rollout.");
  }

  if (answers.handlesSensitiveCode) {
    score += 2;
    categories.add("V1");
    categories.add("V5");
    subcategories.add("V1.1");
    subcategories.add("V5.2");
    notes.push("Sensitive code/data detected: tighten identity, access reviews, and operational enforcement.");
  }

  if (answers.requiresAuditTrail) {
    score += 2;
    categories.add("V5");
    subcategories.add("V5.1");
    subcategories.add("V5.4");
    notes.push("Audit requirements present: implement immutable logging, alert routing, and retention baselines.");
  }

  if (answers.usesAttestationOrSigning) {
    score += 2;
    categories.add("V3");
    categories.add("V4");
    subcategories.add("V3.4");
    subcategories.add("V4.3");
    notes.push("Artifact attestation required: enforce signing, provenance, and verification gates.");
  }

  const level = determineLevel(score);
  const { categories: focusCategories, subcategories: focusSubcategories } =
    normalizeRecommendations({ categories, subcategories });

  return {
    level,
    focusCategories,
    focusSubcategories,
    notes
  } satisfies SpvsQuestionnaireRecommendation;
}
