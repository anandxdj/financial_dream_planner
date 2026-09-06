import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BuddyChatStep } from "./buddy-chat-step";
import { INITIAL_GOALS, INITIAL_LOANS, INITIAL_INVESTMENTS } from "./constants";

describe("BuddyChatStep conversational onboarding", () => {
  it("renders welcome message from Buddy and prompts for salary", () => {
    const onSalaryChange = vi.fn();
    const onLoansChange = vi.fn();
    const onInvestmentsChange = vi.fn();
    const onCompleteToReview = vi.fn();
    const onContinueToFineTune = vi.fn();
    const onBackToGoals = vi.fn();

    render(
      <BuddyChatStep
        goals={INITIAL_GOALS}
        salary="65000"
        onSalaryChange={onSalaryChange}
        loans={INITIAL_LOANS}
        onLoansChange={onLoansChange}
        investments={INITIAL_INVESTMENTS}
        onInvestmentsChange={onInvestmentsChange}
        onCompleteToReview={onCompleteToReview}
        onContinueToFineTune={onContinueToFineTune}
        onBackToGoals={onBackToGoals}
      />
    );

    expect(screen.getByText(/let's get to know you/i)).toBeInTheDocument();
    expect(screen.getByText(/hi! i'm buddy 🥳/i)).toBeInTheDocument();
    expect(screen.getByText(/what is your approximate monthly in-hand take-home salary\?/i)).toBeInTheDocument();

    // Pick a quick suggestion chip
    const chip = screen.getByRole("button", { name: "₹85,000" });
    fireEvent.click(chip);

    expect(onSalaryChange).toHaveBeenCalledWith("85000");
  });
});
