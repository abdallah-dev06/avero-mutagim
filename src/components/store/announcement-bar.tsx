"use client";

import * as React from "react";

export function AnnouncementBar({
  messages,
  speed = "normal",
}: {
  messages: string[];
  speed?: "slow" | "normal" | "fast";
}) {
  if (!messages || !messages.length) return null;

  const cleanMessages = messages.filter((m) => m && m.trim().length > 0);
  if (!cleanMessages.length) return null;

  // Duration in seconds
  const durationMap = {
    slow: "45s",
    normal: "32s",
    fast: "20s",
  };
  const duration = durationMap[speed] || "32s";

  // Identical replication pattern to MarqueeBand below
  const row = [...cleanMessages, ...cleanMessages, ...cleanMessages];
  const allItems = [...row, ...row];

  // Helper to render luxury highlighted message text (Strictly NO stars — only refined boutique dots ●)
  const renderMessageContent = (text: string) => {
    let content = text.trim();
    let hasLeadingDot = false;

    // Detect and replace any star/diamond symbols with an elegant dot ●
    if (/^[✦★☆⭐✨●]\s*/.test(content)) {
      hasLeadingDot = true;
      content = content.replace(/^[✦★☆⭐✨●]\s*/, "");
    }

    if (content.includes("VETRINA BOUTIQUE")) {
      const parts = content.split("VETRINA BOUTIQUE");
      return (
        <span className="inline-flex items-center gap-1.5">
          {hasLeadingDot && (
            <span className="text-[#D9A6B6] text-[10px] select-none" aria-hidden="true">
              ●
            </span>
          )}
          <span>{parts[0]}</span>
          <span className="latin font-display font-semibold tracking-wider text-[#D9A6B6] text-[13px] sm:text-sm">
            VETRINA BOUTIQUE
          </span>
          <span>{parts[1]}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5">
        {hasLeadingDot && (
          <span className="text-[#D9A6B6] text-[10px] select-none" aria-hidden="true">
            ●
          </span>
        )}
        <span>{content}</span>
      </span>
    );
  };

  return (
    <aside
      role="region"
      aria-label="شريط الإعلانات التسويقية"
      className="group relative z-40 w-full overflow-hidden border-b border-[#3b1728] bg-[#4B1F34] text-[#F9F6F4] select-none"
    >
      <div className="pt-safe" />
      <div className="relative flex h-9 sm:h-10 items-center overflow-hidden">
        {/* Identical animation class and behavior as MarqueeBand below */}
        <div
          className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap group-hover:[animation-play-state:paused]"
          style={{ animationDuration: duration }}
        >
          {allItems.map((msg, i) => (
            <span
              key={i}
              className="flex items-center gap-10 text-xs sm:text-[13px] font-medium tracking-wide"
            >
              <span>{renderMessageContent(msg)}</span>
              <span
                aria-hidden="true"
                className="inline-block size-1.5 rounded-full bg-[#D9A6B6] shadow-[0_0_8px_rgba(217,166,182,0.85)]"
              />
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
