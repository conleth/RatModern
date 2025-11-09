import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  SpvsTicketModal,
  type CreateTicketPayload,
  type LinkExistingPayload
} from "../TicketModal";

const requirements = [
  {
    id: "V3.1.1",
    description: "Verify hosted runners are hardened.",
    categoryId: "V3",
    categoryName: "Integrate",
    subcategoryId: "V3.1",
    subcategoryName: "Security of Pipeline Environment",
    levels: ["L2"],
    nistMapping: "RA-5",
    owaspRisk: "CICD-SEC-3",
    cweMapping: "CWE-693",
    cweDescription: "Protection Mechanism Failure"
  }
];

describe("SpvsTicketModal", () => {
  it("submits link payloads when provided with required data", async () => {
    const onLinkExisting = vi.fn<Promise<void>, [LinkExistingPayload]>(() =>
      Promise.resolve()
    );

    render(
      <SpvsTicketModal
        open
        onOpenChange={() => {}}
        selectedRequirements={requirements}
        defaultWorkItemId="US1234"
        onCreateTicket={vi.fn()}
        onLinkExisting={onLinkExisting}
        hasRallyAccess
        onSuccess={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/link existing/i));
    fireEvent.click(screen.getByRole("button", { name: /link requirements/i }));

    await waitFor(() => expect(onLinkExisting).toHaveBeenCalled());
  });

  it("collects ticket creation data when switched to create mode", async () => {
    const onCreateTicket = vi.fn<Promise<void>, [CreateTicketPayload]>(() =>
      Promise.resolve()
    );

    render(
      <SpvsTicketModal
        open
        onOpenChange={() => {}}
        selectedRequirements={requirements}
        onCreateTicket={onCreateTicket}
        onLinkExisting={vi.fn()}
        hasRallyAccess={false}
        onSuccess={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText(/create new/i));
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Secure hosted runners" }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Implement baseline controls" }
    });
    fireEvent.click(screen.getByRole("button", { name: /create ticket/i }));

    await waitFor(() => expect(onCreateTicket).toHaveBeenCalled());
  });
});
