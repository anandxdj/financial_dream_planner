"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MessageSquare, Mail, Headphones, Check, PhoneCall, X, Clock } from "lucide-react";
import { toast } from "sonner";

export function ContactSupport() {
  const [activeModal, setActiveModal] = useState<"chat" | "email" | "call" | null>(null);
  const [callPhone, setCallPhone] = useState("");
  const [callTimeSlot, setCallTimeSlot] = useState("Morning (9 AM - 12 PM)");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ sender: "user" | "support"; text: string }>>([
    {
      sender: "support",
      text: "Hello! Welcome to Financial Dream Planner support. How can we help make your financial journey smoother today?",
    },
  ]);

  const handleStartChat = () => {
    setActiveModal("chat");
    toast.success("Support chat session opened");
  };

  const handleSendEmail = () => {
    setActiveModal("email");
  };

  const handleRequestCall = () => {
    setActiveModal("call");
  };

  const submitCallRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callPhone.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }
    toast.success("Callback scheduled! Our advisory team will call you during your requested slot.", {
      description: `Target number: ${callPhone} (${callTimeSlot})`,
    });
    setActiveModal(null);
    setCallPhone("");
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailBody.trim()) {
      toast.error("Please include a brief message");
      return;
    }
    toast.success("Message sent successfully! We will reply within 24 hours.", {
      description: "A confirmation has been sent to your email.",
    });
    setActiveModal(null);
    setEmailSubject("");
    setEmailBody("");
  };

  const chatTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    };
  }, []);

  const submitChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userText = chatMessage.trim();
    setChatLog((prev) => [...prev, { sender: "user", text: userText }]);
    setChatMessage("");

    if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    chatTimerRef.current = setTimeout(() => {
      if (typeof window === "undefined") return;
      setChatLog((prev) => [
        ...prev,
        {
          sender: "support",
          text: "Thank you for reaching out! A dedicated support specialist has received your inquiry and is reviewing your request right now.",
        },
      ]);
    }, 600);
  };

  return (
    <section id="contact-section" className="relative py-14 sm:py-20 bg-[#FFFCF8] border-t border-[#E8E1D6]/80 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1F2A44] font-normal tracking-tight">
            Get in touch
          </h2>
          <p className="text-base text-[#475467] max-w-2xl mx-auto leading-relaxed">
            We&apos;re here to help. Reach out and our team will get back to you soon.
          </p>
        </div>

        {/* 3 Channel Cards + Side Script */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3 Channel Cards in 9 columns */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Chat with us */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-white p-6 shadow-2xs hover:border-[#5E55C9]/40 hover:shadow-xs transition-all">
              <div className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#5E55C9]/10 text-[#5E55C9]">
                  <MessageSquare className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1F2A44]">Chat with us</h3>
                  <p className="mt-1 text-sm text-[#475467] leading-relaxed">
                    Get instant help from our support team.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2 pt-2 border-t border-[#E8E1D6]/50">
                <button
                  type="button"
                  onClick={handleStartChat}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-[#5E55C9] hover:bg-[#4D4AB8] active:scale-[0.98] text-white py-2.5 px-4 font-medium text-sm transition-all cursor-pointer shadow-xs"
                >
                  Start chat
                </button>
                <p className="text-center text-xs text-[#475467]/70">Available 9am - 9pm IST</p>
              </div>
            </div>

            {/* Card 2: Email us */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-white p-6 shadow-2xs hover:border-[#5E55C9]/40 hover:shadow-xs transition-all">
              <div className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#3B5B8C]/10 text-[#3B5B8C]">
                  <Mail className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1F2A44]">Email us</h3>
                  <p className="mt-1 text-sm text-[#475467] leading-relaxed">
                    Send us a message and we&apos;ll reply within 24 hours.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2 pt-2 border-t border-[#E8E1D6]/50">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-[#5E55C9] hover:bg-[#4D4AB8] active:scale-[0.98] text-white py-2.5 px-4 font-medium text-sm transition-all cursor-pointer shadow-xs"
                >
                  Send email
                </button>
                <p className="text-center text-xs text-[#475467]/70">Average reply: under 2 hrs</p>
              </div>
            </div>

            {/* Card 3: Request a call */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#E8E1D6] bg-white p-6 shadow-2xs hover:border-[#5E55C9]/40 hover:shadow-xs transition-all">
              <div className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[#3D5C4A]/10 text-[#3D5C4A]">
                  <Headphones className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1F2A44]">Request a call</h3>
                  <p className="mt-1 text-sm text-[#475467] leading-relaxed">
                    Prefer to talk? Request a callback at your convenience.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-2 pt-2 border-t border-[#E8E1D6]/50">
                <button
                  type="button"
                  onClick={handleRequestCall}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-[#5E55C9] hover:bg-[#4D4AB8] active:scale-[0.98] text-white py-2.5 px-4 font-medium text-sm transition-all cursor-pointer shadow-xs"
                >
                  Request call
                </button>
                <p className="text-center text-xs text-[#475467]/70">Free advisory session</p>
              </div>
            </div>
          </div>

          {/* Right Column: Side Script & Botanical Artwork */}
          <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-start justify-center lg:justify-start gap-4">
            <div className="space-y-4 text-center lg:text-left">
              <div className="transform -rotate-2">
                <span className="font-script text-3xl sm:text-4xl text-[#3B5B8C] drop-shadow-xs italic">
                  Real people. Real support.
                </span>
              </div>
              <p className="text-xs text-[#475467]/80 max-w-xs leading-relaxed hidden lg:block">
                No robotic phone trees. Reach certified financial planners and knowledgeable product champions.
              </p>
              <div className="hidden lg:flex justify-start pt-2">
                <Image
                  src="/Assets/Nature Elements/green_leaves.png"
                  alt="Botanical leaves"
                  width={90}
                  height={180}
                  className="opacity-75 rotate-6 drop-shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Chat Modal */}
      {activeModal === "chat" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-[#E8E1D6] flex flex-col h-[520px] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E8E1D6] px-5 py-3.5 bg-[#FFFDF9]">
              <div className="flex items-center gap-2.5">
                <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-[#1F2A44] text-sm">Live Support Chat</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close chat"
                className="size-8 rounded-lg flex items-center justify-center text-[#475467] hover:bg-[#F5EFE6]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFFDF9]/60">
              {chatLog.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === "user"
                        ? "bg-[#5E55C9] text-white rounded-br-xs"
                        : "bg-white border border-[#E8E1D6] text-[#1F2A44] rounded-bl-xs shadow-2xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={submitChatMessage} className="p-3 border-t border-[#E8E1D6] bg-white flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-[#E8E1D6] px-3.5 py-2 text-sm text-[#1F2A44] outline-none focus:border-[#5E55C9]"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-xl bg-[#5E55C9] hover:bg-[#4D4AB8] text-white px-4 py-2 text-sm font-medium"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Request Call Modal */}
      {activeModal === "call" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-[#E8E1D6] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E1D6]/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#3D5C4A]/10 text-[#3D5C4A]">
                  <PhoneCall className="size-4.5" />
                </div>
                <h3 className="font-serif text-lg text-[#1F2A44]">Request a callback</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="size-8 rounded-lg flex items-center justify-center text-[#475467] hover:bg-[#F5EFE6]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submitCallRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2A44] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={callPhone}
                  onChange={(e) => setCallPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E1D6] px-3.5 py-2.5 text-sm text-[#1F2A44] outline-none focus:border-[#5E55C9] focus:ring-2 focus:ring-[#5E55C9]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2A44] mb-1.5">
                  Preferred Time Window
                </label>
                <select
                  value={callTimeSlot}
                  onChange={(e) => setCallTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E1D6] px-3.5 py-2.5 text-sm text-[#1F2A44] outline-none focus:border-[#5E55C9] focus:ring-2 focus:ring-[#5E55C9]/20 bg-white"
                >
                  <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                  <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                  <option value="Evening (4 PM - 8 PM)">Evening (4 PM - 8 PM)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm text-[#475467] hover:bg-[#F5EFE6] rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-[#5E55C9] hover:bg-[#4D4AB8] text-white rounded-xl font-semibold shadow-xs"
                >
                  Confirm Callback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Email Modal */}
      {activeModal === "email" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-[#E8E1D6] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E8E1D6]/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#3B5B8C]/10 text-[#3B5B8C]">
                  <Mail className="size-4.5" />
                </div>
                <h3 className="font-serif text-lg text-[#1F2A44]">Email support</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="size-8 rounded-lg flex items-center justify-center text-[#475467] hover:bg-[#F5EFE6]"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={submitEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2A44] mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Question about subscription / sync..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E1D6] px-3.5 py-2.5 text-sm text-[#1F2A44] outline-none focus:border-[#5E55C9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2A44] mb-1.5">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="How can our team help you?"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E1D6] px-3.5 py-2.5 text-sm text-[#1F2A44] outline-none focus:border-[#5E55C9]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm text-[#475467] hover:bg-[#F5EFE6] rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-[#5E55C9] hover:bg-[#4D4AB8] text-white rounded-xl font-semibold shadow-xs"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
