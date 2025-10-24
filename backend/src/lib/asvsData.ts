import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { UserRole } from "../types/auth.js";

export type AsvsLevel = "L1" | "L2" | "L3";
export type ApplicationType = "web" | "mobile" | "api";
export type DeveloperDiscipline =
  | "frontend"
  | "backend"
  | "mobile"
  | "fullstack"
  | "data-analyst"
  | "data-scientist"
  | "devops"
  | "security-engineer"
  | "qa-engineer"
  | "project-manager";

export type TechnologyTag =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "csharp"
  | "go"
  | "ruby"
  | "php"
  | "kotlin"
  | "swift";

type RawAsvsItem = {
  Shortcode: string;
  Ordinal: number;
  Description: string;
  L: string;
};

type RawAsvsSection = {
  Shortcode: string;
  Ordinal: number;
  Name: string;
  Items: RawAsvsItem[];
};

type RawAsvsRequirement = {
  Shortcode: string;
  Ordinal: number;
  ShortName: string;
  Name: string;
  Items: RawAsvsSection[];
};

type RawAsvsDocument = {
  Name: string;
  ShortName: string;
  Version: string;
  Description: string;
  Requirements: RawAsvsRequirement[];
};

export type FlattenedAsvsControl = {
  id: string;
  shortcode: string;
  description: string;
  level: number;
  category: string;
  categoryShortcode: string;
  section: string;
  sectionShortcode: string;
  ordinal: {
    category: number;
    section: number;
    item: number;
  };
  recommendedRoles: UserRole[];
  applicationTypes: ApplicationType[];
  disciplines: DeveloperDiscipline[];
  technologies: TechnologyTag[];
};

export type AsvsCategory = {
  shortcode: string;
  name: string;
  ordinal: number;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "../data/asvs-5.0.0-en.json");

const rawDocument = JSON.parse(
  readFileSync(DATA_PATH, { encoding: "utf-8" })
) as RawAsvsDocument;

const ALL_ROLES: UserRole[] = [
  "architect",
  "developer",
  "tester",
  "business-analyst",
  "data-scientist",
  "executive"
];

const ALL_APPLICATION_TYPES: ApplicationType[] = ["web", "mobile", "api"];

const SECTION_ROLE_MAP: Record<string, UserRole[]> = {
  V1: ["architect", "developer", "business-analyst", "data-scientist", "executive"],
  V2: ["architect", "developer", "tester", "data-scientist"],
  V3: ["architect", "developer", "tester", "data-scientist"],
  V4: ["architect", "developer", "tester", "data-scientist"],
  V5: ["developer", "tester", "data-scientist"],
  V6: ["developer", "tester", "data-scientist"],
  V7: ["developer", "tester", "data-scientist"],
  V8: ["developer", "tester", "data-scientist"],
  V9: ["developer", "tester", "data-scientist"],
  V10: ["architect", "tester", "data-scientist"],
  V11: ["architect", "tester"],
  V12: ["architect", "tester", "data-scientist"],
  V13: ["architect", "developer", "tester", "data-scientist"],
  V14: ["architect", "business-analyst", "executive", "data-scientist"]
};

const SECTION_APPLICATION_MAP: Record<string, ApplicationType[]> = {
  V1: ["web", "mobile", "api"],
  V2: ["web", "mobile", "api"],
  V3: ["web", "mobile", "api"],
  V4: ["web", "mobile", "api"],
  V5: ["web", "mobile", "api"],
  V6: ["web", "mobile", "api"],
  V7: ["web", "mobile", "api"],
  V8: ["web", "mobile"],
  V9: ["web", "mobile"],
  V10: ["web", "mobile", "api"],
  V11: ["web", "mobile"],
  V12: ["web", "mobile"],
  V13: ["web", "api"],
  V14: ["web", "mobile", "api"]
};

const SECTION_DISCIPLINE_MAP: Record<string, DeveloperDiscipline[]> = {
  V1: [
    "frontend",
    "backend",
    "mobile",
    "fullstack",
    "data-analyst",
    "data-scientist",
    "project-manager",
    "security-engineer"
  ],
  V2: ["backend", "fullstack", "security-engineer", "data-analyst", "data-scientist"],
  V3: ["backend", "mobile", "security-engineer", "data-analyst", "data-scientist"],
  V4: ["backend", "security-engineer", "data-analyst", "data-scientist"],
  V5: ["frontend", "backend", "fullstack", "security-engineer", "qa-engineer", "data-scientist"],
  V6: ["backend", "data-analyst", "data-scientist", "security-engineer"],
  V7: ["backend", "devops", "security-engineer", "data-scientist"],
  V8: ["backend", "data-analyst", "data-scientist", "security-engineer"],
  V9: ["backend", "devops", "security-engineer", "data-analyst", "data-scientist"],
  V10: ["backend", "mobile", "devops", "security-engineer", "data-scientist"],
  V11: ["frontend", "backend", "project-manager", "fullstack", "data-scientist"],
  V12: ["backend", "devops", "security-engineer", "data-scientist"],
  V13: ["backend", "mobile", "fullstack", "security-engineer", "data-scientist"],
  V14: ["backend", "devops", "project-manager", "security-engineer", "data-analyst", "data-scientist"]
};

