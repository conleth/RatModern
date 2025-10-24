import type {
  DeveloperDiscipline,
  TechnologyTag
} from "./api";

export const TECHNOLOGY_OPTIONS: { value: TechnologyTag; label: string }[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" }
];

export const DISCIPLINE_OPTIONS: {
  value: DeveloperDiscipline;
  label: string;
}[] = [
  { value: "frontend", label: "Frontend Developer" },
  { value: "backend", label: "Backend Developer" },
  { value: "mobile", label: "Mobile Developer" },
  { value: "fullstack", label: "Fullstack Developer" },
  { value: "data-analyst", label: "Data Analyst / Engineer" },
  { value: "devops", label: "DevOps / Platform" },
  { value: "security-engineer", label: "Security Engineer" },
  { value: "qa-engineer", label: "QA / Test Engineer" },
  { value: "project-manager", label: "Project / Delivery Manager" }
];

const technologyLabelMap = TECHNOLOGY_OPTIONS.reduce<Record<TechnologyTag, string>>(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<TechnologyTag, string>
);

const disciplineLabelMap = DISCIPLINE_OPTIONS.reduce<
  Record<DeveloperDiscipline, string>
>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {} as Record<DeveloperDiscipline, string>);

export function getTechnologyLabel(value: TechnologyTag) {
  return technologyLabelMap[value] ?? value;
}

export function getDisciplineLabel(value: DeveloperDiscipline) {
  return disciplineLabelMap[value] ?? value;
}

const technologyToDisciplines: Record<TechnologyTag, DeveloperDiscipline[]> = {
  typescript: ["frontend", "fullstack"],
  javascript: ["frontend", "fullstack"],
  python: ["backend", "data-analyst", "fullstack"],
  java: ["backend", "mobile", "fullstack"],
  csharp: ["backend", "fullstack"],
  go: ["backend", "devops"],
  ruby: ["backend", "fullstack"],
  php: ["backend", "fullstack"],
  kotlin: ["mobile", "backend"],
  swift: ["mobile"]
};

const disciplineToTechnologies: Record<
  DeveloperDiscipline,
  TechnologyTag[]
> = {
  frontend: ["typescript", "javascript"],
  backend: ["typescript", "javascript", "python", "java", "csharp", "go", "ruby", "php", "kotlin"],
  mobile: ["kotlin", "swift", "java", "typescript"],
  fullstack: ["typescript", "javascript", "python", "java", "csharp", "ruby", "php"],
  "data-analyst": ["python"],
  devops: ["go", "python", "java"],
  "security-engineer": [
    "python",
    "java",
    "csharp",
    "go",
    "typescript",
    "javascript"
  ],
  "qa-engineer": ["typescript", "javascript", "python", "java"],
  "project-manager": [
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

export function getDisciplinesForTechnology(technology: TechnologyTag) {
  return technologyToDisciplines[technology] ?? DISCIPLINE_OPTIONS.map((option) => option.value);
}

export function getTechnologiesForDiscipline(discipline: DeveloperDiscipline) {
  return disciplineToTechnologies[discipline] ?? TECHNOLOGY_OPTIONS.map((option) => option.value);
}
