import { describe, expect, it } from "vitest";

import {
  getSpvsRequirements,
  SPVS_REQUIREMENTS
} from "../spvsData.js";

describe("getSpvsRequirements", () => {
  it("returns every requirement when no filters are applied", () => {
    const requirements = getSpvsRequirements();
    expect(requirements.length).toBe(SPVS_REQUIREMENTS.length);
  });

  it("filters by category id", () => {
    const result = getSpvsRequirements({ categories: ["V3"] });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((requirement) => requirement.categoryId === "V3")).toBe(
      true
    );
  });

  it("filters by level", () => {
    const result = getSpvsRequirements({ levels: ["L1"] });

    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((requirement) => requirement.levels.includes("L1"))
    ).toBe(true);
  });

  it("matches search queries across description and metadata", () => {
    const result = getSpvsRequirements({
      search: "Multi-Factor Authentication"
    });

    expect(result.some((requirement) => requirement.id === "V1.1.1")).toBe(true);
  });
});
