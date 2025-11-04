import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Button } from "../ui/button";

import type { SpvsCategory, SpvsLevel } from "../../lib/api";

const LEVEL_OPTIONS: { value: SpvsLevel; label: string }[] = [
  { value: "L1", label: "L1 – Foundational" },
  { value: "L2", label: "L2 – Standard" },
  { value: "L3", label: "L3 – Advanced" }
];

type SpvsFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  levels: SpvsLevel[];
  onLevelsChange: (levels: SpvsLevel[]) => void;
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  categoryOptions: SpvsCategory[];
  workItemId: string;
  onWorkItemIdChange: (value: string) => void;
  selectionCount: number;
  onClearSelection: () => void;
};

export function SpvsFilterBar({
  search,
  onSearchChange,
  levels,
  onLevelsChange,
  categories,
  onCategoriesChange,
  categoryOptions,
  workItemId,
  onWorkItemIdChange,
  selectionCount,
  onClearSelection
}: SpvsFilterBarProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Filter SPVS requirements</CardTitle>
        <CardDescription>
          Search Secure Pipeline Verification Standard controls and focus on specific levels or categories before exporting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="spvs-search">Search requirements</Label>
            <Input
              id="spvs-search"
              value={search}
              placeholder="Search by ID, description, NIST mapping…"
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2 xl:col-span-3">
            <Label className="block text-sm font-medium">Levels</Label>
            <p className="text-xs text-muted-foreground">
              Highlight requirements that apply to specific SPVS maturity levels.
            </p>
            <ToggleGroup
              type="multiple"
              value={levels}
              onValueChange={(values) => onLevelsChange(values as SpvsLevel[])}
              className="flex flex-wrap gap-2"
            >
              {LEVEL_OPTIONS.map((level) => (
                <ToggleGroupItem
                  key={level.value}
                  value={level.value}
                  className="flex-1 basis-[calc(33%-0.5rem)] text-xs sm:basis-[calc(20%-0.5rem)]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-semibold">{level.value}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {level.label}
                    </span>
                  </div>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="block text-sm font-medium">Categories</Label>
          <p className="text-xs text-muted-foreground">
            Focus on particular pipeline stages or capability areas.
          </p>
          <ToggleGroup
            type="multiple"
            value={categories}
            onValueChange={(values) => onCategoriesChange(values)}
            className="flex flex-wrap gap-2"
          >
            {categoryOptions.map((category) => (
              <ToggleGroupItem
                key={category.id}
                value={category.id}
                className="flex-1 basis-[calc(33%-0.5rem)] text-xs sm:basis-[calc(20%-0.5rem)]"
                title={category.name}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-sm">{category.id}</span>
                  <span className="text-[10px] font-medium text-muted-foreground sm:text-[11px] text-center">
                    {category.name}
                  </span>
                </div>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="spvs-work-item">Rally work item ID</Label>
            <Input
              id="spvs-work-item"
              value={workItemId}
              placeholder="ex: US123456"
              onChange={(event) => onWorkItemIdChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Provide a Rally-formatted ID to link selected requirements directly.
            </p>
          </div>
          <div className="flex flex-col justify-between gap-2 md:items-end">
            <p className="text-sm text-muted-foreground">
              {selectionCount > 0 ? (
                <>
                  <span className="font-medium text-foreground">{selectionCount}</span>{" "}
                  requirement{selectionCount === 1 ? "" : "s"} selected
                </>
              ) : (
                "No requirements selected"
              )}
            </p>
            {selectionCount > 0 && (
              <Button variant="ghost" size="sm" className="self-end" onClick={onClearSelection}>
                Clear selection
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
