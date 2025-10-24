import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppLayout } from "../components/layout/AppLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { useAuth } from "../lib/auth";
import {
  linkTaskToRally,
  requestChecklist,
  DeveloperDiscipline,
  TechnologyTag
} from "../lib/api";
import { ROLE_LABELS } from "../lib/roles";
import {
  DISCIPLINE_OPTIONS,
  TECHNOLOGY_OPTIONS,
  getDisciplineLabel,
  getTechnologyLabel,
  getDisciplinesForTechnology,
  getTechnologiesForDiscipline
} from "../lib/developerOptions";
import {
  APPLICATION_TYPES,
  ASVS_LEVELS,
  AsvsLevel,
  ApplicationType
} from "../lib/asvs";
import { cn } from "../lib/utils";

type ChecklistFilters = {
  level: AsvsLevel;
  applicationType: ApplicationType;
  discipline: DeveloperDiscipline | "all";
  technology: TechnologyTag | "all";
};

type SelectionMode = "single" | "multi";

export function ChecklistPage() {
  const { user, rallyAccessToken } = useAuth();
  const [filters, setFilters] = useState<ChecklistFilters>({
    level: "L2",
    applicationType: "web",
    discipline: "all",
    technology: "all"
  });
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("multi");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    () => new Set<string>()
  );
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);
  const [workItemId, setWorkItemId] = useState("");
  const hasRallyAccess = Boolean(rallyAccessToken);

  const allowedDisciplineValues = useMemo<DeveloperDiscipline[]>(() => {
    if (filters.technology === "all") {
      return DISCIPLINE_OPTIONS.map((option) => option.value);
    }
    return getDisciplinesForTechnology(filters.technology);
  }, [filters.technology]);

  const allowedTechnologyValues = useMemo<TechnologyTag[]>(() => {
    if (filters.discipline === "all") {
      return TECHNOLOGY_OPTIONS.map((option) => option.value);
    }
    return getTechnologiesForDiscipline(filters.discipline);
  }, [filters.discipline]);

  useEffect(() => {
    if (
      filters.discipline !== "all" &&
      !allowedDisciplineValues.includes(filters.discipline)
    ) {
      setFilters((prev) => ({ ...prev, discipline: "all" }));
    }
  }, [allowedDisciplineValues, filters.discipline]);

  useEffect(() => {
    if (
      filters.technology !== "all" &&
      !allowedTechnologyValues.includes(filters.technology)
    ) {
      setFilters((prev) => ({ ...prev, technology: "all" }));
    }
  }, [allowedTechnologyValues, filters.technology]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      "checklist",
      user?.role,
      filters.level,
      filters.applicationType,
      filters.discipline,
      filters.technology
    ],
    queryFn: ({ signal }) => {
      const requestPayload = {
        level: filters.level,
        applicationType: filters.applicationType,
        role: user!.role,
        discipline: filters.discipline === "all" ? null : filters.discipline,
        technology: filters.technology === "all" ? null : filters.technology
      };

      return requestChecklist(requestPayload, signal);
    },
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000
  });

  const tasks = data?.tasks ?? [];
  const metadata = data?.metadata;
  const selectedCount = selectedTaskIds.size;

  if (!user) return null;

  useEffect(() => {
    setSelectedTaskIds(new Set<string>());
  }, [user?.role, filters.level, filters.applicationType, filters.discipline, filters.technology]);

  useEffect(() => {
    if (selectionMode === "single") {
      setSelectedTaskIds((prev) => {
        if (prev.size <= 1) return prev;
        const [first] = Array.from(prev);
        return new Set(first ? [first] : []);
      });
    }
  }, [selectionMode]);

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (selectionMode === "single") {
        if (next.has(taskId) && next.size === 1) {
          next.clear();
        } else {
          next.clear();
          next.add(taskId);
        }
        return next;
      }

      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleTaskKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    taskId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTaskSelect(taskId);
    }
  };

  const handleLink = async (taskId: string) => {
    if (!workItemId) {
      return;
    }

    try {
      if (!hasRallyAccess) {
        return;
      }
      setLinkingTaskId(taskId);
      await linkTaskToRally({
        taskId,
        workItemId,
        accessToken: rallyAccessToken,
        metadata: {
          level: filters.level,
          applicationType: filters.applicationType,
          role: user.role,
          discipline: filters.discipline === "all" ? undefined : filters.discipline,
          technology: filters.technology === "all" ? undefined : filters.technology
        }
      });
      setWorkItemId("");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      // In a real app this would surface a toast notification.
    } finally {
      setLinkingTaskId(null);
    }
  };

  const disciplineOptions = useMemo(
    () =>
      DISCIPLINE_OPTIONS.filter((option) =>
        allowedDisciplineValues.includes(option.value)
      ),
    [allowedDisciplineValues]
  );

  const technologyOptions = useMemo(
    () =>
      TECHNOLOGY_OPTIONS.filter((option) =>
        allowedTechnologyValues.includes(option.value)
      ),
    [allowedTechnologyValues]
  );

  return (
    <AppLayout
      title="ASVS checklist"
      subtitle="Tailor security activities and connect them to Rally work."
      actions={
        <Button variant="outline" onClick={() => window.print()}>
          Export
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filter checklist</CardTitle>
            <CardDescription>
              Narrow ASVS controls by level, platform, discipline, technology, or selection mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="level">ASVS level</Label>
                <Select
                  value={filters.level}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, level: value as AsvsLevel }))
                  }
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASVS_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application-type">Application type</Label>
                <Select
                  value={filters.applicationType}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      applicationType: value as ApplicationType
                    }))
                  }
                >
                  <SelectTrigger id="application-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discipline">Discipline focus</Label>
              <Select
                value={filters.discipline}
                onValueChange={(value) =>
                  setFilters((prev) => {
                    const nextDiscipline = value as ChecklistFilters["discipline"];
                    if (nextDiscipline === "all") {
                      return { ...prev, discipline: "all" };
                    }

                    const allowedTechnologiesForDiscipline =
                      getTechnologiesForDiscipline(nextDiscipline);

                    let nextTechnology = prev.technology;
                    if (
                      nextTechnology === "all" ||
                      !allowedTechnologiesForDiscipline.includes(
                        nextTechnology as TechnologyTag
                      )
                    ) {
                      nextTechnology =
                        (allowedTechnologiesForDiscipline[0] as ChecklistFilters["technology"]) ??
                        "all";
                    }

                    return {
                      ...prev,
                      discipline: nextDiscipline,
                      technology: nextTechnology
                    };
                  })
                }
              >
                  <SelectTrigger id="discipline">
                    <SelectValue placeholder="Select discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All disciplines</SelectItem>
                    {disciplineOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="technology">Primary technology</Label>
              <Select
                value={filters.technology}
                onValueChange={(value) =>
                  setFilters((prev) => {
                    const nextTechnology = value as ChecklistFilters["technology"];
                    if (nextTechnology === "all") {
                      return { ...prev, technology: "all" };
                    }

                    const allowedDisciplinesForTechnology =
                      getDisciplinesForTechnology(nextTechnology);

                    let nextDiscipline = prev.discipline;
                    if (
                      nextDiscipline === "all" ||
                      !allowedDisciplinesForTechnology.includes(
                        nextDiscipline as DeveloperDiscipline
                      )
                    ) {
                      nextDiscipline =
                        (allowedDisciplinesForTechnology[0] as ChecklistFilters["discipline"]) ??
                        "all";
                    }

                    return {
                      ...prev,
                      technology: nextTechnology,
                      discipline: nextDiscipline
                    };
                  })
                }
              >
                  <SelectTrigger id="technology">
                    <SelectValue placeholder="Select technology" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All technologies</SelectItem>
                    {technologyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selection-mode">Selection mode</Label>
                <Select
                  value={selectionMode}
                  onValueChange={(value) =>
                    setSelectionMode(value as SelectionMode)
                  }
                >
                  <SelectTrigger id="selection-mode">
                    <SelectValue placeholder="Choose mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single select</SelectItem>
                    <SelectItem value="multi">Multi select</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rally-work-item">Rally work item ID</Label>
                <Input
                  id="rally-work-item"
                  value={workItemId}
                  placeholder="ex: US123456"
                  onChange={(event) => setWorkItemId(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Provide a Rally formatted ID to link selected tasks.
                </p>
              </div>
              <div className="flex flex-col gap-2 justify-between md:items-end">
                <div className="text-sm text-muted-foreground">
                  {selectedCount > 0 ? (
                    <>
                      <span className="font-medium text-foreground">
                        {selectedCount}
                      </span>{" "}
                      control{selectedCount === 1 ? "" : "s"} selected
                    </>
                  ) : (
                    "No controls selected"
                  )}
                </div>
                {selectedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-end"
                    onClick={() => setSelectedTaskIds(new Set<string>())}
                  >
                    Clear selection
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {metadata && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {metadata.shortName} v{metadata.version}
                </CardTitle>
                <CardDescription>
                  Showing {metadata.resultCount} controls for{" "}
                  {ASVS_LEVELS.find((level) => level.value === filters.level)?.label ?? filters.level}{" "}
                  • {APPLICATION_TYPES.find((type) => type.value === filters.applicationType)?.label ?? filters.applicationType}{" "}
                  • {ROLE_LABELS[user.role]}
                  {filters.discipline !== "all" && <> • {getDisciplineLabel(filters.discipline)}</>}
                  {filters.technology !== "all" && <> • {getTechnologyLabel(filters.technology)}</>}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {!hasRallyAccess && (
            <Card>
              <CardHeader>
                <CardTitle>Rally integration disabled</CardTitle>
                <CardDescription>
                  OAuth is currently disabled; linking tasks to Rally requires an access token.
                  Enable OAuth or provide a mock token to re-enable this action.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {(isLoading || isFetching) && (
            <Card>
              <CardHeader>
                <CardTitle>Loading checklist…</CardTitle>
                <CardDescription>
                  Fetching ASVS controls for the selected level and context.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {isError && (
            <Card>
              <CardHeader>
                <CardTitle>Unable to load checklist</CardTitle>
                <CardDescription>
                  {error instanceof Error
                    ? error.message
                    : "Unexpected error occurred while retrieving ASVS data."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" onClick={() => refetch()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => {
              const isSelected = selectedTaskIds.has(task.id);

              return (
                <Card
                  key={task.id}
                  id={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTaskSelect(task.id)}
                  onKeyDown={(event) => handleTaskKeyDown(event, task.id)}
                  className={cn(
                    "relative flex h-full flex-col cursor-pointer border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
                    isSelected
                      ? "border-primary/80 bg-primary/5"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  {isSelected && (
                    <div className="absolute right-3 top-3">
                      <Badge variant="default">Selected</Badge>
                    </div>
                  )}
                  <CardHeader className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs uppercase">
                      <Badge variant="outline" className="font-mono">
                        {task.shortcode}
                      </Badge>
                      <Badge variant="outline">{task.level}</Badge>
                      <Badge>{task.categoryShortcode}</Badge>
                    </div>
                    <div>
                      <CardTitle className="text-base md:text-lg">
                        {task.section}
                      </CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>
                        Category:{" "}
                        <span className="font-medium text-foreground">
                          {task.category}
                        </span>
                      </div>
                      <div>
                        Recommended roles:{" "}
                        <span className="font-medium text-foreground">
                          {task.recommendedRoles
                            .map((role) => ROLE_LABELS[role] ?? role)
                            .join(", ")}
                        </span>
                      </div>
                      <div>
                        Disciplines:{" "}
                        <span className="font-medium text-foreground">
                          {task.disciplines
                            .map((discipline) => getDisciplineLabel(discipline))
                            .join(", ")}
                        </span>
                      </div>
                      <div>
                        Technologies:{" "}
                        <span className="font-medium text-foreground">
                          {task.technologies
                            .map((tech) => getTechnologyLabel(tech))
                            .join(", ")}
                        </span>
                      </div>
                      <div>
                        Application focus:{" "}
                        <span className="font-medium text-foreground uppercase">
                          {task.applicationTypes.join(", ")}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto flex justify-end">
                      <Button
                        variant="secondary"
                        disabled={
                          !workItemId || linkingTaskId === task.id || !hasRallyAccess
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleLink(task.id);
                        }}
                      >
                        {linkingTaskId === task.id
                          ? "Linking..."
                          : hasRallyAccess
                          ? "Link to Rally"
                          : "OAuth disabled"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {tasks.length === 0 && !(isLoading || isFetching) && !isError && (
            <Card>
              <CardHeader>
                <CardTitle>No controls available</CardTitle>
                <CardDescription>
                  Adjust filters or broaden your discipline/technology to populate this list.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
