import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

import type { SpvsRequirement } from "../../lib/api";
import { cn } from "../../lib/utils";

type SpvsRequirementCardProps = {
  requirement: SpvsRequirement;
  selected: boolean;
  onSelect: () => void;
  onLink: () => void;
  linking: boolean;
  hasRallyAccess: boolean;
  workItemProvided: boolean;
};

export function SpvsRequirementCard({
  requirement,
  selected,
  onSelect,
  onLink,
  linking,
  hasRallyAccess,
  workItemProvided
}: SpvsRequirementCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      className={cn(
        "relative flex h-full cursor-pointer flex-col border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        selected
          ? "border-primary/80 bg-primary/5"
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
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase">
          <Badge variant="outline" className="font-mono">
            {requirement.id}
          </Badge>
          <Badge>{requirement.categoryId}</Badge>
          {requirement.subcategoryId && (
            <Badge variant="outline">{requirement.subcategoryId}</Badge>
          )}
          <div className="flex flex-wrap gap-1">
            {requirement.levels.map((level) => (
              <Badge key={`${requirement.id}-${level}`} variant="secondary">
                {level}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <CardTitle className="text-base md:text-lg">
            {requirement.categoryName}
            {requirement.subcategoryName
              ? ` • ${requirement.subcategoryName}`
              : ""}
          </CardTitle>
          <CardDescription>{requirement.description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="space-y-2 text-xs text-muted-foreground">
          {requirement.nistMapping && (
            <p>
              <span className="font-medium text-foreground">NIST:</span>{" "}
              {requirement.nistMapping}
            </p>
          )}
          {requirement.owaspRisk && (
            <p>
              <span className="font-medium text-foreground">
                OWASP CI/CD Risk:
              </span>{" "}
              {requirement.owaspRisk}
            </p>
          )}
          {requirement.cweMapping && (
            <p>
              <span className="font-medium text-foreground">CWE:</span>{" "}
              {requirement.cweMapping}
            </p>
          )}
          {requirement.cweDescription && (
            <p>
              <span className="font-medium text-foreground">
                CWE description:
              </span>{" "}
              {requirement.cweDescription}
            </p>
          )}
        </div>

        <div className="mt-auto flex justify-end">
          <Button
            variant="secondary"
            disabled={!hasRallyAccess || linking || !workItemProvided}
            onClick={(event) => {
              event.stopPropagation();
              onLink();
            }}
          >
            {linking
              ? "Linking…"
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
