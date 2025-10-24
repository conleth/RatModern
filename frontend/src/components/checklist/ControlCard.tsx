import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

import type { ChecklistControl, DeveloperDiscipline } from "../../lib/api";
import { ROLE_LABELS } from "../../lib/roles";
import {
  getDisciplineLabel,
  getTechnologyLabel
} from "../../lib/developerOptions";
import { cn } from "../../lib/utils";

type ControlCardProps = {
  control: ChecklistControl;
  selected: boolean;
  onSelect: () => void;
  onLink: () => void;
  linking: boolean;
  hasRallyAccess: boolean;
  workItemProvided: boolean;
  activeDiscipline: DeveloperDiscipline | null;
};

export function ControlCard({
  control,
  selected,
  onSelect,
  onLink,
  linking,
  hasRallyAccess,
  workItemProvided,
  activeDiscipline
}: ControlCardProps) {
  const matchesActiveDiscipline = Boolean(
    activeDiscipline && control.disciplines.includes(activeDiscipline)
  );

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      className={cn(
        "relative flex h-full cursor-pointer flex-col border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        selected
          ? "border-primary/80 bg-primary/5"
          : matchesActiveDiscipline
          ? "border-primary/40 bg-primary/5/60 hover:border-primary/50"
          : "border-border hover:border-primary/40"
      )}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {selected && (
        <div className="absolute right-3 top-3">
          <Badge variant="default">Selected</Badge>
        </div>
      )}

      <CardHeader className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs uppercase">
          <Badge variant="outline" className="font-mono">
            {control.shortcode}
          </Badge>
          <Badge variant="outline">{control.level}</Badge>
          <Badge>{control.categoryShortcode}</Badge>
        </div>
        <div>
          <CardTitle className="text-base md:text-lg">{control.section}</CardTitle>
          <CardDescription>{control.description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="space-y-2 text-xs text-muted-foreground">
          <div>
            Category:{" "}
            <span className="font-medium text-foreground">
              {control.category}
            </span>
          </div>
          <div>
            Recommended roles:{" "}
            <span className="font-medium text-foreground">
              {control.recommendedRoles
                .map((role) => ROLE_LABELS[role] ?? role)
                .join(", ")}
            </span>
          </div>
          <div>
            Disciplines:{" "}
            <div className="mt-1 flex flex-wrap gap-2">
              {control.disciplines.map((discipline) => {
                const isActive = discipline === activeDiscipline;
                return (
                  <Badge
                    key={`${control.id}-${discipline}`}
                    variant={isActive ? "default" : "outline"}
                  >
                    {getDisciplineLabel(discipline)}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div>
            Technologies:{" "}
            <span className="font-medium text-foreground">
              {control.technologies
                .map((technology) => getTechnologyLabel(technology))
                .join(", ")}
            </span>
          </div>
          <div>
            Application focus:{" "}
            <span className="font-medium text-foreground uppercase">
              {control.applicationTypes.join(", ")}
            </span>
          </div>
        </div>

        <div className="mt-auto flex justify-end">
          <Button
            variant="secondary"
            disabled={
              !hasRallyAccess || linking || !workItemProvided
            }
            onClick={(event) => {
              event.stopPropagation();
              onLink();
            }}
          >
            {linking
              ? "Linking..."
              : hasRallyAccess
              ? workItemProvided
                ? "Link to Rally"
                : "Set work item"
              : "OAuth disabled"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
