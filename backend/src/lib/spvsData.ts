import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

export type SpvsLevel = "L1" | "L2" | "L3";

export type SpvsCategory = {
  id: string;
  name: string;
};

export type SpvsSubcategory = {
  id: string;
  name: string;
  categoryId: string;
};

export type SpvsRequirement = {
  id: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  levels: SpvsLevel[];
  nistMapping: string;
  owaspRisk: string;
  cweMapping: string;
  cweDescription: string;
};

export type SpvsRequirementFilters = {
  search?: string;
  levels?: SpvsLevel[];
  categories?: string[];
  subcategories?: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "../data/spvs-1.0.0-en.csv");

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]!;
    const nextChar = content[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        currentValue += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentValue);
      currentValue = "";

      if (currentRow.some((value) => value !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
  }
  if (currentRow.length > 0 && currentRow.some((value) => value !== "")) {
    rows.push(currentRow);
  }

  return rows.map((row) => row.map((value) => value.trim()));
}

const rawRows = parseCsv(readFileSync(DATA_PATH, { encoding: "utf-8" }));
const [, ...dataRows] = rawRows;

const categoryMap = new Map<string, SpvsCategory>();
const subcategoryMap = new Map<string, SpvsSubcategory>();

const requirements: SpvsRequirement[] = dataRows
  .map((row) => {
    const [
      categoryId,
      categoryName,
      subcategoryId,
      subcategoryName,
      requirementId,
      requirementDescription,
      level1Flag,
      level2Flag,
      level3Flag,
      nistMapping,
      owaspRisk,
      cweMapping,
      cweDescription
    ] = row;

    if (!categoryId || categoryId === "-" || !requirementId) {
      return undefined;
    }

    const normalizedCategoryId = categoryId.toUpperCase();
    const normalizedSubcategoryId = subcategoryId?.toUpperCase() ?? "";

    if (
      normalizedCategoryId &&
      !categoryMap.has(normalizedCategoryId) &&
      categoryName
    ) {
      categoryMap.set(normalizedCategoryId, {
        id: normalizedCategoryId,
        name: categoryName
      });
    }

    if (
      normalizedSubcategoryId &&
      !subcategoryMap.has(normalizedSubcategoryId) &&
      subcategoryName
    ) {
      subcategoryMap.set(normalizedSubcategoryId, {
        id: normalizedSubcategoryId,
        name: subcategoryName,
        categoryId: normalizedCategoryId
      });
    }

    const levels: SpvsLevel[] = [];
    if (level1Flag?.toUpperCase() === "X") {
      levels.push("L1");
    }
    if (level2Flag?.toUpperCase() === "X") {
      levels.push("L2");
    }
    if (level3Flag?.toUpperCase() === "X") {
      levels.push("L3");
    }

    const description =
      requirementDescription?.replace(/\s+/g, " ").trim() ?? "";

    return {
      id: requirementId,
      description,
      categoryId: normalizedCategoryId,
      categoryName: categoryName ?? "",
      subcategoryId: normalizedSubcategoryId,
      subcategoryName: subcategoryName ?? "",
      levels: levels.length > 0 ? levels : (["L1", "L2", "L3"] as SpvsLevel[]),
      nistMapping: nistMapping ?? "",
      owaspRisk: owaspRisk ?? "",
      cweMapping: cweMapping ?? "",
      cweDescription: cweDescription ?? ""
    } satisfies SpvsRequirement;
  })
  .filter((requirement): requirement is SpvsRequirement => Boolean(requirement));

export const SPVS_REQUIREMENTS: SpvsRequirement[] = requirements;

export const SPVS_CATEGORIES: SpvsCategory[] = Array.from(categoryMap.values()).sort(
  (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })
);

export const SPVS_SUBCATEGORIES: SpvsSubcategory[] = Array.from(
  subcategoryMap.values()
).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

export const spvsMetadata = {
  name: "Secure Pipeline Verification Standard",
  shortName: "SPVS",
  version: "1.0.0",
  totalRequirements: SPVS_REQUIREMENTS.length
};

function matchesSearch(requirement: SpvsRequirement, search?: string) {
  if (!search) {
    return true;
  }

  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    requirement.id,
    requirement.description,
    requirement.categoryName,
    requirement.subcategoryName,
    requirement.nistMapping,
    requirement.owaspRisk,
    requirement.cweMapping,
    requirement.cweDescription
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function getSpvsRequirements(filters?: SpvsRequirementFilters): SpvsRequirement[] {
  const levelSet = filters?.levels?.length
    ? new Set(filters.levels.map((level) => level.toUpperCase() as SpvsLevel))
    : undefined;
  const categorySet = filters?.categories?.length
    ? new Set(filters.categories.map((category) => category.toUpperCase()))
    : undefined;
  const subcategorySet = filters?.subcategories?.length
    ? new Set(filters.subcategories.map((subcategory) => subcategory.toUpperCase()))
    : undefined;

  return SPVS_REQUIREMENTS.filter((requirement) => {
    if (levelSet) {
      const hasLevel = requirement.levels.some((level) => levelSet.has(level));
      if (!hasLevel) {
        return false;
      }
    }

    if (categorySet && !categorySet.has(requirement.categoryId)) {
      return false;
    }

    if (
      subcategorySet &&
      requirement.subcategoryId &&
      !subcategorySet.has(requirement.subcategoryId)
    ) {
      return false;
    }

    return matchesSearch(requirement, filters?.search);
  });
}
