"use client";

import { useEffect, useRef, useState } from "react";
import { loadProfile } from "./profileStorage";
import { cn } from "./cn";
import type { CountryId, LocaleId, SkillsProfile } from "@/packages/core/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  usedLLM?: boolean;
  provider?: "openai" | "anthropic";
  model?: string;
}

const LOCALIZED_OPENERS: Record<LocaleId, string> = {
  en: "Hi, I'm Nia — your guide inside Unmapped Kairos. Yes, I'm an AI giving advice about AI; the irony isn't lost on me. Ask me anything about your skills or what's hiring here.",
  tw: "Akwaaba! Me din de Nia — Unmapped Kairos akwankyerɛni. Bisa me biribi a ɛfa wo nimdeɛ anaa adwuma akwan ho.",
  bn: "আমি Nia — Unmapped Kairos-এর ভিতরের আপনার গাইড। আপনার দক্ষতা বা চাকরির বাজার সম্পর্কে যেকোনো প্রশ্ন জিজ্ঞাসা করুন।",
  es: "¡Hola! Soy Nia, tu guía dentro de Unmapped Kairos. Sí, soy una IA dando consejos sobre la IA — la ironía no se me escapa. Pregúntame lo que quieras sobre tus habilidades o el mercado laboral.",
  pt: "Oi! Sou a Nia, sua guia dentro do Unmapped Kairos. Sim, sou uma IA dando conselhos sobre IA — a ironia não me escapou. Me pergunte qualquer coisa sobre suas habilidades ou o mercado de trabalho.",
};

const PLACEHOLDER: Record<LocaleId, string> = {
  en: "Ask Nia about your skills, opportunities, AI risk…",
  tw: "Bisa Nia",
  bn: "Nia-কে জিজ্ঞাসা করুন",
  es: "Pregúntale a Nia",
  pt: "Pergunte à Nia",
};

const HINTS: Record<LocaleId, string[]> = {
  en: [
    "What's the AI risk for phone repair here?",
    "Show me the highest-paying sectors I can reach",
    "How do I make my skills more durable?",
  ],
  tw: ["AI gye ho hia sɛn?", "Adwuma a ɛtua sika kɛse?"],
  bn: ["আমার দক্ষতার ঝুঁকি কত?", "সর্বোচ্চ বেতনের চাকরি কোথায়?"],
  es: ["¿Cuál es el riesgo de IA para reparar teléfonos?", "¿Qué sectores pagan mejor aquí?"],
  pt: ["Qual o risco de IA para conserto de celular?", "Quais setores pagam melhor aqui?"],
};

export function NiaLauncher({
  countryId,
  locale,
}: {
  countryId: CountryId;
  locale: LocaleId;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Seed the opener message once per locale
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot opener per locale change.
    setMessages([
      {
        role: "assistant",
        content: LOCALIZED_OPENERS[locale] ?? LOCALIZED_OPENERS.en,
      },
    ]);
  }, [locale]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPending(true);

    let profile: SkillsProfile | null = null;
    try {
      profile = loadProfile(countryId);
    } catch {
      profile = null;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          country: countryId,
          locale,
          profile,
          // Send only role/content (strip pending flags)
          history: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "chat failed");
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.reply,
          usedLLM: data.usedLLM,
          provider: data.provider,
          model: data.model,
        },
      ]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Hmm, something went wrong on my end. Please try again in a moment.",
        },
      ]);
      console.error(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Nia" : "Open Nia"}
        className={cn(
          "fixed bottom-5 right-5 z-30 rounded-full shadow-lg flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all",
          open
            ? "bg-stone-900 text-white"
            : "bg-[var(--color-accent)] text-white hover:opacity-95",
        )}
      >
        <span className="inline-block w-2 h-2 rounded-full bg-[#a3e635] animate-pulse" />
        {open ? "Close" : "Ask Nia"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-30 w-[min(92vw,380px)] max-h-[min(80vh,560px)] flex flex-col rounded-lg border border-stone-300 bg-white shadow-xl overflow-hidden">
          <header className="border-b border-stone-200 px-4 py-3 bg-stone-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              Nia
            </p>
            <p className="text-[11px] text-stone-500 leading-tight">
              Built into Unmapped Kairos · {countryId} ·{" "}
              {locale.toUpperCase()}
            </p>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[88%] text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-[var(--color-accent)] text-white rounded-2xl rounded-br-sm px-3 py-2"
                    : "mr-auto bg-stone-100 text-stone-900 rounded-2xl rounded-bl-sm px-3 py-2",
                )}
              >
                {m.content}
                {m.role === "assistant" && m.usedLLM === false && (
                  <span className="block mt-1 text-[10px] uppercase tracking-wider text-stone-500">
                    offline mode
                  </span>
                )}
                {m.role === "assistant" && m.usedLLM === true && m.provider && (
                  <span className="block mt-1 text-[10px] uppercase tracking-wider text-stone-500 font-mono">
                    via {m.provider === "openai" ? "OpenAI" : "Claude"}
                    {m.model ? ` · ${m.model}` : ""}
                  </span>
                )}
              </div>
            ))}
            {pending && (
              <div className="mr-auto bg-stone-100 text-stone-500 rounded-2xl rounded-bl-sm px-3 py-2 text-sm italic animate-pulse">
                Nia is thinking…
              </div>
            )}
            {messages.length <= 1 && (
              <div className="pt-2">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">
                  Try asking
                </p>
                <ul className="space-y-1">
                  {(HINTS[locale] ?? HINTS.en).map((h) => (
                    <li key={h}>
                      <button
                        type="button"
                        onClick={() => send(h)}
                        className="w-full text-left text-xs px-2 py-1.5 rounded border border-stone-200 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] text-stone-700"
                      >
                        {h}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-stone-200 p-2 flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={PLACEHOLDER[locale] ?? PLACEHOLDER.en}
              disabled={pending}
              className="flex-1 text-sm px-3 py-2 rounded border border-stone-300 focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded bg-[var(--color-accent)] text-white px-3 py-2 text-sm font-medium hover:opacity-95 disabled:opacity-40"
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </>
  );
}
