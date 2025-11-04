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
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { Separator } from "../components/ui/separator";

import {
  fetchSpvsRequirements,
  fetchSpvsTaxonomy,
  type SpvsLevel,
  type SpvsRequirementsResponse
} from "../lib/api";

type RequirementsLocationState = {
  recommendedFilters?: {
    levels?: SpvsLevel[];
    categories?: string[];
    subcategories?: string[];
  };
};

const LEVEL_OPTIONS: { value: SpvsLevel; label: string }[] = [
  { value: "L1", label: "L1 – Foundational" },
  { value: "L2", label: "L2 – Standard" },
  { value: "L3", label: "L3 – Advanced" }
];

export function SpvsRequirementsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const recommendationState = (location.state as RequirementsLocationState | null) ?? null;

  const [search, setSearch] = useState("");
  const [levels, setLevels] = useState<SpvsLevel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);

  useEffect(() => {
    if (recommendationState?.recommendedFilters) {
      const { levels: recommendedLevels, categories: recommendedCategories, subcategories: recommendedSubcategories } =
        recommendationState.recommendedFilters;
      if (recommendedLevels) {
        setLevels(Array.from(new Set(recommendedLevels)));
      }
      if (recommendedCategories) {
        setCategories(Array.from(new Set(recommendedCategories.map((category) => category.toUpperCase()))));
      }
      if (recommendedSubcategories) {
        setSubcategories(
          Array.from(new Set(recommendedSubcategories.map((subcategory) => subcategory.toUpperCase())))
        );
      }
      navigate("/spvs/requirements", { replace: true, state: null });
    }
  }, [recommendationState, navigate]);

  const taxonomyQuery = useQuery({
    queryKey: ["spvs", "taxonomy"],
    queryFn: fetchSpvsTaxonomy
  });

  const requirementQuery = useQuery({
    queryKey: ["spvs", "requirements", { search, levels, categories, subcategories }],
    queryFn: () =>
      fetchSpvsRequirements({
        search: search.trim() ? search.trim() : undefined,
        levels: levels.length ? levels : undefined,
        categories: categories.length ? categories : undefined,
        subcategories: subcategories.length ? subcategories : undefined
      })
  });

  const taxonomy = taxonomyQuery.data;
  const requirements = requirementQuery.data as SpvsRequirementsResponse | undefined;

  const categoryOptions = taxonomy?.categories ?? [];
  const subcategoryOptions = taxonomy?.subcategories ?? [];

  const levelValue = useMemo(() => levels.map((level) => level.toUpperCase()), [levels]);
  const categoryValue = useMemo(
    () => categories.map((category) => category.toUpperCase()),
    [categories]
  );
  const subcategoryValue = useMemo(
    () => subcategories.map((subcategory) => subcategory.toUpperCase()),
    [subcategories]
  );

  const handleReset = () => {
    setSearch("");
    setLevels([]);
    setCategories([]);
    setSubcategories([]);
  };

  const handleExport = () => {
    const rows = requirements?.requirements ?? [];
    if (!rows.length) {
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

    rows.forEach((requirement) => {
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
            if (sanitized.includes(",") || sanitized.includes("\"") || sanitized.includes("\n")) {
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

  return (
    <AppLayout
      title="SPVS requirements"
      subtitle="Explore Secure Pipeline Verification Standard controls, tailor filters, and export the result."
      actions={
        <Button variant="secondary" onClick={handleReset}>
          Clear filters
        </Button>
      }
    >
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Combine search, level, and taxonomy filters to focus on the requirements that match your pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="spvs-search">
                  Keyword search
                </label>
                <Input
                  id="spvs-search"
                  placeholder="Search requirement IDs, text, or mappings…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Levels</label>
                <ToggleGroup
                  type="multiple"
                  value={levelValue}
                  onValueChange={(values) =>
                    setLevels(values.map((value) => value as SpvsLevel))
                  }
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
                        <span className="text-[11px] text-muted-foreground">{level.label}</span>
                      </div>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categories</label>
              <ToggleGroup
                type="multiple"
                value={categoryValue}
                onValueChange={(values) => setCategories(values)}
                className="flex flex-wrap gap-2"
              >
                {categoryOptions.map((category) => (
                  <ToggleGroupItem
                    key={category.id}
                    value={category.id}
                    className="flex-1 basis-[calc(33%-0.5rem)] text-xs sm:basis-[calc(20%-0.5rem)]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-sm">{category.id}</span>
                      <span className="text-[11px] text-muted-foreground text-center">{category.name}</span>
                    </div>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sub-categories</label>
              <ToggleGroup
                type="multiple"
                value={subcategoryValue}
                onValueChange={(values) => setSubcategories(values)}
                className="flex flex-wrap gap-2"
              >
                {subcategoryOptions.map((subcategory) => (
                  <ToggleGroupItem
                    key={subcategory.id}
                    value={subcategory.id}
                    className="basis-full sm:basis-[calc(33%-0.5rem)] text-xs"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-mono text-sm">{subcategory.id}</span>
                      <span className="text-[11px] text-muted-foreground text-center">
                        {subcategory.name}
                      </span>
                    </div>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {requirementQuery.isLoading
                  ? "Loading SPVS requirements…"
                  : `${requirements?.metadata?.resultCount ?? 0} of ${
                      requirements?.metadata?.totalRequirements ??
                      taxonomy?.metadata?.totalRequirements ??
                      0
                    } requirements`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExport} disabled={!requirements?.requirements?.length}>
                Export CSV
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
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
          ) : requirements?.requirements.length ? (
            requirements.requirements.map((requirement) => (
              <Card key={requirement.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary" className="font-mono">
                      {requirement.id}
                    </Badge>
                    <Badge>{requirement.categoryId}</Badge>
                    {requirement.subcategoryId ? (
                      <Badge variant="outline">{requirement.subcategoryId}</Badge>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      {requirement.levels.map((level) => (
                        <Badge key={level} variant="outline">
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-base font-medium">
                    {requirement.categoryName} • {requirement.subcategoryName}
                  </CardTitle>
                  <CardDescription className="text-sm text-foreground">
                    {requirement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {requirement.nistMapping && (
                    <p>
                      <span className="font-medium text-foreground">NIST:</span> {requirement.nistMapping}
                    </p>
                  )}
                  {requirement.owaspRisk && (
                    <p>
                      <span className="font-medium text-foreground">OWASP CI/CD Risk:</span>{" "}
                      {requirement.owaspRisk}
                    </p>
                  )}
                  {(requirement.cweMapping || requirement.cweDescription) && (
                    <>
                      <Separator />
                      <p>
                        <span className="font-medium text-foreground">CWE mapping:</span>{" "}
                        {requirement.cweMapping || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">CWE description:</span>{" "}
                        {requirement.cweDescription || "—"}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No requirements match the selected filters.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
