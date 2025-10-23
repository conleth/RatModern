import { useState } from "react";
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

import {
  APPLICATION_TYPES,
  ASVS_LEVELS,
  AsvsLevel,
  ApplicationType
} from "../lib/asvs";
import { useAuth } from "../lib/auth";
import { linkTaskToRally, requestChecklist } from "../lib/api";
import { ROLE_LABELS } from "../lib/roles";

type ChecklistFilters = {
  level: AsvsLevel;
  applicationType: ApplicationType;
};

export function ChecklistPage() {
  const { user, rallyAccessToken } = useAuth();
  const [filters, setFilters] = useState<ChecklistFilters>({
    level: "L2",
    applicationType: "web"
  });
  const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);
  const [workItemId, setWorkItemId] = useState("");
  const hasRallyAccess = Boolean(rallyAccessToken);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["checklist", user?.role, filters.level, filters.applicationType],
    queryFn: ({ signal }) =>
      requestChecklist(
        {
          level: filters.level,
          applicationType: filters.applicationType,
          role: user!.role
        },
        signal
      ),
    enabled: Boolean(user),
    staleTime: 5 * 60 * 1000
  });

  const tasks = data?.tasks ?? [];
  const metadata = data?.metadata;

  if (!user) return null;

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
          role: user.role
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
      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Choose the ASVS profile context for your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <div className="space-y-4">
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
          {tasks.map((task) => (
            <Card key={task.id} id={task.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono uppercase">
                    {task.shortcode}
                  </Badge>
                  <Badge variant="outline">{task.level}</Badge>
                  <Badge>{task.categoryShortcode}</Badge>
                </div>
                <CardTitle className="pt-2 text-base md:text-lg">
                  {task.section}
                </CardTitle>
                <CardDescription>{task.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 text-xs text-muted-foreground">
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
                    Application focus:{" "}
                    <span className="font-medium text-foreground uppercase">
                      {task.applicationTypes.join(", ")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  disabled={
                    !workItemId || linkingTaskId === task.id || !hasRallyAccess
                  }
                  onClick={() => handleLink(task.id)}
                >
                  {linkingTaskId === task.id
                    ? "Linking..."
                    : hasRallyAccess
                    ? "Link to Rally"
                    : "OAuth disabled"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {tasks.length === 0 && !(isLoading || isFetching) && !isError && (
            <Card>
              <CardHeader>
                <CardTitle>No tasks available yet</CardTitle>
                <CardDescription>
                  Adjust filters or ensure your role has associated ASVS controls.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
