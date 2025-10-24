import { useMemo, useState } from "react";

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
import { linkTaskToRally } from "../lib/api";
import { ROLE_LABELS } from "../lib/roles";
import { getDisciplineLabel, getTechnologyLabel } from "../lib/developerOptions";
import { FilterBar } from "../components/checklist/FilterBar";
import { ControlCard } from "../components/checklist/ControlCard";
import { useChecklist } from "../hooks/useChecklist";
import { ASVS_LEVELS, APPLICATION_TYPES } from "../lib/asvs";
import { TicketModal } from "../components/checklist/TicketModal";
import type {
  CreateTicketPayload,
  LinkExistingPayload
} from "../components/checklist/TicketModal";

export function ChecklistPage() {
  const { user, rallyAccessToken } = useAuth();
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);
  const [workItemId, setWorkItemId] = useState("");
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketModalProcessing, setTicketModalProcessing] = useState(false);
  const [ticketModalError, setTicketModalError] = useState<string | null>(null);
  const hasRallyAccess = Boolean(rallyAccessToken);

  const {
    filters,
    setFilter,
    selectionMode,
    setSelectionMode,
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

  const tasks = data?.tasks ?? [];
  const metadata = data?.metadata;
  const selectedCount = selectedTaskIds.size;
  const selectedControls = useMemo(
    () => tasks.filter((task) => selectedTaskIds.has(task.id)),
    [tasks, selectedTaskIds]
  );
  const levelLabel =
    ASVS_LEVELS.find((level) => level.value === filters.level)?.label ?? filters.level;
  const applicationLabel =
    APPLICATION_TYPES.find((type) => type.value === filters.applicationType)?.label ??
    filters.applicationType.toUpperCase();

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
      selectionMode,
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
      selectionMode,
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

  const handleTicketModalSubmit = async (
    mode: "create" | "link",
    payload: CreateTicketPayload | LinkExistingPayload
  ) => {
    setTicketModalProcessing(true);
    setTicketModalError(null);

    try {
      if (mode === "create") {
        await createTicketDocument(payload as CreateTicketPayload);
      } else {
        await linkSelectedControls(payload as LinkExistingPayload);
      }
      setTicketModalOpen(false);
      clearSelection();
    } catch (modalError) {
      setTicketModalError(
        modalError instanceof Error
          ? modalError.message
          : "Unable to complete ticket action."
      );
    } finally {
      setTicketModalProcessing(false);
    }
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
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
          workItemId={workItemId}
          onWorkItemIdChange={setWorkItemId}
          selectionCount={selectedCount}
          onClearSelection={clearSelection}
          disciplineOptions={disciplineOptions}
          technologyOptions={technologyOptions}
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
            {tasks.map((task) => (
              <ControlCard
                key={task.id}
                control={task}
                selected={selectedTaskIds.has(task.id)}
                selectionMode={selectionMode}
                onSelect={() => toggleSelection(task.id)}
                onLink={() => void handleLink(task.id)}
                linking={linkingTaskId === task.id}
                hasRallyAccess={hasRallyAccess}
                workItemProvided={Boolean(workItemId)}
              />
            ))}
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

      <TicketModal
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
        selectedControls={selectedControls}
        defaultWorkItemId={workItemId}
        onCreateTicket={(payload) =>
          handleTicketModalSubmit("create", payload)
        }
        onLinkExisting={(payload) =>
          handleTicketModalSubmit("link", payload)
        }
        isProcessing={ticketModalProcessing}
        errorMessage={ticketModalError}
        hasRallyAccess={hasRallyAccess}
      />
    </AppLayout>
  );
}
