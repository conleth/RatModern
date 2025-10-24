import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState
} from "react";
import { useQuery } from "@tanstack/react-query";

import type { UserRole } from "../lib/auth";
import type {
  DeveloperDiscipline,
  TechnologyTag,
  ChecklistResponse
} from "../lib/api";
import { requestChecklist } from "../lib/api";
import type { AsvsLevel, ApplicationType } from "../lib/asvs";
import {
  DISCIPLINE_OPTIONS,
  TECHNOLOGY_OPTIONS,
  getDisciplinesForTechnology,
  getTechnologiesForDiscipline
} from "../lib/developerOptions";

const INITIAL_FILTERS = {
  level: "L2" as AsvsLevel,
  applicationType: "web" as ApplicationType,
  discipline: "all" as ChecklistFilters["discipline"],
  technology: "all" as ChecklistFilters["technology"],
  categories: []
};

type FilterAction =
  | { type: "setLevel"; value: AsvsLevel }
  | { type: "setApplicationType"; value: ApplicationType }
  | { type: "setDiscipline"; value: ChecklistFilters["discipline"] }
  | { type: "setTechnology"; value: ChecklistFilters["technology"] }
  | { type: "setCategories"; value: string[] };

const ROLE_DEFAULT_DISCIPLINE: Partial<
  Record<UserRole, DeveloperDiscipline>
> = {
  developer: "backend",
  tester: "qa-engineer",
  architect: "security-engineer",
  "business-analyst": "project-manager",
  executive: "project-manager"
};

export type ChecklistFilters = {
  level: AsvsLevel;
  applicationType: ApplicationType;
  discipline: DeveloperDiscipline | "all";
  technology: TechnologyTag | "all";
  categories: string[];
};

function filtersReducer(
  state: ChecklistFilters,
  action: FilterAction
): ChecklistFilters {
  switch (action.type) {
    case "setLevel":
      return { ...state, level: action.value };
    case "setApplicationType":
      return {
        ...state,
        applicationType: action.value,
        discipline: "all",
        technology: "all"
      };
    case "setDiscipline": {
      if (action.value === "all") {
        return { ...state, discipline: "all" };
      }

      const allowedTechnologies = getTechnologiesForDiscipline(action.value);
      const nextTechnology =
        state.technology !== "all" &&
        allowedTechnologies.includes(state.technology)
          ? state.technology
          : "all";

      return {
        ...state,
        discipline: action.value,
        technology: nextTechnology,
        categories: []
      };
    }
    case "setTechnology": {
      if (action.value === "all") {
        return { ...state, technology: "all", categories: [] };
      }

      const allowedDisciplines = getDisciplinesForTechnology(action.value);
      const nextDiscipline =
        state.discipline !== "all" &&
        allowedDisciplines.includes(state.discipline)
          ? state.discipline
          : (allowedDisciplines[0] as ChecklistFilters["discipline"]) ?? "all";

      return {
        ...state,
        technology: action.value,
        discipline: nextDiscipline,
        categories: []
      };
    }
    case "setCategories":
      return {
        ...state,
        categories: (action.value ?? []).map((category) => category.toUpperCase())
      };
    default:
      return state;
  }
}

export function useChecklist(role: UserRole | undefined) {
  const [filters, dispatch] = useReducer(filtersReducer, INITIAL_FILTERS);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    () => new Set<string>()
  );

  const disciplineOptions = useMemo(() => {
    if (filters.technology === "all") {
      return DISCIPLINE_OPTIONS;
    }

    const allowed = new Set(
      getDisciplinesForTechnology(filters.technology)
    );

    return DISCIPLINE_OPTIONS.filter((option) =>
      allowed.has(option.value)
    );
  }, [filters.technology]);

  const technologyOptions = useMemo(() => {
    if (filters.discipline === "all") {
      return TECHNOLOGY_OPTIONS;
    }

    const allowed = new Set(
      getTechnologiesForDiscipline(filters.discipline)
    );

    return TECHNOLOGY_OPTIONS.filter((option) =>
      allowed.has(option.value)
    );
  }, [filters.discipline]);

  useEffect(() => {
    if (!role) return;
    if (filters.discipline !== "all") return;

    const suggested = ROLE_DEFAULT_DISCIPLINE[role];
    if (suggested) {
      dispatch({ type: "setDiscipline", value: suggested });
    }
  }, [role, filters.discipline]);

  const checklistQuery = useQuery({
    queryKey: [
      "checklist",
      role,
      filters.level,
      filters.applicationType,
      filters.discipline,
      filters.technology,
      filters.categories
    ],
    queryFn: ({ signal }) =>
      requestChecklist(
        {
          level: filters.level,
          applicationType: filters.applicationType,
          role: role ?? "developer",
          discipline: filters.discipline === "all" ? null : filters.discipline,
          technology: filters.technology === "all" ? null : filters.technology,
          categories: filters.categories.length ? filters.categories : null
        },
        signal
      ) as Promise<ChecklistResponse>,
    enabled: Boolean(role),
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    setSelectedTaskIds(new Set<string>());
  }, [
    role,
    filters.level,
    filters.applicationType,
    filters.discipline,
    filters.technology,
    filters.categories
  ]);

  const setFilter = useCallback(
    (key: keyof ChecklistFilters, value: ChecklistFilters[keyof ChecklistFilters]) => {
      switch (key) {
        case "level":
          dispatch({ type: "setLevel", value: value as AsvsLevel });
          break;
        case "applicationType":
          dispatch({
            type: "setApplicationType",
            value: value as ApplicationType
          });
          break;
        case "discipline":
          dispatch({
            type: "setDiscipline",
            value: value as ChecklistFilters["discipline"]
          });
          break;
        case "technology":
          dispatch({
            type: "setTechnology",
            value: value as ChecklistFilters["technology"]
          });
          break;
        case "categories":
          dispatch({
            type: "setCategories",
            value: (value as string[]) ?? []
          });
          break;
        default:
          break;
      }
    },
    []
  );

  const toggleSelection = useCallback((taskId: string) => {
    setSelectedTaskIds((previous) => {
      const next = new Set(previous);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set<string>());
  }, []);

  return {
    filters,
    setFilter,
    disciplineOptions,
    technologyOptions,
    selectedTaskIds,
    toggleSelection,
    clearSelection,
    ...checklistQuery
  };
}
