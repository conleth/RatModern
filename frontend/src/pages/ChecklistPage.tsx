import { useMemo, useState } from "react";

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
  ApplicationType,
  buildAsvsTasks
} from "../lib/asvs";
import { useAuth } from "../lib/auth";
import { linkTaskToRally } from "../lib/api";

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

  const tasks = useMemo(() => {
    if (!user) {
      return [];
    }
    return buildAsvsTasks(filters.level, filters.applicationType, user.role);
  }, [filters, user]);

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
        accessToken: rallyAccessToken
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
          {tasks.map((task) => (
            <Card key={task.id} id={task.id}>
              <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle>{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                  <Badge>{task.category}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-xs text-muted-foreground">
                  Suggested Rally type:{" "}
                  <span className="font-medium uppercase">
                    {task.rallyMapping?.suggestedWorkItemType}
                  </span>
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
          {tasks.length === 0 && (
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
