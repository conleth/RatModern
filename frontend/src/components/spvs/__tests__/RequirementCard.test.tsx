import { fireEvent, render, screen } from "@testing-library/react";

import { SpvsRequirementCard } from "../RequirementCard";

const requirement = {
  id: "V3.1.1",
  description: "Verify hosted runners are hardened.",
  categoryId: "V3",
  categoryName: "Integrate",
  subcategoryId: "V3.1",
  subcategoryName: "Security of Pipeline Environment",
  levels: ["L2", "L3"] as const,
  nistMapping: "RA-5",
  owaspRisk: "CICD-SEC-3",
  cweMapping: "CWE-693",
  cweDescription: "Protection Mechanism Failure"
};

describe("SpvsRequirementCard", () => {
  it("displays requirement metadata and reacts to selection", () => {
    const onSelect = vi.fn();
    const onLink = vi.fn();

    render(
      <SpvsRequirementCard
        requirement={requirement}
        selected={false}
        onSelect={onSelect}
        onLink={onLink}
        linking={false}
        hasRallyAccess
        workItemProvided={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /v3.1.1/i }));
    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByText(/link to rally/i)).toBeInTheDocument();
  });

  it("disables linking when OAuth is unavailable", () => {
    const onSelect = vi.fn();

    render(
      <SpvsRequirementCard
        requirement={requirement}
        selected
        onSelect={onSelect}
        onLink={vi.fn()}
        linking={false}
        hasRallyAccess={false}
        workItemProvided={false}
      />
    );

    const button = screen.getByRole("button", { name: /oauth disabled/i });
    expect(button).toBeDisabled();
  });
});
