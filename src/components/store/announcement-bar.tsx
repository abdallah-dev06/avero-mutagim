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

  // Clean empty messages
  const cleanMessages = messages.filter((m) => m && m.trim().length > 0);
  if (!cleanMessages.length) return null;

  // Duration in seconds based on speed setting
  const durationMap = {
    slow: "36s",
    normal: "24s",
    fast: "16s",
  };
  const duration = durationMap[speed] || "24s";

  // Repeat sequence inside track so it comfortably fills any viewport width
  const trackItems = [...cleanMessages, ...cleanMessages];

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
      {/* 
        Flawless continuous infinite marquee:
        Both identical tracks translate from 0 to -100% simultaneously.
        As Track 1 exits on the left, Track 2 enters on the right AT THE EXACT SAME TIME.
        No gaps, no pauses, and no waiting for text to reappear.
      */}
      <style>{`
        @keyframes vb-marquee-continuous {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }
        .vb-marquee-track-unit {
          display: flex !important;
          flex-shrink: 0 !important;
          align-items: center !important;
          white-space: nowrap !important;
          will-change: transform;
          animation: vb-marquee-continuous ${duration} linear infinite !important;
        }
        .group:hover .vb-marquee-track-unit,
        .group:active .vb-marquee-track-unit {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="pt-safe" />
      <div className="relative flex h-9 sm:h-10 items-center overflow-hidden">
        {/* Synchronized dual-track marquee wrapper */}
        <div dir="ltr" className="flex w-max items-center">
          {/* Track 1: Primary set */}
          <div className="vb-marquee-track-unit">
            {trackItems.map((msg, idx) => (
              <span
                key={`t1-${idx}`}
                dir="rtl"
                className="flex items-center text-xs sm:text-[13px] font-medium tracking-wide"
              >
                <span className="inline-block px-3 sm:px-5">
                  {renderMessageContent(msg)}
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center px-1 select-none"
                >
                  <span className="size-1.5 rounded-full bg-[#D9A6B6] shadow-[0_0_8px_rgba(217,166,182,0.85)]" />
                </span>
              </span>
            ))}
          </div>

          {/* Track 2: Identical twin set moving seamlessly behind Track 1 */}
          <div className="vb-marquee-track-unit" aria-hidden="true">
            {trackItems.map((msg, idx) => (
              <span
                key={`t2-${idx}`}
                dir="rtl"
                className="flex items-center text-xs sm:text-[13px] font-medium tracking-wide"
              >
                <span className="inline-block px-3 sm:px-5">
                  {renderMessageContent(msg)}
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center px-1 select-none"
                >
                  <span className="size-1.5 rounded-full bg-[#D9A6B6] shadow-[0_0_8px_rgba(217,166,182,0.85)]" />
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