const SECTION_TECHNOLOGY_MAP: Record<string, TechnologyTag[]> = {
  V1: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin",
    "swift"
  ],
  V2: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin"
  ],
  V3: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin"
  ],
  V4: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin"
  ],
  V5: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php"
  ],
  V6: [
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin"
  ],
  V7: [
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin",
    "swift"
  ],
  V8: [
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin"
  ],
  V9: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php"
  ],
  V10: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "kotlin",
    "swift"
  ],
  V11: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php"
  ],
  V12: [
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin"
  ],
  V13: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin"
  ],
  V14: [
    "typescript",
    "javascript",
    "python",
    "java",
    "csharp",
    "go",
    "ruby",
    "php",
    "kotlin",
    "swift"
  ]
};

const flattenedControls: FlattenedAsvsControl[] = rawDocument.Requirements.flatMap(
  (requirement) => {
    const categoryRoles =
      SECTION_ROLE_MAP[requirement.Shortcode] ?? ALL_ROLES;
    const categoryApplications =
      SECTION_APPLICATION_MAP[requirement.Shortcode] ?? ALL_APPLICATION_TYPES;

    return requirement.Items.flatMap((section) => {
      return section.Items.map((item) => {
        const level = Number.parseInt(item.L, 10);
        const sectionDisciplines =
          SECTION_DISCIPLINE_MAP[requirement.Shortcode] ??
          SECTION_DISCIPLINE_MAP.V1;
        const sectionTechnologies =
          SECTION_TECHNOLOGY_MAP[requirement.Shortcode] ??
          SECTION_TECHNOLOGY_MAP.V1;

        return {
          id: item.Shortcode,
          shortcode: item.Shortcode,
          description: item.Description,
          level: Number.isNaN(level) ? 3 : level,
          category: requirement.Name,
          categoryShortcode: requirement.Shortcode,
          section: section.Name,
          sectionShortcode: section.Shortcode,
          ordinal: {
            category: requirement.Ordinal,
            section: section.Ordinal,
            item: item.Ordinal
          },
          recommendedRoles: categoryRoles,
          applicationTypes: categoryApplications,
          disciplines: sectionDisciplines,
          technologies: sectionTechnologies
        } satisfies FlattenedAsvsControl;
      });
    });
  }
);

const controlsById = new Map(
  flattenedControls.map((control) => [control.id, control])
);

const categoryMap = new Map<string, AsvsCategory>();
rawDocument.Requirements.forEach((requirement) => {
  categoryMap.set(requirement.Shortcode, {
    shortcode: requirement.Shortcode,
    name: requirement.Name,
    ordinal: requirement.Ordinal
  });
});

export const ASVS_CATEGORIES: AsvsCategory[] = Array.from(categoryMap.values()).sort(
  (a, b) => a.ordinal - b.ordinal
);

function levelToNumber(level: AsvsLevel) {
  switch (level) {
    case "L1":
      return 1;
    case "L2":
      return 2;
    case "L3":
    default:
      return 3;
  }
}

export function getAsvsControlById(id: string) {
  return controlsById.get(id);
}

export function getAsvsChecklist(
  level: AsvsLevel,
  applicationType: ApplicationType,
  role: UserRole,
  options?: {
    discipline?: DeveloperDiscipline;
    technology?: TechnologyTag;
    categories?: string[];
  }
): FlattenedAsvsControl[] {
  const maximumLevel = levelToNumber(level);
  const categoriesFilter = options?.categories?.length
    ? new Set(options.categories.map((category) => category.toUpperCase()))
    : undefined;

  return flattenedControls
    .filter((control) => {
      if (control.level > maximumLevel) {
        return false;
      }

      if (!control.recommendedRoles.includes(role)) {
        return false;
      }

      if (!control.applicationTypes.includes(applicationType)) {
        return false;
      }

       if (categoriesFilter && !categoriesFilter.has(control.categoryShortcode.toUpperCase())) {
        return false;
      }

      if (options?.discipline) {
        if (!control.disciplines.includes(options.discipline)) {
          return false;
        }
      }

      if (options?.technology) {
        if (!control.technologies.includes(options.technology)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (a.categoryShortcode === b.categoryShortcode) {
        if (a.sectionShortcode === b.sectionShortcode) {
          return a.ordinal.item - b.ordinal.item;
        }
        return a.ordinal.section - b.ordinal.section;
      }
      return a.ordinal.category - b.ordinal.category;
    });
}

export const asvsMetadata = {
  name: rawDocument.Name,
  shortName: rawDocument.ShortName,
  version: rawDocument.Version,
  description: rawDocument.Description,
  totalControls: flattenedControls.length
};

export const TECHNOLOGY_TAGS: TechnologyTag[] = [
  "typescript",
  "javascript",
  "python",
  "java",
  "csharp",
  "go",
  "ruby",
  "php",
  "kotlin",
  "swift"
];

export const DEVELOPER_DISCIPLINES: DeveloperDiscipline[] = [
  "frontend",
  "backend",
  "mobile",
  "fullstack",
  "data-analyst",
  "devops",
  "security-engineer",
  "qa-engineer",
  "project-manager"
];
