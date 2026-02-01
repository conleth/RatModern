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

import type { ChecklistControl } from "../../lib/api";
import { getDisciplineLabel, getTechnologyLabel } from "../../lib/developerOptions";
import { ROLE_LABELS } from "../../lib/roles";

type TicketModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedControls: ChecklistControl[];
  defaultWorkItemId?: string;
  onCreateTicket: (payload: CreateTicketPayload) => Promise<{ id: string; url: string; status: string } | void>;
  onLinkExisting: (payload: LinkExistingPayload) => Promise<void>;
  hasRallyAccess: boolean;
  onSuccess: (ticketUrl?: string) => void;
};

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

type TicketType = "story" | "task" | "defect" | "epic";

type TicketMode = "create" | "link";

const TICKET_TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: "story", label: "User story" },
  { value: "task", label: "Task" },
  { value: "defect", label: "Defect" },
  { value: "epic", label: "Epic" }
];

export function TicketModal({
  open,
  onOpenChange,
  selectedControls,
  defaultWorkItemId,
  onCreateTicket,
  onLinkExisting,
  hasRallyAccess,
  onSuccess
}: TicketModalProps) {
  const [mode, setMode] = useState<TicketMode>("link");
  const [createTicketType, setCreateTicketType] = useState<TicketType>("story");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [linkTicketType, setLinkTicketType] = useState<TicketType>("task");
  const [linkWorkItemId, setLinkWorkItemId] = useState(defaultWorkItemId ?? "");
  const [linkNotes, setLinkNotes] = useState("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const WORKITEM_STORAGE_KEY = "rally-workitem-id";

  useEffect(() => {
    if (open) {
      // Prefer defaultWorkItemId prop, then fall back to localStorage
      const workItemId = defaultWorkItemId ?? localStorage.getItem(WORKITEM_STORAGE_KEY) ?? "";
      setLinkWorkItemId(workItemId);
    }
  }, [open, defaultWorkItemId]);

  // Save workItemId to localStorage when it changes
  const handleWorkItemIdChange = (value: string) => {
    setLinkWorkItemId(value);
    if (value.trim()) {
      localStorage.setItem(WORKITEM_STORAGE_KEY, value);
    }
  };

  const totalControls = selectedControls.length;

  const controlSummary = useMemo(
    () =>
      selectedControls.slice(0, 5).map((control) => ({
        id: control.id,
        shortcode: control.shortcode,
        description: control.description,
        category: control.category,
        roles: control.recommendedRoles.map((role) => ROLE_LABELS[role] ?? role),
        disciplines: control.disciplines.map(getDisciplineLabel),
        technologies: control.technologies.map(getTechnologyLabel)
      })),
    [selectedControls]
  );

  const handleSubmit = async () => {
    setSubmissionError(null);
    setSubmitting(true);
    try {
      if (mode === "create") {
        if (!createTitle.trim()) {
          throw new Error("Please provide a ticket title.");
        }
        const result = await onCreateTicket({
          ticketType: createTicketType,
          title: createTitle.trim(),
          description: createDescription.trim()
        });
        onSuccess(result?.url);
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
        onSuccess();
      }
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
      <DialogContent className="p-0 flex flex-col">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Send to ticket system</DialogTitle>
            <DialogDescription>
              {totalControls} ASVS control{totalControls === 1 ? "" : "s"} selected. Create a
              new ticket or link to an existing work item.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 px-4">
          <div className="space-y-6 pb-4">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Summary
            </h3>
            <div className="space-y-2">
              {controlSummary.map((control) => (
                <div
                  key={control.id}
                  className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground"
                >
                  <div className="flex flex-wrap items-center gap-2 pb-1">
                    <Badge variant="outline" className="font-mono uppercase">
                      {control.shortcode}
                    </Badge>
                    <span className="font-medium text-foreground">{control.category}</span>
                  </div>
                  <p className="text-muted-foreground">{control.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Roles: {control.roles.join(", ")}
                    </Badge>
                    <Badge variant="outline">
                      Disciplines: {control.disciplines.join(", ")}
                    </Badge>
                    <Badge variant="outline">
                      Tech: {control.technologies.join(", ")}
                    </Badge>
                  </div>
                </div>
              ))}
              {totalControls > controlSummary.length && (
                <p className="text-xs text-muted-foreground">
                  …plus {totalControls - controlSummary.length} more controls
                </p>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Action
            </h3>
            <RadioGroup
              value={mode}
              onValueChange={(value: string) => setMode(value as TicketMode)}
              className="grid gap-2 sm:grid-cols-2"
            >
              <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm hover:border-primary">
                <RadioGroupItem value="create" />
                <span>Create new ticket</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm hover:border-primary">
                <RadioGroupItem value="link" />
                <span>Link to existing work item</span>
              </label>
            </RadioGroup>
          </section>

          {mode === "create" ? (
            <section className="space-y-4">
              <div className="space-y-2">
                <Label>Ticket type</Label>
                <RadioGroup
                  value={createTicketType}
                  onValueChange={(value: string) =>
                    setCreateTicketType(value as TicketType)
                  }
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {TICKET_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm hover:border-primary"
                    >
                      <RadioGroupItem value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket-title">Title</Label>
                <Input
                  id="ticket-title"
                  placeholder="Short summary for the ticket"
                  value={createTitle}
                  onChange={(event) => setCreateTitle(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticket-description">Description / acceptance criteria</Label>
                <Textarea
                  id="ticket-description"
                  placeholder="Add context, acceptance criteria, or implementation notes."
                  value={createDescription}
                  onChange={(event) => setCreateDescription(event.target.value)}
                />
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="space-y-2">
                <Label>Ticket type</Label>
                <RadioGroup
                  value={linkTicketType}
                  onValueChange={(value: string) =>
                    setLinkTicketType(value as TicketType)
                  }
                  className="grid gap-2 sm:grid-cols-2"
                >
                  {TICKET_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm hover:border-primary"
                    >
                      <RadioGroupItem value={option.value} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-item-id">Work item ID</Label>
                <Input
                  id="work-item-id"
                  placeholder="e.g. US123456"
                  value={linkWorkItemId}
                  onChange={(event) => handleWorkItemIdChange(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-notes">Notes</Label>
                <Textarea
                  id="link-notes"
                  placeholder="Optional context that will be attached to each linked control."
                  value={linkNotes}
                  onChange={(event) => setLinkNotes(event.target.value)}
                />
              </div>

              {!hasRallyAccess && (
                <p className="text-xs font-medium text-muted-foreground">
                  Rally integration is currently disabled; enable OAuth to link work items.
                </p>
              )}
            </section>
          )}

            {submissionError && (
              <p className="text-sm font-medium text-destructive">
              {submissionError}
              </p>
            )}
          </div>
        </div>

        <div className="border-t p-4">
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Processing..." : "Send"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
