import { describe, expect, it } from "vitest";

import {
  generateSpvsRecommendations,
  type SpvsQuestionnaireAnswers
} from "../spvsQuestionnaireData.js";

const baseAnswers: SpvsQuestionnaireAnswers = {
  usesHostedRunners: false,
  usesSelfHostedRunners: false,
  managesPipelineSecrets: false,
  deploysToProduction: false,
  supportsMultipleEnvironments: false,
  integratesThirdPartyServices: false,
  managesInfrastructureAsCode: false,
  handlesSensitiveCode: false,
  requiresAuditTrail: false,
  usesAttestationOrSigning: false
};

describe("generateSpvsRecommendations", () => {
  it("defaults to L1 with minimal affirmative responses", () => {
    const recommendations = generateSpvsRecommendations(baseAnswers);

    expect(recommendations.level).toBe("L1");
    expect(recommendations.focusCategories.length).toBe(0);
    expect(recommendations.focusSubcategories.length).toBe(0);
  });

  it("escalates to L3 and recommends multiple categories for high-risk pipelines", () => {
    const recommendations = generateSpvsRecommendations({
      ...baseAnswers,
      usesHostedRunners: true,
      deploysToProduction: true,
      managesInfrastructureAsCode: true,
      managesPipelineSecrets: true,
      handlesSensitiveCode: true,
      usesAttestationOrSigning: true
    });

    expect(recommendations.level).toBe("L3");
    expect(recommendations.focusCategories).toEqual(
      expect.arrayContaining(["V1", "V3", "V4", "V5"])
    );
    expect(recommendations.focusSubcategories).toEqual(
      expect.arrayContaining(["V3.1", "V3.4", "V4.3"])
    );
    expect(recommendations.notes.length).toBeGreaterThan(0);
  });
});
