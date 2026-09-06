import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VerifyEmailPanel } from "./verify-email-panel";

const mockMutate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/hooks/use-verify-email", () => ({
  useVerifyEmail: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe("VerifyEmailPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders title, subtitle, 6 OTP input boxes, resend timer, and cursive quote", () => {
    renderWithClient(<VerifyEmailPanel />);

    // Title
    expect(screen.getByRole("heading", { name: /verify your email/i, level: 1 })).toBeInTheDocument();

    // Default email in subtitle
    expect(screen.getByText(/anand@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/we've sent a 6-digit code to/i)).toBeInTheDocument();

    // 6 OTP inputs
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);

    // Resend countdown timer
    expect(screen.getByText(/resend in 28s/i)).toBeInTheDocument();

    // Cursive script quote
    expect(screen.getByText(/small step/i)).toBeInTheDocument();
    expect(screen.getByText(/brighter tomorrow/i)).toBeInTheDocument();

    // Verify button
    expect(screen.getByRole("button", { name: /verify email/i })).toBeInTheDocument();
  });

  it("uses custom email from URL search params when provided", () => {
    mockSearchParams = new URLSearchParams("email=custom@planner.test");
    renderWithClient(<VerifyEmailPanel />);

    expect(screen.getByText("custom@planner.test")).toBeInTheDocument();
  });

  it("advances focus and auto-submits when 6 digits are typed", () => {
    renderWithClient(<VerifyEmailPanel />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "2" } });
    fireEvent.change(inputs[1], { target: { value: "4" } });
    fireEvent.change(inputs[2], { target: { value: "8" } });
    fireEvent.change(inputs[3], { target: { value: "1" } });
    fireEvent.change(inputs[4], { target: { value: "6" } });
    fireEvent.change(inputs[5], { target: { value: "0" } });

    expect(mockMutate).toHaveBeenCalledWith("248160");
  });

  it("supports pasting a 6-digit OTP code and auto-submitting", () => {
    renderWithClient(<VerifyEmailPanel />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "987654",
      },
    });

    expect(mockMutate).toHaveBeenCalledWith("987654");
  });

  it("supports backspace to go back to previous input box", async () => {
    renderWithClient(<VerifyEmailPanel />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "3" } });
    fireEvent.change(inputs[1], { target: { value: "5" } });

    // Pressing backspace on empty input 2 moves focus back to input 1 and clears it
    fireEvent.keyDown(inputs[2], { key: "Backspace" });
    await waitFor(() => {
      expect((inputs[1] as HTMLInputElement).value).toBe("");
    });
  });

  it("auto-submits token from URL if present", () => {
    mockSearchParams = new URLSearchParams("token=token-12345");
    renderWithClient(<VerifyEmailPanel />);

    expect(mockMutate).toHaveBeenCalledWith("token-12345");
  });

  it("submits OTP when clicking the Verify email button", () => {
    renderWithClient(<VerifyEmailPanel />);

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });
    fireEvent.change(inputs[2], { target: { value: "3" } });
    fireEvent.change(inputs[3], { target: { value: "4" } });
    fireEvent.change(inputs[4], { target: { value: "5" } });
    mockMutate.mockClear();

    // Type 6th digit
    fireEvent.change(inputs[5], { target: { value: "6" } });
    expect(mockMutate).toHaveBeenCalledWith("123456");

    // Clicking the button also submits
    mockMutate.mockClear();
    const button = screen.getByRole("button", { name: /verify email/i });
    fireEvent.click(button);
    expect(mockMutate).toHaveBeenCalledWith("123456");
  });
});
