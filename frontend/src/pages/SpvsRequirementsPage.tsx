import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AppLayout } from "../components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";

import {
  fetchSpvsRequirements,
  fetchSpvsTaxonomy,
  linkTaskToRally,
  createRallyTicket,
  type SpvsLevel,
  type SpvsRequirementsResponse
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { SpvsFilterBar } from "../components/spvs/FilterBar";
import { SpvsRequirementCard } from "../components/spvs/RequirementCard";
import {
  SpvsTicketModal,
  type CreateTicketPayload,
  type LinkExistingPayload
} from "../components/spvs/TicketModal";

type RequirementsLocationState = {
  recommendedFilters?: {
    levels?: SpvsLevel[];
    categories?: string[];
  };
};

type SpvsFilters = {
  search: string;
  levels: SpvsLevel[];
  categories: string[];
};

const DEFAULT_FILTERS: SpvsFilters = {
  search: "",
  levels: [],
  categories: []
};

export function SpvsRequirementsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const recommendationState =
    (location.state as RequirementsLocationState | null) ?? null;

  const { user, rallyAccessToken } = useAuth();
  const hasRallyAccess = Boolean(rallyAccessToken);

  const [filters, setFilters] = useState<SpvsFilters>(DEFAULT_FILTERS);
  const [workItemId, setWorkItemId] = useState("");
  const [selectedRequirementIds, setSelectedRequirementIds] = useState<
    Set<string>
  >(new Set());
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [linkingRequirementId, setLinkingRequirementId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (recommendationState?.recommendedFilters) {
      const { levels: recommendedLevels, categories: recommendedCategories } =
        recommendationState.recommendedFilters;

      setFilters({
        search: "",
        levels: recommendedLevels
          ? Array.from(new Set(recommendedLevels))
          : [],
        categories: recommendedCategories
          ? Array.from(
              new Set(
                recommendedCategories.map((category) =>
                  category.toUpperCase()
                )
              )
            )
          : []
      });

      navigate("/spvs/requirements", { replace: true, state: null });
    }
  }, [recommendationState, navigate]);

  const taxonomyQuery = useQuery({
    queryKey: ["spvs", "taxonomy"],
    queryFn: fetchSpvsTaxonomy
  });

  const requirementQuery = useQuery({
    queryKey: ["spvs", "requirements", filters],
    queryFn: () =>
      fetchSpvsRequirements({
        search: filters.search.trim() || undefined,
        levels: filters.levels.length ? filters.levels : undefined,
        categories: filters.categories.length ? filters.categories : undefined
      })
  });

  const taxonomy = taxonomyQuery.data;
  const requirements =
    (requirementQuery.data as SpvsRequirementsResponse | undefined) ?? undefined;
  const requirementList = requirements?.requirements ?? [];

  const categoryOptions = taxonomy?.categories ?? [];

  const selectedRequirements = useMemo(
    () =>
      requirementList.filter((requirement) =>
        selectedRequirementIds.has(requirement.id)
      ),
    [requirementList, selectedRequirementIds]
  );

  const selectedCount = selectedRequirementIds.size;

  const updateFilters = <K extends keyof SpvsFilters>(
    key: K,
    value: SpvsFilters[K]
  ) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value
    }));
  };

  const toggleSelection = (id: string) => {
    setSelectedRequirementIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const setSelection = (ids: string[]) => {
    setSelectedRequirementIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedRequirementIds(new Set());
  };

  const selectAllShown = () => {
    setSelection(requirementList.map((requirement) => requirement.id));
  };

  const addShownToSelection = () => {
    setSelectedRequirementIds((previous) => {
      const next = new Set(previous);
      requirementList.forEach((requirement) => next.add(requirement.id));
      return next;
    });
  };

  const deselectShown = () => {
    setSelectedRequirementIds((previous) => {
      const next = new Set(previous);
      requirementList.forEach((requirement) => next.delete(requirement.id));
      return next;
    });
  };

  const handleExportCsv = () => {
    if (!requirementList.length) {
      return;
    }

    const header = [
      "Requirement ID",
      "Category",
      "Sub-Category",
      "Levels",
      "Description",
      "NIST Mapping",
      "OWASP CI/CD Risk",
      "CWE Mapping",
      "CWE Description"
    ];

    const csvLines = [header];

    requirementList.forEach((requirement) => {
      csvLines.push([
        requirement.id,
        `${requirement.categoryId} ${requirement.categoryName}`.trim(),
        `${requirement.subcategoryId} ${requirement.subcategoryName}`.trim(),
        requirement.levels.join("; "),
        requirement.description,
        requirement.nistMapping,
        requirement.owaspRisk,
        requirement.cweMapping,
        requirement.cweDescription
      ]);
    });

    const csvContent = csvLines
      .map((line) =>
        line
          .map((value) => {
            const sanitized = value ?? "";
            if (
              sanitized.includes(",") ||
              sanitized.includes('"') ||
              sanitized.includes("\n")
            ) {
              return `"${sanitized.replace(/"/g, '""')}"`;
            }
            return sanitized;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "spvs-requirements.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSelectedJson = () => {
    if (!selectedRequirements.length) {
      return;
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      filters,
      requirements: selectedRequirements.map((requirement) => ({
        id: requirement.id,
        description: requirement.description,
        categoryId: requirement.categoryId,
        categoryName: requirement.categoryName,
        subcategoryId: requirement.subcategoryId,
        subcategoryName: requirement.subcategoryName,
        levels: requirement.levels,
        nistMapping: requirement.nistMapping,
        owaspRisk: requirement.owaspRisk,
        cweMapping: requirement.cweMapping,
        cweDescription: requirement.cweDescription
      }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `spvs-requirements-${Date.now()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleLinkRequirement = async (requirementId: string) => {
    if (!workItemId || !hasRallyAccess || !rallyAccessToken) {
      return;
    }

    try {
      setLinkingRequirementId(requirementId);
      await linkTaskToRally({
        taskId: requirementId,
        workItemId,
        accessToken: rallyAccessToken,
        metadata: {
          standard: "SPVS"
        }
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setLinkingRequirementId(null);
    }
  };

  const createTicketDocument = async ({
    ticketType,
    title,
    description
  }: CreateTicketPayload) => {
    if (!selectedRequirements.length) {
      throw new Error("Please select at least one requirement.");
    }

    if (!hasRallyAccess || !rallyAccessToken) {
      throw new Error("Rally integration is disabled.");
    }

    // Create the ticket with related requirement IDs
    const result = await createRallyTicket({
      ticketType,
      title,
      description,
      relatedItems: selectedRequirements.map((r) => r.id),
      accessToken: rallyAccessToken,
      metadata: {
        standard: "SPVS",
        levels: filters.levels,
        requirementCount: selectedRequirements.length
      }
    });

    return result;
  };

  const linkSelectedRequirements = async ({
    ticketType,
    workItemId: targetWorkItemId,
    notes
  }: LinkExistingPayload) => {
    if (!hasRallyAccess || !rallyAccessToken) {
      throw new Error("Rally integration is disabled.");
    }

    if (!selectedRequirements.length) {
      throw new Error("Please select at least one requirement to link.");
    }

    await Promise.all(
      selectedRequirements.map((requirement) =>
        linkTaskToRally({
          taskId: requirement.id,
          workItemId: targetWorkItemId,
          accessToken: rallyAccessToken,
          metadata: {
            ticketType,
            notes,
            levels: requirement.levels
          }
        })
      )
    );
  };

  if (!user) return null;

  return (
    <AppLayout
      title="SPVS requirements"
      subtitle="Explore Secure Pipeline Verification Standard controls, tailor filters, and export the result."
      actions={
        <Button variant="secondary" onClick={() => setFilters({ ...DEFAULT_FILTERS })}>
          Reset all filters
        </Button>
      }
    >
      <div className="space-y-6">
        <SpvsFilterBar
          search={filters.search}
          onSearchChange={(value) => updateFilters("search", value)}
          levels={filters.levels}
          onLevelsChange={(value) => updateFilters("levels", value)}
          categories={filters.categories}
          onCategoriesChange={(value) => updateFilters("categories", value)}
          categoryOptions={categoryOptions}
          workItemId={workItemId}
          onWorkItemIdChange={setWorkItemId}
          selectionCount={selectedCount}
          onClearSelection={clearSelection}
        />

        {selectedCount > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedCount} requirement{selectedCount === 1 ? "" : "s"} selected
                </CardTitle>
                <CardDescription>
                  Export or send these SPVS controls to Rally to plan remediation and hardening work.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={selectAllShown}>
                  Select all shown
                </Button>
                <Button variant="outline" onClick={addShownToSelection}>
                  Add shown
                </Button>
                <Button variant="outline" onClick={deselectShown}>
                  Deselect shown
                </Button>
                <Button onClick={() => setTicketModalOpen(true)}>
                  Send to ticket system
                </Button>
                <Button variant="outline" onClick={handleDownloadSelectedJson}>
                  Download JSON
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {requirements?.metadata && (
          <Card>
            <CardHeader>
              <CardTitle>
                {requirements.metadata.shortName} v{requirements.metadata.version}
              </CardTitle>
              <CardDescription>
                Showing {requirements.metadata.resultCount} of{" "}
                {requirements.metadata.totalRequirements} requirements
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {requirementQuery.isLoading
                  ? "Loading SPVS requirements…"
                  : `${requirements?.metadata?.resultCount ?? 0} matches found`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExportCsv} disabled={!requirementList.length}>
                Export CSV
              </Button>
            </div>
          </CardHeader>
        </Card>

        {requirementQuery.isLoading ? (
          <Card>
            <CardContent className="py-10 text-sm text-muted-foreground">
              Fetching SPVS requirements…
            </CardContent>
          </Card>
        ) : requirementQuery.isError ? (
          <Card>
            <CardContent className="py-10 text-sm text-destructive">
              Unable to load SPVS requirements. Please adjust filters or try again shortly.
            </CardContent>
          </Card>
        ) : requirementList.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {requirementList.map((requirement) => (
              <SpvsRequirementCard
                key={requirement.id}
                requirement={requirement}
                selected={selectedRequirementIds.has(requirement.id)}
                onSelect={() => toggleSelection(requirement.id)}
                onLink={() => void handleLinkRequirement(requirement.id)}
                linking={linkingRequirementId === requirement.id}
                hasRallyAccess={hasRallyAccess}
                workItemProvided={Boolean(workItemId)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No requirements match the selected filters.
            </CardContent>
          </Card>
        )}
      </div>

      <SpvsTicketModal
        open={ticketModalOpen}
        onOpenChange={setTicketModalOpen}
        selectedRequirements={selectedRequirements}
        defaultWorkItemId={workItemId}
        onCreateTicket={createTicketDocument}
        onLinkExisting={linkSelectedRequirements}
        hasRallyAccess={hasRallyAccess}
        onSuccess={clearSelection}
      />
    </AppLayout>
  );
}
