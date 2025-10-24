import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AppLayout } from "../components/layout/AppLayout";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "../components/ui/card";
import { useAuth } from "../lib/auth";
import { linkTaskToRally, fetchChecklistCategories } from "../lib/api";
import { ROLE_LABELS } from "../lib/roles";
import { getDisciplineLabel, getTechnologyLabel } from "../lib/developerOptions";
import { FilterBar } from "../components/checklist/FilterBar";
import { ControlCard } from "../components/checklist/ControlCard";
import { useChecklist, type ChecklistFilters } from "../hooks/useChecklist";
import { ASVS_LEVELS, APPLICATION_TYPES, type AsvsLevel, type ApplicationType } from "../lib/asvs";
import { TicketModal } from "../components/checklist/TicketModal";
import type {
  CreateTicketPayload,
  LinkExistingPayload
} from "../components/checklist/TicketModal";

type RecommendedFiltersPayload = {
  level: AsvsLevel;
  applicationType: ApplicationType;
  discipline: ChecklistFilters["discipline"];
  technology: ChecklistFilters["technology"];
  categories?: string[];
};

export function ChecklistPage() {
  const { user, rallyAccessToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);
  const [workItemId, setWorkItemId] = useState("");
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const hasRallyAccess = Boolean(rallyAccessToken);

  const {
    filters,
    setFilter,
    selectedTaskIds,
    toggleSelection,
    clearSelection,
    disciplineOptions,
    technologyOptions,
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useChecklist(user?.role);

  if (!user) return null;

  const rawTasks = data?.tasks ?? [];
  const metadata = data?.metadata;
  const filteredTasks = useMemo(() => {
    if (!filters.search.trim()) {
      return rawTasks;
    }
    const terms = filters.search
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return rawTasks.filter((task) => {
      const haystack = (
        `${task.shortcode} ${task.section} ${task.sectionShortcode} ${task.category} ${task.description}`
      ).toLowerCase();
      return terms.every((term) => {
        let index = 0;
        for (const char of term) {
          index = haystack.indexOf(char, index);
          if (index === -1) {
            return false;
          }
          index += 1;
        }
        return true;
      });
    });
  }, [rawTasks, filters.search]);

  const selectedCount = selectedTaskIds.size;
  const selectedControls = useMemo(
    () => rawTasks.filter((task) => selectedTaskIds.has(task.id)),
    [rawTasks, selectedTaskIds]
  );
  const levelLabel =
    ASVS_LEVELS.find((level) => level.value === filters.level)?.label ?? filters.level;
  const applicationLabel =
    APPLICATION_TYPES.find((type) => type.value === filters.applicationType)?.label ??
    filters.applicationType.toUpperCase();
  const activeDiscipline = filters.discipline !== "all" ? filters.discipline : null;

  const { data: categoryData } = useQuery({
    queryKey: ["checklist", "categories"],
    queryFn: fetchChecklistCategories
  });
  const categoryOptions = useMemo(
    () => (categoryData?.categories ?? []).slice().sort((a, b) => a.ordinal - b.ordinal),
    [categoryData]
  );

  useEffect(() => {
    const recommended = (location.state as { recommendedFilters?: RecommendedFiltersPayload } | null)?.recommendedFilters;

    if (recommended) {
      setFilter("level", recommended.level);
      setFilter("applicationType", recommended.applicationType);
      setFilter("discipline", recommended.discipline);
      setFilter("technology", recommended.technology);
      if (recommended.categories) {
        setFilter("categories", recommended.categories);
      }
      navigate("/checklist", { replace: true, state: null });
    }
  }, [location.state, setFilter, navigate]);

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
    } catch (linkError) {
      // eslint-disable-next-line no-console
      console.error(linkError);
    } finally {
      setLinkingTaskId(null);
    }
  };

  const handleDownloadJson = () => {
    if (selectedControls.length === 0) return;

    const payload = {
      generatedAt: new Date().toISOString(),
      filters,
      role: user.role,
      controls: selectedControls.map((control) => ({
        id: control.id,
        shortcode: control.shortcode,
        description: control.description,
        level: control.level,
        category: control.category,
        section: control.section,
        recommendedRoles: control.recommendedRoles,
        disciplines: control.disciplines,
        technologies: control.technologies,
        applicationTypes: control.applicationTypes
      }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asvs-requirements-${filters.level}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const createTicketDocument = async (payload: CreateTicketPayload) => {
    const ticket = {
      generatedAt: new Date().toISOString(),
      ticketType: payload.ticketType,
      title: payload.title,
      description: payload.description,
      filters,
      role: user.role,
      controls: selectedControls.map((control) => ({
        id: control.id,
        shortcode: control.shortcode,
        description: control.description,
        level: control.level,
        category: control.category,
        section: control.section,
        recommendedRoles: control.recommendedRoles,
        disciplines: control.disciplines,
        technologies: control.technologies,
        applicationTypes: control.applicationTypes
      }))
    };

    const blob = new Blob([JSON.stringify(ticket, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload.ticketType}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const linkSelectedControls = async (payload: LinkExistingPayload) => {
    if (!hasRallyAccess || !rallyAccessToken) {
      throw new Error("Rally integration is disabled.");
    }

    await Promise.all(
      selectedControls.map((control) =>
        linkTaskToRally({
          taskId: control.id,
          workItemId: payload.workItemId,
          accessToken: rallyAccessToken,
          metadata: {
            ticketType: payload.ticketType,
            notes: payload.notes,
            level: filters.level,
            applicationType: filters.applicationType,
            role: user.role
          }
        })
      )
    );
  };

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
        <FilterBar
          filters={filters}
        onFilterChange={setFilter}
          workItemId={workItemId}
          onWorkItemIdChange={setWorkItemId}
          selectionCount={selectedCount}
          onClearSelection={clearSelection}
          disciplineOptions={disciplineOptions}
          technologyOptions={technologyOptions}
          categoryOptions={categoryOptions}
        />

        {selectedCount > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedCount} control{selectedCount === 1 ? "" : "s"} selected
                </CardTitle>
                <CardDescription>
                  Export requirements or send to your ticketing system to schedule remediation work.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setTicketModalOpen(true)}>
                  Send to ticket system
                </Button>
                <Button variant="outline" onClick={handleDownloadJson}>
                  Download JSON
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        <div className="space-y-6">
          {metadata && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {metadata.shortName} v{metadata.version}
                </CardTitle>
                <CardDescription>
                  Showing {metadata.resultCount} controls for {levelLabel} • {applicationLabel} •{" "}
                  {ROLE_LABELS[user.role]}
                  {filters.discipline !== "all" && <> • {getDisciplineLabel(filters.discipline)}</>}
                  {filters.technology !== "all" && <> • {getTechnologyLabel(filters.technology)}</>}
                  {filters.categories.length > 0 && (
                    <> • Categories: {filters.categories.join(", ")}</>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {isLoading && (
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
            {filteredTasks.map((task) => (
              <ControlCard
                key={task.id}
                control={task}
                selected={selectedTaskIds.has(task.id)}
                onSelect={() => toggleSelection(task.id)}
                onLink={() => void handleLink(task.id)}
                linking={linkingTaskId === task.id}
                hasRallyAccess={hasRallyAccess}
                workItemProvided={Boolean(workItemId)}
                activeDiscipline={activeDiscipline}
              />
            ))}
          </div>

          {filteredTasks.length === 0 && !(isLoading || isFetching) && !isError && (
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

      <TicketModal
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
        selectedControls={selectedControls}
        defaultWorkItemId={workItemId}
        onCreateTicket={createTicketDocument}
        onLinkExisting={linkSelectedControls}
        hasRallyAccess={hasRallyAccess}
        onSuccess={clearSelection}
      />
    </AppLayout>
  );
}
