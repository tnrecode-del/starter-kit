"use client";

import { useState } from "react";
import {
  Sparkles,
  Send,
  ArrowLeft,
  Bot,
  User,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@core/shared";
import { Input } from "@core/shared";
import { Label } from "@core/shared";
import { Textarea } from "@core/shared";

export function NewTaskPage() {
  const router = useRouter();

  // Left side state
  const [featureName, setFeatureName] = useState("");
  const [requirements, setRequirements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priority, setPriority] = useState<"standard" | "turbo">("standard");

  // Right side (AI Chat) state
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI Context Manager. What feature are we building today? I can help you draft the requirements and architecture.",
      isDraft: false,
    },
  ]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, isDraft: false },
    ]);
    setChatInput("");
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      let aiResponse = "";
      let isDraft = false;

      const lowerInput = userMessage.toLowerCase();
      if (lowerInput.includes("stripe") || lowerInput.includes("payment")) {
        aiResponse =
          "Great idea. To integrate Stripe, I suggest these requirements:\n- Configure Stripe Webhook endpoints.\n- Add `stripe_customer_id` to the Postgres User table.\n- Build a pricing page UI component.";
        isDraft = true;
      } else if (lowerInput.includes("email") || lowerInput.includes("auth")) {
        aiResponse =
          "For authentication/emails, we should:\n- Setup Resend or AWS SES.\n- Create a magic link flow in Next.js.\n- Update Auth.js configuration.";
        isDraft = true;
      } else {
        const mockResponses = [
          "I can definitely help with that. Let's break it down into modular tickets.\n- Update schema definition.\n- Implement tRPC router endpoints.\n- Add UI components.",
          "That sounds like a great feature! Here's a quick draft to get us started:\n- Define background jobs in Redis.\n- Build the administrative dashboard view.\n- Set up daily cron tasks.",
          "Interesting approach. We should consider these architectural requirements:\n- Expand the API to support pagination.\n- Optimize PostgreSQL indexes for the new queries.\n- Add frontend caching with React Query.",
          "Got it. Let's organize the work:\n- Design the Feature-Sliced Architecture layers.\n- Write end-to-end tests in Playwright.\n- Implement the core business logic in the Domain layer.",
        ];
        aiResponse =
          mockResponses[Math.floor(Math.random() * mockResponses.length)];
        isDraft = true;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse, isDraft },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const applyDraftToRequirements = (draftText: string) => {
    setRequirements((prev) =>
      prev
        ? prev + "\n\n### Brainstormed Draft\n" + draftText
        : "### Brainstormed Draft\n" + draftText,
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/admin");
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto py-8 px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shadow-sm border border-border/50 hover:bg-background"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            New AI Task
          </h1>
          <p className="text-muted-foreground text-sm">
            Draft requirements and deploy the agent swarm.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 flex-1 min-h-[600px] items-stretch">
        {/* Left Column: Form */}
        <div className="md:col-span-3 flex flex-col gap-6 bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-sm h-full">
          <form
            onSubmit={handleFormSubmit}
            className="flex flex-col h-full gap-8"
          >
            <div className="space-y-3">
              <Label
                htmlFor="title"
                className="text-foreground/80 font-medium text-base"
              >
                Feature Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Integrate Stripe Subscription"
                value={featureName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFeatureName(e.target.value)
                }
                className="bg-background/50 border-border/50 shadow-sm focus-visible:ring-primary/20 transition-all text-lg py-6 rounded-xl"
                required
              />
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="reqs"
                  className="text-foreground/80 font-medium text-base"
                >
                  Requirements & PRD
                </Label>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-border/50">
                  <Bot className="h-3 w-3" />
                  Use the AI assistant to brainstorm
                </div>
              </div>
              <Textarea
                id="reqs"
                placeholder="Describe the exact requirements, or click 'Apply' on an AI generated draft..."
                className="flex-1 resize-none bg-background/50 border-border/50 shadow-sm focus-visible:ring-primary/20 transition-all font-mono text-sm leading-relaxed rounded-xl p-4 min-h-[250px]"
                value={requirements}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRequirements(e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-4">
              <Label className="text-foreground/80 font-medium text-base">
                Execution Priority
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setPriority("turbo")}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${priority === "turbo" ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md" : "border-border/50 bg-background/50 hover:border-border opacity-70 hover:opacity-100"}`}
                >
                  <div className="font-semibold text-primary text-sm mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Turbo Mode
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Swarm (5 agents)
                  </div>
                </div>
                <div
                  onClick={() => setPriority("standard")}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${priority === "standard" ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md" : "border-border/50 bg-background/50 hover:border-border opacity-70 hover:opacity-100"}`}
                >
                  <div className="font-semibold text-foreground text-sm mb-1">
                    Standard
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Single Agent
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                isSubmitting || !featureName.trim() || !requirements.trim()
              }
              className="w-full py-6 text-base gap-2 shadow-lg shadow-primary/20 rounded-xl mt-auto"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              {isSubmitting ? "Deploying Swarm..." : "Deploy Agents"}
            </Button>
          </form>
        </div>

        {/* Right Column: AI Assistant */}
        <div className="md:col-span-2 flex flex-col bg-muted/10 border border-border/50 rounded-3xl overflow-hidden shadow-inner h-full min-h-0">
          <div className="p-5 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold tracking-tight">AI Brainstorm</h3>
              <p className="text-xs text-muted-foreground">
                Context Manager Analyst
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "assistant" ? "items-start" : "items-start flex-row-reverse"}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === "assistant" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border/50"}`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "assistant" ? "bg-card border border-border/50 rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"}`}
                  >
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  </div>
                  {msg.isDraft && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyDraftToRequirements(msg.content)}
                      className="gap-1.5 h-8 text-xs rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Apply to Requirements
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 items-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-card border border-border/50 shadow-sm flex items-center gap-2 h-[52px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-md">
            <form
              onSubmit={handleChatSubmit}
              className="flex items-center gap-2 bg-background border border-border/80 rounded-full p-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all"
            >
              <Input
                placeholder="Ask AI to brainstorm requirements..."
                value={chatInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setChatInput(e.target.value)
                }
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent px-4 h-10"
                disabled={isTyping}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!chatInput.trim() || isTyping}
                className="rounded-full shrink-0 shadow-sm h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
