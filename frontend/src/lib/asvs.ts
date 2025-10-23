export type AsvsLevel = "L1" | "L2" | "L3";
export type ApplicationType = "web" | "mobile" | "api";

export const ASVS_LEVELS: { value: AsvsLevel; label: string }[] = [
  { value: "L1", label: "Level 1 – Opportunistic" },
  { value: "L2", label: "Level 2 – Standard" },
  { value: "L3", label: "Level 3 – Advanced" }
];

export const APPLICATION_TYPES: { value: ApplicationType; label: string }[] = [
  { value: "web", label: "Web Application" },
  { value: "mobile", label: "Mobile / Hybrid Application" },
  { value: "api", label: "API / Microservice" }
];
