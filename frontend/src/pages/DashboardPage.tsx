import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AppLayout } from "../components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";

import { useAuth } from "../lib/auth";
import { ROLE_DESCRIPTIONS } from "../lib/roles";
import {
  fetchQuestionnaireResponse,
  fetchChecklistCategories,
  type AsvsCategory,
  type TechnologyTag
} from "../lib/api";
import type { QuestionnaireAnswersResponse } from "../lib/questionnaire";
import {
  DISCIPLINE_OPTIONS,
  TECHNOLOGY_OPTIONS,
  getDisciplineLabel,
  getTechnologyLabel
} from "../lib/developerOptions";
import {
  ASVS_LEVELS,
  APPLICATION_TYPES,
  type AsvsLevel,
  type ApplicationType
} from "../lib/asvs";

const TARGET_STORAGE_PREFIX = "owasp-rat-targets";

type DashboardTargets = {
  level: AsvsLevel;
  applicationType: ApplicationType;
  discipline: (typeof DISCIPLINE_OPTIONS)[number]["value"];
  technology: TechnologyTag | "all";
  categories: string[];
};

const DEFAULT_TARGETS: DashboardTargets = {
  level: "L2",
  applicationType: "web",
  discipline: "backend",
  technology: "all",
  categories: []
};

function normalizeTargets(targets: DashboardTargets): DashboardTargets {
  return {
    ...targets,
    categories: (targets.categories ?? []).map((category) => category.toUpperCase())
  };
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const questionnaireQuery = useQuery({
    queryKey: ["questionnaire", user?.id],
    queryFn: () => fetchQuestionnaireResponse(user!.id),
    enabled: Boolean(user?.id)
  });

  const categoriesQuery = useQuery({
    queryKey: ["checklist", "categories"],
    queryFn: fetchChecklistCategories
  });

  const categoryOptions: AsvsCategory[] = useMemo(
    () =>
      (categoriesQuery.data?.categories ?? [])
        .slice()
        .sort((a, b) => a.ordinal - b.ordinal),
    [categoriesQuery.data?.categories]
  );

  const questionnaire = questionnaireQuery.data as QuestionnaireAnswersResponse | undefined;
  const recommended = questionnaire?.recommendations;

  const [targets, setTargets] = useState<DashboardTargets>(DEFAULT_TARGETS);
  const [targetsLoaded, setTargetsLoaded] = useState(false);

  useEffect(() => {
    if (!user || targetsLoaded) {
      return;
    }
    const storageKey = `${TARGET_STORAGE_PREFIX}:${user.id}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as DashboardTargets;
        setTargets(normalizeTargets(parsed));
        setTargetsLoaded(true);
        return;
      } catch (error) {
        // ignore malformed state and fall through to defaults
      }
    }

    if (recommended) {
      setTargets(
        normalizeTargets({
          level: recommended.level,
          applicationType: recommended.applicationType,
          discipline: recommended.discipline,
          technology: recommended.technology,
          categories: recommended.recommendedCategories ?? []
        })
      );
      setTargetsLoaded(true);
      return;
    }

    setTargets(DEFAULT_TARGETS);
    setTargetsLoaded(true);
  }, [user, targetsLoaded, recommended]);

  const questionnaireStatus = questionnaire ? "Complete" : "Not started";
  const lastUpdated = questionnaire?.updatedAt
    ? new Date(questionnaire.updatedAt).toLocaleString()
    : null;

  const storageKey = user ? `${TARGET_STORAGE_PREFIX}:${user.id}` : null;

  const updateTargets = <K extends keyof DashboardTargets>(
    key: K,
    value: DashboardTargets[K]
  ) => {
    setTargets((previous) => {
      const base = previous ?? DEFAULT_TARGETS;
      const next = normalizeTargets({
        ...base,
        [key]: value
      });
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  const handleCategoryChange = (values: string[]) => {
    updateTargets("categories", values ?? []);
  };

  const handleApplyRecommendation = () => {
    if (!recommended) {
      return;
    }
    navigate("/checklist", {
      state: {
        recommendedFilters: {
          level: recommended.level,
          applicationType: recommended.applicationType,
          discipline: recommended.discipline,
          technology: recommended.technology,
          categories: recommended.recommendedCategories ?? []
        }
      }
    });
  };

  const handleApplyTargets = () => {
    navigate("/checklist", {
      state: {
        recommendedFilters: targets
      }
    });
  };

  const handleResetTargets = () => {
    const next = recommended
      ? {
          level: recommended.level,
          applicationType: recommended.applicationType,
          discipline: recommended.discipline,
          technology: recommended.technology,
          categories: recommended.recommendedCategories ?? []
        }
      : DEFAULT_TARGETS;

    const normalized = normalizeTargets(next);
    setTargets(normalized);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(normalized));
    }
  };

  const quickActions = [
    {
      title: "Review questionnaire",
      description: recommended
        ? "Update responses to refine recommendations and ASVS focus."
        : "Complete the questionnaire to personalise ASVS guidance for your role.",
      action: () => navigate("/questionnaire"),
      cta: recommended ? "Edit questionnaire" : "Start questionnaire"
    },
    {
      title: "Open checklist",
      description: "Tailor ASVS controls using filters, categories, and search.",
      action: () => navigate("/checklist"),
      cta: "Go to checklist"
    },
    {
      title: "Link Rally work",
      description: "Connect selected controls to Rally stories, tasks, or epics via the adapter.",
      action: () => navigate("/checklist#rally"),
      cta: "View integrations"
    }
  ];

  return (
    <AppLayout
      title={`Welcome back${user ? `, ${user.name}` : ""}`}
      subtitle={user ? ROLE_DESCRIPTIONS[user.role] : undefined}
      actions={
        <Button asChild variant="secondary">
          <Link to="/checklist">New checklist</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <CardTitle>Questionnaire overview</CardTitle>
                <Badge variant={questionnaire ? "default" : "outline"}>
                  {questionnaireStatus}
                </Badge>
              </div>
              <CardDescription>
                Capture application context to drive ASVS level, platform, and category focus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              {lastUpdated ? (
                <p>
                  Last updated <span className="font-medium text-foreground">{lastUpdated}</span>
                </p>
              ) : (
                <p>No responses saved yet.</p>
              )}

              {recommended ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs uppercase text-muted-foreground">Recommended profile</span>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{ASVS_LEVELS.find((l) => l.value === recommended.level)?.label ?? recommended.level}</Badge>
                      <Badge>
                        {APPLICATION_TYPES.find((type) => type.value === recommended.applicationType)?.label ?? recommended.applicationType.toUpperCase()}
                      </Badge>
                      <Badge>{getDisciplineLabel(recommended.discipline)}</Badge>
                      <Badge>
                        {recommended.technology === "all"
                          ? "Any / TBD"
                          : getTechnologyLabel(recommended.technology)}
                      </Badge>
                    </div>
                  </div>

                  {recommended.recommendedCategories?.length ? (
                    <div className="space-y-1">
                      <span className="text-xs uppercase text-muted-foreground">Focus categories</span>
                      <div className="flex flex-wrap gap-2">
                        {recommended.recommendedCategories.map((category) => (
                          <Badge key={category} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {recommended.notes.length ? (
                    <div className="space-y-1">
                      <span className="text-xs uppercase text-muted-foreground">Notes</span>
                      <ul className="list-disc space-y-1 pl-4">
                        {recommended.notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p>Complete the questionnaire to receive recommended levels and categories.</p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button onClick={() => navigate("/questionnaire")}>
                {questionnaire ? "Edit questionnaire" : "Start questionnaire"}
              </Button>
              <Button
                variant="secondary"
                disabled={!recommended}
                onClick={handleApplyRecommendation}
              >
                Apply recommendation
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Target profile</CardTitle>
              <CardDescription>
                Fine-tune your desired ASVS scope. Targets are saved locally for quick reuse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="target-level">
                    ASVS level
                  </label>
                  <Select
                    value={targets.level}
                    onValueChange={(value) => updateTargets("level", value as AsvsLevel)}
                  >
                    <SelectTrigger id="target-level">
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
                  <label className="text-sm font-medium" htmlFor="target-application">
                    Application type
                  </label>
                  <Select
                    value={targets.applicationType}
                    onValueChange={(value) =>
                      updateTargets("applicationType", value as ApplicationType)
                    }
                  >
                    <SelectTrigger id="target-application">
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
                  <label className="text-sm font-medium" htmlFor="target-discipline">
                    Discipline focus
                  </label>
                  <Select
                    value={targets.discipline}
                    onValueChange={(value) =>
                      updateTargets("discipline", value as DashboardTargets["discipline"])
                    }
                  >
                    <SelectTrigger id="target-discipline">
                      <SelectValue placeholder="Select discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {DISCIPLINE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="target-technology">
                    Primary technology
                  </label>
                  <Select
                    value={targets.technology}
                    onValueChange={(value) =>
                      updateTargets("technology", value as TechnologyTag | "all")
                    }
                  >
                    <SelectTrigger id="target-technology">
                      <SelectValue placeholder="Select technology" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any / TBD</SelectItem>
                      {TECHNOLOGY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ASVS categories</label>
                <p className="text-xs text-muted-foreground">
                  Highlight particular control families. These pair with checklist filters and exports.
                </p>
                <ToggleGroup
                  type="multiple"
                  value={targets.categories}
                  onValueChange={handleCategoryChange}
                  className="flex flex-wrap gap-2"
                >
                  {categoryOptions.map((category) => (
                    <ToggleGroupItem
                      key={category.shortcode}
                      value={category.shortcode}
                      title={category.name}
                      className="flex-1 basis-[calc(33%-0.5rem)] text-xs sm:basis-[calc(20%-0.5rem)]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono text-sm">{category.shortcode}</span>
                        <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px]">
                          {category.name}
                        </span>
                      </div>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button onClick={handleApplyTargets}>Apply to checklist</Button>
              <Button variant="secondary" onClick={handleResetTargets}>
                Reset to recommendation
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="shadow-sm">
              <CardHeader>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button onClick={action.action}>{action.cta}</Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </AppLayout>
  );
}
