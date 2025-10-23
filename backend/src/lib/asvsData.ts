import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { UserRole } from "../types/auth.js";

export type AsvsLevel = "L1" | "L2" | "L3";
export type ApplicationType = "web" | "mobile" | "api";

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
  "executive"
];

const ALL_APPLICATION_TYPES: ApplicationType[] = ["web", "mobile", "api"];

const SECTION_ROLE_MAP: Record<string, UserRole[]> = {
  V1: ["architect", "developer", "business-analyst", "executive"],
  V2: ["architect", "developer", "tester"],
  V3: ["architect", "developer", "tester"],
  V4: ["architect", "developer", "tester"],
  V5: ["developer", "tester"],
  V6: ["developer", "tester"],
  V7: ["developer", "tester"],
  V8: ["developer", "tester"],
  V9: ["developer", "tester"],
  V10: ["architect", "tester"],
  V11: ["architect", "tester"],
  V12: ["architect", "tester"],
  V13: ["architect", "developer", "tester"],
  V14: ["architect", "business-analyst", "executive"]
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

const flattenedControls: FlattenedAsvsControl[] = rawDocument.Requirements.flatMap(
  (requirement) => {
    const categoryRoles =
      SECTION_ROLE_MAP[requirement.Shortcode] ?? ALL_ROLES;
    const categoryApplications =
      SECTION_APPLICATION_MAP[requirement.Shortcode] ?? ALL_APPLICATION_TYPES;

    return requirement.Items.flatMap((section) => {
      return section.Items.map((item) => {
        const level = Number.parseInt(item.L, 10);

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
          applicationTypes: categoryApplications
        } satisfies FlattenedAsvsControl;
      });
    });
  }
);

const controlsById = new Map(
  flattenedControls.map((control) => [control.id, control])
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
  role: UserRole
): FlattenedAsvsControl[] {
  const maximumLevel = levelToNumber(level);

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
