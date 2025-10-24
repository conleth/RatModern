import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { Button } from "../ui/button";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

import { ASVS_LEVELS, APPLICATION_TYPES } from "../../lib/asvs";
import type { ChecklistFilters } from "../../hooks/useChecklist";
import type {
  DeveloperDiscipline,
  TechnologyTag,
  AsvsCategory
} from "../../lib/api";

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

type FilterBarProps = {
  filters: ChecklistFilters;
  onFilterChange: <K extends keyof ChecklistFilters>(
    key: K,
    value: ChecklistFilters[K]
  ) => void;
  workItemId: string;
  onWorkItemIdChange: (value: string) => void;
  selectionCount: number;
  onClearSelection: () => void;
  disciplineOptions: FilterOption<DeveloperDiscipline>[];
  technologyOptions: FilterOption<TechnologyTag>[];
  categoryOptions: AsvsCategory[];
};

export function FilterBar({
  filters,
  onFilterChange,
  workItemId,
  onWorkItemIdChange,
  selectionCount,
  onClearSelection,
  disciplineOptions,
  technologyOptions,
  categoryOptions
}: FilterBarProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Filter checklist</CardTitle>
        <CardDescription>
          Narrow ASVS controls by level, platform, discipline, technology, and specific ASVS categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="filter-level">ASVS level</Label>
            <Select
              value={filters.level}
              onValueChange={(value) =>
                onFilterChange("level", value as ChecklistFilters["level"])
              }
            >
              <SelectTrigger id="filter-level">
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
            <Label htmlFor="filter-application">Application type</Label>
            <Select
              value={filters.applicationType}
              onValueChange={(value) =>
                onFilterChange(
                  "applicationType",
                  value as ChecklistFilters["applicationType"]
                )
              }
            >
              <SelectTrigger id="filter-application">
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
            <Label htmlFor="filter-discipline">Discipline focus</Label>
            <Select
              value={filters.discipline}
              onValueChange={(value) =>
                onFilterChange(
                  "discipline",
                  value as ChecklistFilters["discipline"]
                )
              }
            >
              <SelectTrigger id="filter-discipline">
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
            <Label htmlFor="filter-technology">Primary technology</Label>
            <Select
              value={filters.technology}
              onValueChange={(value) =>
                onFilterChange(
                  "technology",
                  value as ChecklistFilters["technology"]
                )
              }
            >
              <SelectTrigger id="filter-technology">
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
            <Label htmlFor="filter-search">Search controls</Label>
            <Input
              id="filter-search"
              value={filters.search}
              placeholder="Fuzzy search by description, section, or shortcode"
              onChange={(event) => onFilterChange("search", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="block text-sm font-medium">ASVS categories</Label>
          <p className="text-xs text-muted-foreground">
            Select one or more categories to focus the checklist on specific control families.
          </p>
          <ToggleGroup
            type="multiple"
            value={filters.categories}
            onValueChange={(value) => onFilterChange("categories", value)}
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="filter-work-item">Rally work item ID</Label>
            <Input
              id="filter-work-item"
              value={workItemId}
              placeholder="ex: US123456"
              onChange={(event) => onWorkItemIdChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Provide a Rally formatted ID to link selected tasks.
            </p>
          </div>
          <div className="flex flex-col gap-2 justify-between md:items-end">
            <p className="text-sm text-muted-foreground">
              {selectionCount > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {selectionCount}
                  </span>{" "}
                  control{selectionCount === 1 ? "" : "s"} selected
                </>
              ) : (
                "No controls selected"
              )}
            </p>
            {selectionCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="self-end"
                onClick={onClearSelection}
              >
                Clear selection
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
