import { AuthenticatedUser, UserRole } from "./auth";
import { ApplicationType, AsvsLevel } from "./asvs";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export type ChecklistRequest = {
  level: AsvsLevel;
  applicationType: ApplicationType;
  role: UserRole;
  technology?: TechnologyTag | null;
  discipline?: DeveloperDiscipline | null;
};

export type ChecklistControl = {
  id: string;
  shortcode: string;
  level: AsvsLevel;
  category: string;
  categoryShortcode: string;
  section: string;
  sectionShortcode: string;
  description: string;
  recommendedRoles: UserRole[];
  applicationTypes: ApplicationType[];
  disciplines: DeveloperDiscipline[];
  technologies: TechnologyTag[];
};

export type ChecklistResponse = {
  metadata?: {
    name: string;
    shortName: string;
    version: string;
    description: string;
    totalControls: number;
    filters: ChecklistRequest;
    resultCount: number;
  };
  tasks: ChecklistControl[];
};

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

export type DeveloperDiscipline =
  | "frontend"
  | "backend"
  | "mobile"
  | "fullstack"
  | "data-analyst"
  | "devops"
  | "security-engineer"
  | "qa-engineer"
  | "project-manager";

export async function authenticateWithRally(code: string) {
  const response = await fetch(`${API_BASE_URL}/oauth/rally/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Rally authorization code");
  }

  return (await response.json()) as {
    accessToken: string;
    refreshToken?: string;
  };
}

export async function fetchMockSession() {
  const response = await fetch(`${API_BASE_URL}/auth/mock-session`);

  if (!response.ok) {
    throw new Error("Failed to fetch mock session");
  }

  return (await response.json()) as { user: AuthenticatedUser };
}

export function getEnvMockUser(): AuthenticatedUser | null {
  const id = import.meta.env.VITE_MOCK_USER_ID;
  const name = import.meta.env.VITE_MOCK_USER_NAME;
  const email = import.meta.env.VITE_MOCK_USER_EMAIL;
  const role = import.meta.env.VITE_MOCK_USER_ROLE as UserRole | undefined;

  if (!id || !name || !email || !role) {
    return null;
  }

  return {
    id,
    name,
    email,
    role
  };
}

export async function requestChecklist(
  params: ChecklistRequest,
  signal?: AbortSignal
): Promise<ChecklistResponse> {
  const response = await fetch(`${API_BASE_URL}/checklists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal
  });

  if (!response.ok) {
    throw new Error("Failed to retrieve checklist");
  }

  return (await response.json()) as ChecklistResponse;
}

export async function linkTaskToRally({
  taskId,
  workItemId,
  accessToken,
  metadata
}: {
  taskId: string;
  workItemId: string;
  accessToken?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`${API_BASE_URL}/ticketing/rally/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify({ taskId, workItemId, metadata })
  });

  if (!response.ok) {
    throw new Error("Failed to link task to Rally");
  }
}
