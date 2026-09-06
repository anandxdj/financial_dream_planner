"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, CornerDownLeft, Sparkles, SlidersHorizontal, ArrowLeft } from "lucide-react";
import type { GoalCardItem, LoanItem, InvestmentItem } from "./types";
import { formatCurrency } from "./utils";

interface BuddyChatStepProps {
  goals: GoalCardItem[];
  salary: string;
  onSalaryChange: (val: string) => void;
  loans: LoanItem[];
  onLoansChange: (loans: LoanItem[]) => void;
  investments: InvestmentItem[];
  onInvestmentsChange: (investments: InvestmentItem[]) => void;
  onCompleteToReview: () => void;
  onContinueToFineTune: () => void;
  onBackToGoals: () => void;
}

interface ChatMessage {
  id: string;
  sender: "buddy" | "user";
  text: string;
}

type QuestionStep = "salary" | "emi" | "savings" | "done";

export function BuddyChatStep({
  goals,
  salary,
  onSalaryChange,
  loans,
  onLoansChange,
  investments,
  onInvestmentsChange,
  onCompleteToReview,
  onContinueToFineTune,
  onBackToGoals,
}: BuddyChatStepProps) {
  const selectedGoal = goals.find((g) => g.selected) || goals[0];
  const goalName = selectedGoal?.name || "your dream goal";

  const [questionStep, setQuestionStep] = useState<QuestionStep>("salary");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Initial messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "msg-1",
      sender: "buddy",
      text: `Hi! I'm Buddy 🥳 Let's build a plan that fits your life and helps you achieve ${goalName}.`,
    },
    {
      id: "msg-2",
      sender: "buddy",
      text: "To get started, what is your approximate monthly in-hand take-home salary?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSend(val?: string) {
    const rawValue = val !== undefined ? val : inputValue;
    const numericStr = rawValue.replace(/[^0-9]/g, "");
    if (!numericStr && questionStep !== "emi") return;

    if (questionStep === "salary") {
      const formatted = formatCurrency(numericStr || "65000");
      onSalaryChange(numericStr || "65000");

      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: "user", text: formatted },
      ]);
      setInputValue("");
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        setQuestionStep("emi");
        setMessages((prev) => [
          ...prev,
          {
            id: `buddy-${Date.now()}`,
            sender: "buddy",
            text: "Got it! Next, what is your total monthly EMI commitment (home loan, car, personal, or credit cards)?",
          },
        ]);
      }, 550);
    } else if (questionStep === "emi") {
      const emiAmount = numericStr || "0";
      const formatted =
        emiAmount === "0" ? "No EMIs 🙌" : formatCurrency(emiAmount);

      if (parseInt(emiAmount, 10) > 0) {
        onLoansChange([
          {
            id: "loan-chat-1",
            name: "Existing Loans & EMIs",
            type: "Home Loan",
            outstandingAmount: (parseInt(emiAmount, 10) * 36).toString(),
            monthlyEmi: emiAmount,
          },
        ]);
      } else {
        onLoansChange([]);
      }

      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: "user", text: formatted },
      ]);
      setInputValue("");
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        setQuestionStep("savings");
        setMessages((prev) => [
          ...prev,
          {
            id: `buddy-${Date.now()}`,
            sender: "buddy",
            text: "Almost there! How much do you have set aside in emergency funds or liquid savings right now?",
          },
        ]);
      }, 550);
    } else if (questionStep === "savings") {
      const savingsAmount = numericStr || "50000";
      const formatted =
        savingsAmount === "0"
          ? "Just starting out 🌱"
          : formatCurrency(savingsAmount);

      onInvestmentsChange([
        {
          id: "inv-chat-1",
          name: "Savings & Emergency Fund",
          type: "Savings Account",
          currentValue: savingsAmount,
        },
      ]);

      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: "user", text: formatted },
      ]);
      setInputValue("");
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
        setQuestionStep("done");
        setMessages((prev) => [
          ...prev,
          {
            id: `buddy-${Date.now()}`,
            sender: "buddy",
            text: "Awesome work! 🎉 I've put together your financial baseline. We can now review and generate your personalized living plan!",
          },
        ]);
      }, 600);
    }
  }

  const quickChips =
    questionStep === "salary"
      ? [
          { label: "₹50,000", value: "50000" },
          { label: "₹85,000", value: "85000" },
          { label: "₹1,20,000", value: "120000" },
          { label: "₹1,80,000", value: "180000" },
        ]
      : questionStep === "emi"
        ? [
            { label: "No EMIs 🙌", value: "0" },
            { label: "₹15,000", value: "15000" },
            { label: "₹30,000", value: "30000" },
            { label: "₹50,000", value: "50000" },
          ]
        : questionStep === "savings"
          ? [
              { label: "Just starting out 🌱", value: "25000" },
              { label: "₹50,000", value: "50000" },
              { label: "₹1,00,000", value: "100000" },
              { label: "₹2,50,000+", value: "250000" },
            ]
          : [];

  const totalEmis = loans.reduce(
    (acc, l) => acc + (parseFloat(l.monthlyEmi) || 0),
    0
  );
  const totalSavings = investments.reduce(
    (acc, i) => acc + (parseFloat(i.currentValue) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E1D6]/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#5E55C9]/10 px-2.5 py-0.5 text-xs font-semibold text-[#5E55C9]">
              <Sparkles className="size-3.5" />
              Conversational Onboarding
            </span>
            <span className="text-xs text-[#475467]">~60 seconds</span>
          </div>
          <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight text-[#1F2A44] sm:text-3xl">
            Let&apos;s get to know you ✨
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#475467]">
            Your AI buddy will guide you step by step with clarity and a human touch.
          </p>
        </div>

        <button
          type="button"
          onClick={onContinueToFineTune}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-[#E8E1D6] bg-white px-3 py-1.5 text-xs font-medium text-[#475467] hover:bg-[#FFF9F0] hover:text-[#1F2A44] transition-colors"
        >
          <SlidersHorizontal className="size-3.5 text-[#5E55C9]" />
          <span>Switch to detailed forms</span>
        </button>
      </div>

      {/* Chat Window Container */}
      <div className="flex flex-col h-[480px] rounded-2xl border border-[#E8E1D6] bg-[#FFFCF8] shadow-xs overflow-hidden">
        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isBuddy = msg.sender === "buddy";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isBuddy ? "justify-start" : "justify-end"
                }`}
              >
                {isBuddy && (
                  <div className="relative size-10 shrink-0 rounded-full border border-[#E8E1D6] bg-[#5E55C9]/10 p-1 shadow-2xs overflow-hidden">
                    <Image
                      src="/Assets/Piggy Banks/piggy_bank_coin.png"
                      alt="Buddy"
                      fill
                      className="object-contain p-0.5"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isBuddy
                      ? "rounded-tl-xs border border-[#E8E1D6] bg-white text-[#1F2A44] shadow-2xs"
                      : "rounded-tr-xs bg-[#5E55C9] text-white font-medium shadow-xs"
                  }`}
                >
                  {isBuddy && (
                    <div className="mb-1 text-[11px] font-bold tracking-wide text-[#5E55C9]">
                      BUDDY
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          })}

          {/* Animated typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="relative size-9 shrink-0 rounded-full border border-[#E8E1D6] bg-[#5E55C9]/10 p-1 overflow-hidden">
                <Image
                  src="/Assets/Piggy Banks/piggy_bank_coin.png"
                  alt="Buddy"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-[#E8E1D6] bg-white px-4 py-3 shadow-2xs">
                <div className="size-2 rounded-full bg-[#5E55C9] animate-bounce [animation-delay:-0.3s]" />
                <div className="size-2 rounded-full bg-[#5E55C9] animate-bounce [animation-delay:-0.15s]" />
                <div className="size-2 rounded-full bg-[#5E55C9] animate-bounce" />
              </div>
            </div>
          )}

          {/* Baseline Summary Card when done */}
          {questionStep === "done" && (
            <div className="rounded-2xl border border-[#E6B46A]/60 bg-[#FFFDF9] p-4.5 sm:p-5 shadow-xs my-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-[#E6B46A]/20 text-[#7D5200]">
                  <Sparkles className="size-4" />
                </div>
                <h4 className="font-serif text-base font-semibold text-[#1F2A44]">
                  Your Starting Financial Snapshot
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div className="rounded-xl border border-[#E8E1D6] bg-white p-3">
                  <div className="text-[#475467]">Monthly In-hand</div>
                  <div className="mt-1 font-serif text-sm font-semibold text-[#1F2A44]">
                    {formatCurrency(salary || "0")}
                  </div>
                </div>
                <div className="rounded-xl border border-[#E8E1D6] bg-white p-3">
                  <div className="text-[#475467]">Monthly EMIs</div>
                  <div className="mt-1 font-serif text-sm font-semibold text-[#1F2A44]">
                    {formatCurrency(totalEmis.toString())}
                  </div>
                </div>
                <div className="rounded-xl border border-[#E8E1D6] bg-white p-3">
                  <div className="text-[#475467]">Liquid Savings</div>
                  <div className="mt-1 font-serif text-sm font-semibold text-[#1F2A44]">
                    {formatCurrency(totalSavings.toString())}
                  </div>
                </div>
                <div className="rounded-xl border border-[#E8E1D6] bg-white p-3">
                  <div className="text-[#475467]">Primary Goal</div>
                  <div className="mt-1 font-medium text-[#5E55C9] truncate">
                    {goalName}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Quick Chips Bar */}
        <div className="border-t border-[#E8E1D6] bg-[#FFFCF8] p-3 sm:p-4 space-y-3">
          {/* Suggestion Chips */}
          {quickChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-[#475467]">
                Quick picks:
              </span>
              {quickChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleSend(chip.value)}
                  className="rounded-full border border-[#E8E1D6] bg-white px-3 py-1 text-xs font-semibold text-[#1F2A44] hover:border-[#5E55C9] hover:bg-[#5E55C9]/10 hover:text-[#5E55C9] transition-colors active:scale-95 shadow-2xs"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Active input row if not done */}
          {questionStep !== "done" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#475467]">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    questionStep === "salary"
                      ? "Enter monthly salary e.g. 75,000"
                      : questionStep === "emi"
                        ? "Enter monthly EMI (or 0)"
                        : "Enter savings amount e.g. 1,00,000"
                  }
                  className="w-full rounded-xl border border-[#E8E1D6] bg-white py-2.5 pl-8 pr-4 text-sm font-medium text-[#1F2A44] placeholder:text-[#9CA3AF] focus:border-[#5E55C9] focus:ring-1 focus:ring-[#5E55C9] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() && questionStep !== "emi"}
                className="inline-flex size-10 items-center justify-center rounded-xl bg-[#5E55C9] text-white hover:bg-[#4E45B8] disabled:opacity-40 transition-all active:scale-95 shrink-0 shadow-xs"
                aria-label="Send response"
              >
                <CornerDownLeft className="size-4" />
              </button>
            </form>
          ) : (
            /* Action Buttons upon completing chat */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={onContinueToFineTune}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#E8E1D6] bg-white px-5 py-2.5 text-sm font-semibold text-[#1F2A44] hover:bg-[#FFF9F0] transition-colors shadow-2xs"
              >
                <SlidersHorizontal className="size-4 text-[#5E55C9]" />
                <span>Fine-tune details (Expenses, Loans)</span>
              </button>

              <button
                type="button"
                onClick={onCompleteToReview}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#5E55C9] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4E45B8] active:scale-98 transition-all"
              >
                <span>Review & Generate Plan</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-[#E8E1D6] pt-4 text-xs">
        <button
          type="button"
          onClick={onBackToGoals}
          className="inline-flex items-center gap-1.5 font-medium text-[#475467] hover:text-[#1F2A44]"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Goals</span>
        </button>

        <button
          type="button"
          onClick={onContinueToFineTune}
          className="font-semibold text-[#5E55C9] hover:underline"
        >
          Skip chat and open detailed wizard →
        </button>
      </div>
    </div>
  );
}
