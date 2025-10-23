import { UserRole } from "../types/auth.js";

export type AsvsLevel = "L1" | "L2" | "L3";
export type ApplicationType = "web" | "mobile" | "api";

export type AsvsTask = {
  id: string;
  title: string;
  description: string;
  category: string;
  roles: UserRole[];
  rallyMapping?: {
    suggestedWorkItemType: "hierarchical-requirement" | "defect" | "task";
    defaultPortfolio?: string;
  };
};

const BASE_TASKS: AsvsTask[] = [
  {
    id: "arch-threat-model",
    title: "Establish threat model",
    description:
      "Capture entry points, assets, trust boundaries, and abuse cases grounded in OWASP ASVS scope.",
    category: "Architecture & Design",
    roles: ["architect", "executive"],
    rallyMapping: { suggestedWorkItemType: "hierarchical-requirement" }
  },
  {
    id: "dev-input-validation",
    title: "Implement context aware input validation",
    description:
      "Use central validation libraries with positive validation for critical flows.",
    category: "Implementation",
    roles: ["developer", "architect"],
    rallyMapping: { suggestedWorkItemType: "task" }
  },
  {
    id: "test-auth-flows",
    title: "Verify authentication flows",
    description:
      "Exercise multi-factor and session management tests per ASVS 2.x requirements.",
    category: "Verification",
    roles: ["tester", "architect"],
    rallyMapping: { suggestedWorkItemType: "defect" }
  },
  {
    id: "ba-scope-review",
    title: "Confirm ASVS scope with stakeholders",
    description:
      "Align stakeholders on release scope, regulatory drivers, and required evidence.",
    category: "Program & Governance",
    roles: ["business-analyst", "executive"],
    rallyMapping: { suggestedWorkItemType: "hierarchical-requirement" }
  },
  {
    id: "exec-dashboard",
    title: "Monitor ASVS readiness",
    description:
      "Track completion percentages, outstanding risks, and Rally linkage coverage.",
    category: "Program & Governance",
    roles: ["executive"],
    rallyMapping: { suggestedWorkItemType: "hierarchical-requirement" }
  }
];

const LEVEL_OVERRIDES: Partial<Record<AsvsLevel, AsvsTask[]>> = {
  L2: [
    {
      id: "api-rate-limits",
      title: "Apply contextual rate limiting",
      description:
        "Enforce per-user and per-token rate limits with Rally linked automation work.",
      category: "Implementation",
      roles: ["developer", "architect"],
      rallyMapping: { suggestedWorkItemType: "task" }
    }
  ],
  L3: [
    {
      id: "arch-sast-policy",
      title: "Mandate SAST policy gates",
      description:
        "Integrate policy gates that block builds when ASVS high risk controls regress.",
      category: "Architecture & Design",
      roles: ["architect", "executive"],
      rallyMapping: { suggestedWorkItemType: "hierarchical-requirement" }
    },
    {
      id: "test-redteam",
      title: "Coordinate adversarial testing",
      description:
        "Align red-team exercises to validate Level 3 controls through Rally epics.",
      category: "Verification",
      roles: ["tester", "executive"],
      rallyMapping: { suggestedWorkItemType: "hierarchical-requirement" }
    }
  ]
};

export function buildAsvsChecklist(
  level: AsvsLevel,
  applicationType: ApplicationType,
  role: UserRole
): AsvsTask[] {
  const roleTasks = BASE_TASKS.filter((task) => task.roles.includes(role));
  const overrides = LEVEL_OVERRIDES[level]?.filter((task) =>
    task.roles.includes(role)
  );

  const scoped = [...roleTasks, ...(overrides ?? [])];

  // Placeholder for additional filtering by application type in future versions.
  return scoped.map((task) => ({
    ...task,
    rallyMapping: task.rallyMapping ?? { suggestedWorkItemType: "task" }
  }));
}

