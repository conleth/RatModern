import { fireEvent, render, screen } from "@testing-library/react";

import { SpvsFilterBar } from "../FilterBar";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("SpvsFilterBar", () => {
  const defaultProps = {
    search: "",
    onSearchChange: vi.fn(),
    levels: [],
    onLevelsChange: vi.fn(),
    categories: [],
    onCategoriesChange: vi.fn(),
    categoryOptions: [
      { id: "V1", name: "Plan" },
      { id: "V2", name: "Develop" }
    ],
    workItemId: "",
    onWorkItemIdChange: vi.fn(),
    selectionCount: 0,
    onClearSelection: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propagates search input changes", () => {
    render(<SpvsFilterBar {...defaultProps} />);

    const input = screen.getByPlaceholderText(
      /search by id, description/i
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "runner" } });

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("runner");
  });

  it("toggles level filters", () => {
    render(<SpvsFilterBar {...defaultProps} />);

    const levelButton = screen.getByText("L2");
    fireEvent.click(levelButton);

    expect(defaultProps.onLevelsChange).toHaveBeenCalledWith(["L2"]);
  });

  it("shows work-item helper when selections exist and supports clearing", () => {
    render(
      <SpvsFilterBar
        {...defaultProps}
        selectionCount={2}
        workItemId="US12345"
      />
    );

    expect(screen.getByText(/2 requirements selected/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(defaultProps.onClearSelection).toHaveBeenCalled();
  });
});
