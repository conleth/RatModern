import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Badge } from "../ui/badge";

import type { SpvsRequirement } from "../../lib/api";

type TicketType = "story" | "task" | "defect" | "epic";
type TicketMode = "create" | "link";

export type CreateTicketPayload = {
  ticketType: TicketType;
  title: string;
  description: string;
};

export type LinkExistingPayload = {
  ticketType: TicketType;
  workItemId: string;
  notes?: string;
};

type SpvsTicketModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequirements: SpvsRequirement[];
  defaultWorkItemId?: string;
  onCreateTicket: (payload: CreateTicketPayload) => Promise<void>;
  onLinkExisting: (payload: LinkExistingPayload) => Promise<void>;
  hasRallyAccess: boolean;
  onSuccess: () => void;
};

const TICKET_TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: "story", label: "User story" },
  { value: "task", label: "Task" },
  { value: "defect", label: "Defect" },
  { value: "epic", label: "Epic" }
];

export function SpvsTicketModal({
  open,
  onOpenChange,
  selectedRequirements,
  defaultWorkItemId,
  onCreateTicket,
  onLinkExisting,
  hasRallyAccess,
  onSuccess
}: SpvsTicketModalProps) {
  const [mode, setMode] = useState<TicketMode>("link");
  const [createTicketType, setCreateTicketType] = useState<TicketType>("story");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [linkTicketType, setLinkTicketType] = useState<TicketType>("task");
  const [linkWorkItemId, setLinkWorkItemId] = useState(defaultWorkItemId ?? "");
  const [linkNotes, setLinkNotes] = useState("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLinkWorkItemId(defaultWorkItemId ?? "");
    }
  }, [open, defaultWorkItemId]);

  const totalRequirements = selectedRequirements.length;

  const requirementSummary = useMemo(
    () =>
      selectedRequirements.slice(0, 5).map((requirement) => ({
        id: requirement.id,
        description: requirement.description,
        category: `${requirement.categoryId} ${requirement.categoryName}`.trim(),
        subcategory: requirement.subcategoryId
          ? `${requirement.subcategoryId} ${requirement.subcategoryName}`.trim()
          : null,
        levels: requirement.levels.join(", "),
        nist: requirement.nistMapping,
        owasp: requirement.owaspRisk
      })),
    [selectedRequirements]
  );

  const handleSubmit = async () => {
    setSubmissionError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        if (!createTitle.trim()) {
          throw new Error("Please provide a ticket title.");
        }
        await onCreateTicket({
          ticketType: createTicketType,
          title: createTitle.trim(),
          description: createDescription.trim()
        });
      } else {
        if (!hasRallyAccess) {
          throw new Error("Rally integration is disabled.");
        }
        if (!linkWorkItemId.trim()) {
          throw new Error("Please provide a work item ID.");
        }
        await onLinkExisting({
          ticketType: linkTicketType,
          workItemId: linkWorkItemId.trim(),
          notes: linkNotes.trim() || undefined
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Unable to complete ticket action."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setMode("link");
      setCreateTicketType("story");
      setCreateTitle("");
      setCreateDescription("");
      setLinkTicketType("task");
      setLinkWorkItemId(defaultWorkItemId ?? "");
      setLinkNotes("");
      setSubmissionError(null);
      setSubmitting(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send to ticket system</DialogTitle>
          <DialogDescription>
            {totalRequirements} SPVS requirement{totalRequirements === 1 ? "" : "s"} selected. Create a new ticket or link them to an existing work item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Summary
            </h3>
            <div className="space-y-2">
              {requirementSummary.map((requirement) => (
                <div
                  key={requirement.id}
                  className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground"
                >
                  <div className="flex flex-wrap items-center gap-2 pb-1">
                    <Badge variant="outline" className="font-mono uppercase">
                      {requirement.id}
                    </Badge>
                    <span className="font-medium text-foreground">
                      {requirement.category}
                    </span>
                    {requirement.subcategory && (
                      <Badge variant="outline">{requirement.subcategory}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{requirement.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">Levels: {requirement.levels}</Badge>
                    {requirement.nist && (
                      <Badge variant="outline">NIST: {requirement.nist}</Badge>
                    )}
                    {requirement.owasp && (
                      <Badge variant="outline">OWASP: {requirement.owasp}</Badge>
                    )}
                  </div>
                </div>
              ))}
              {totalRequirements > requirementSummary.length && (
                <p className="text-xs text-muted-foreground">
                  …plus {totalRequirements - requirementSummary.length} more requirement
                  {totalRequirements - requirementSummary.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">
                Ticket action
              </Label>
              <RadioGroup
                className="flex gap-4"
                value={mode}
                onValueChange={(value) => setMode(value as TicketMode)}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="spvs-link" value="link" />
                  <Label htmlFor="spvs-link">Link existing</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="spvs-create" value="create" />
                  <Label htmlFor="spvs-create">Create new</Label>
                </div>
              </RadioGroup>
            </div>

            {mode === "create" ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="spvs-create-type">Ticket type</Label>
                    <RadioGroup
                      id="spvs-create-type"
                      className="grid gap-2 md:grid-cols-2"
                      value={createTicketType}
                      onValueChange={(value) => setCreateTicketType(value as TicketType)}
                    >
                      {TICKET_TYPE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center gap-2 rounded-md border p-2">
                          <RadioGroupItem id={`create-${option.value}`} value={option.value} />
                          <Label htmlFor={`create-${option.value}`} className="flex-1 cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spvs-create-title">Title</Label>
                    <Input
                      id="spvs-create-title"
                      value={createTitle}
                      placeholder="Summarise the SPVS effort"
                      onChange={(event) => setCreateTitle(event.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spvs-create-description">Description</Label>
                  <Textarea
                    id="spvs-create-description"
                    value={createDescription}
                    placeholder="Describe the required pipeline hardening, attestation, or monitoring activities."
                    rows={4}
                    onChange={(event) => setCreateDescription(event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="spvs-link-type">Ticket type</Label>
                    <RadioGroup
                      id="spvs-link-type"
                      className="grid gap-2 md:grid-cols-2"
                      value={linkTicketType}
                      onValueChange={(value) => setLinkTicketType(value as TicketType)}
                    >
                      {TICKET_TYPE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center gap-2 rounded-md border p-2">
                          <RadioGroupItem id={`link-${option.value}`} value={option.value} />
                          <Label htmlFor={`link-${option.value}`} className="flex-1 cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spvs-link-work-item">Work item ID</Label>
                    <Input
                      id="spvs-link-work-item"
                      value={linkWorkItemId}
                      placeholder="ex: US123456"
                      onChange={(event) => setLinkWorkItemId(event.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spvs-link-notes">Notes (optional)</Label>
                  <Textarea
                    id="spvs-link-notes"
                    value={linkNotes}
                    rows={3}
                    placeholder="Share context about release stage, dependencies, or timing."
                    onChange={(event) => setLinkNotes(event.target.value)}
                  />
                </div>
              </div>
            )}
          </section>

          {submissionError && (
            <p className="text-sm text-destructive">{submissionError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : mode === "create" ? "Create ticket" : "Link requirements"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
