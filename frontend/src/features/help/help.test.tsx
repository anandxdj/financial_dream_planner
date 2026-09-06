import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { HelpHero } from "./help-hero";
import { FaqHub } from "./faq-hub";
import { ContactSupport } from "./contact-support";
import { ConnectedApps } from "./connected-apps";
import { ReferralCard } from "./referral-card";
import HelpPage from "@/app/help/page";
import ContactPage from "@/app/contact/page";
import ReferralPage from "@/app/referral/page";

// Mock next/image to render standard img tag without passing boolean priority
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
    ...props
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    [key: string]: unknown;
  }) => {
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
  },
}));

describe("Board 10 Help, Support, Connected Apps & Referral Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("HelpHero Component (#01)", () => {
    it("renders the hero title, search input, and category cards", () => {
      const handleSearch = vi.fn();
      render(<HelpHero onSearch={handleSearch} />);

      // Hero Title
      expect(
        screen.getByRole("heading", {
          name: /how can we help you today\?/i,
          level: 1,
        })
      ).toBeInTheDocument();

      // Search input
      const searchInput = screen.getByPlaceholderText(
        /search help articles, topics, or questions\.\.\./i
      );
      expect(searchInput).toBeInTheDocument();

      // Typing in search triggers search handler
      fireEvent.change(searchInput, { target: { value: "bank sync" } });
      expect(handleSearch).toHaveBeenCalledWith("bank sync");

      // 3 Quick category cards
      expect(screen.getByText("Browse FAQs")).toBeInTheDocument();
      expect(screen.getByText("Contact Support")).toBeInTheDocument();
      expect(screen.getByText("Guides & Resources")).toBeInTheDocument();

      // Watercolor artwork and script quote
      expect(
        screen.getByText(/support today\. a brighter tomorrow\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByAltText(/support today\. a brighter tomorrow\./i)
      ).toBeInTheDocument();
    });
  });

  describe("FaqHub Component (#02)", () => {
    it("renders the FAQ section with categories and interactive accordion items", () => {
      render(<FaqHub />);

      // Section Title
      expect(
        screen.getByRole("heading", {
          name: /frequently asked questions/i,
          level: 2,
        })
      ).toBeInTheDocument();

      // Category filter pills
      expect(screen.getByRole("button", { name: /all topics/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /account & login/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /billing & plans/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /features/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /security & privacy/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /apps & integrations/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /troubleshooting/i })).toBeInTheDocument();

      // Accordion items from spec
      expect(screen.getByText(/how do i create an account\?/i)).toBeInTheDocument();
      expect(screen.getByText(/can i change my plan later\?/i)).toBeInTheDocument();
      expect(screen.getByText(/is my data secure\?/i)).toBeInTheDocument();
      expect(screen.getByText(/can i connect my bank accounts\?/i)).toBeInTheDocument();
      expect(screen.getByText(/how do i cancel my subscription\?/i)).toBeInTheDocument();

      // Side script quote
      expect(
        screen.getByText(/good questions\. brighter answers\./i)
      ).toBeInTheDocument();

      // Test accordion toggling
      const secureDataQuestion = screen.getByText(/is my data secure\?/i);
      fireEvent.click(secureDataQuestion);
      expect(
        screen.getByText(/bank-grade 256-bit aes encryption/i)
      ).toBeInTheDocument();
    });

    it("filters questions when category filter is clicked", () => {
      render(<FaqHub />);

      // Click "Security & Privacy" filter
      const securityFilter = screen.getByRole("button", { name: /security & privacy/i });
      fireEvent.click(securityFilter);

      // Only security question should remain visible
      expect(screen.getByText(/is my data secure\?/i)).toBeInTheDocument();
      expect(screen.queryByText(/can i change my plan later\?/i)).not.toBeInTheDocument();
    });
  });

  describe("ContactSupport Component (#03)", () => {
    it("renders the 3 channel cards and side script", () => {
      render(<ContactSupport />);

      // Title & subtitle
      expect(
        screen.getByRole("heading", { name: /get in touch/i, level: 2 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/we're here to help\. reach out and our team will get back to you soon\./i)
      ).toBeInTheDocument();

      // 3 Channel Cards
      expect(screen.getByText("Chat with us")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /start chat/i })).toBeInTheDocument();

      expect(screen.getByText("Email us")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send email/i })).toBeInTheDocument();

      expect(screen.getByText("Request a call")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /request call/i })).toBeInTheDocument();

      // Side script
      expect(screen.getByText(/real people\. real support\./i)).toBeInTheDocument();
    });

    it("opens interactive chat modal and accepts messages", () => {
      render(<ContactSupport />);

      // Open chat
      fireEvent.click(screen.getByRole("button", { name: /start chat/i }));
      expect(screen.getByText("Live Support Chat")).toBeInTheDocument();

      // Type and send message
      const input = screen.getByPlaceholderText(/type your message\.\.\./i);
      fireEvent.change(input, { target: { value: "Hello from test" } });
      fireEvent.click(screen.getByRole("button", { name: /^send$/i }));

      expect(screen.getByText("Hello from test")).toBeInTheDocument();
    });
  });

  describe("ConnectedApps Component (#04)", () => {
    it("renders the integration accounts and supports connection toggle", async () => {
      render(<ConnectedApps />);

      expect(
        screen.getByRole("heading", { name: /connect your accounts/i, level: 2 })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/link your favorite apps to get a complete view of your finances\./i)
      ).toBeInTheDocument();

      // 4 Integration cards
      expect(screen.getByText("Bank Accounts")).toBeInTheDocument();
      expect(screen.getByText("128+ banks")).toBeInTheDocument();
      expect(screen.getByText("Credit Cards")).toBeInTheDocument();
      expect(screen.getByText("Investments")).toBeInTheDocument();
      expect(screen.getByText("UPI & Wallets")).toBeInTheDocument();

      // Side quote
      expect(
        screen.getByText(/all your finances, working together\./i)
      ).toBeInTheDocument();

      // Connect button click on disconnected account
      const connectButtons = screen.getAllByRole("button", { name: /connect/i });
      fireEvent.click(connectButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText(/connected/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("ReferralCard Component (#06)", () => {
    it("renders referral details, 3-step timeline, and copy link action", async () => {
      // Mock clipboard writeText
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(<ReferralCard />);

      // Title & Subtitle
      expect(
        screen.getByRole("heading", {
          name: /invite friends, spread brighter tomorrows/i,
          level: 2,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /give your friends 1 month of premium and get 1 month free when they join\./i
        )
      ).toBeInTheDocument();

      // 3-step timeline
      expect(screen.getByText("1. Send your invite")).toBeInTheDocument();
      expect(screen.getByText("Share your unique link")).toBeInTheDocument();
      expect(screen.getByText("2. Your friend joins")).toBeInTheDocument();
      expect(screen.getByText("They create an account")).toBeInTheDocument();
      expect(screen.getByText("3. You both get rewarded")).toBeInTheDocument();
      expect(screen.getByText("Each gets 1 month free")).toBeInTheDocument();

      // Copy invite link button
      const copyBtn = screen.getByRole("button", { name: /copy invite link/i });
      expect(copyBtn).toBeInTheDocument();
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(screen.getByText(/copied!/i)).toBeInTheDocument();
      });
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining("BRIGHTER-TOMORROW-2026")
      );

      // Friends artwork with script quote
      expect(
        screen.getByText(/brighter tomorrows are better together\./i)
      ).toBeInTheDocument();
    });
  });

  describe("Page Routes Integration", () => {
    it("renders HelpPage with all core sections", () => {
      render(<HelpPage />);
      expect(
        screen.getByRole("heading", { name: /how can we help you today\?/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /frequently asked questions/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /get in touch/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /ready for a brighter tomorrow\?/i })
      ).toBeInTheDocument();
    });

    it("renders ContactPage", () => {
      render(<ContactPage />);
      expect(
        screen.getByRole("heading", { name: /get in touch/i })
      ).toBeInTheDocument();
    });

    it("renders ReferralPage", () => {
      render(<ReferralPage />);
      expect(
        screen.getByRole("heading", {
          name: /invite friends, spread brighter tomorrows/i,
        })
      ).toBeInTheDocument();
    });
  });
});
