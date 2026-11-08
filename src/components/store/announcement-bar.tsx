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
    slow: "48s",
    normal: "32s",
    fast: "20s",
  };
  const duration = durationMap[speed] || "32s";

  // Repeat items inside each track half to guarantee zero gaps on large monitors (up to 4K 3840px)
  const trackItems = [...cleanMessages, ...cleanMessages];

  // Helper to render luxury highlighted message text
  const renderMessageContent = (text: string) => {
    let content = text;
    let hasLeadingDiamond = false;

    if (content.startsWith("✦")) {
      hasLeadingDiamond = true;
      content = content.replace(/^✦\s*/, "");
    }

    if (content.includes("VETRINA BOUTIQUE")) {
      const parts = content.split("VETRINA BOUTIQUE");
      return (
        <span className="inline-flex items-center gap-1.5">
          {hasLeadingDiamond && (
            <span className="text-[#D9A6B6] text-xs select-none">✦</span>
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
        {hasLeadingDiamond && (
          <span className="text-[#D9A6B6] text-xs select-none">✦</span>
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
      {/* Self-contained, guaranteed keyframe animation style */}
      <style>{`
        @keyframes vb-marquee-flow {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .vb-marquee-active {
          display: flex !important;
          width: max-content !important;
          will-change: transform;
          animation: vb-marquee-flow ${duration} linear infinite !important;
        }
        .vb-marquee-active:hover,
        .vb-marquee-active:active {
          animation-play-state: paused !important;
        }
      `}</style>

      <div className="pt-safe" />
      <div className="relative flex h-9 sm:h-10 items-center overflow-hidden">
        {/* Infinite streaming marquee track (hardware accelerated translate3d) */}
        <div
          dir="ltr"
          className="vb-marquee-track vb-marquee-active flex w-max items-center whitespace-nowrap"
          style={{
            animation: `vb-marquee-flow ${duration} linear infinite`,
          }}
        >
          {/* Track 1: First complete set */}
          <div className="flex shrink-0 items-center">
            {trackItems.map((msg, idx) => (
              <span
                key={`track1-${idx}`}
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

          {/* Track 2: Identical second set for seamless, mathematically perfect gap-free looping */}
          <div className="flex shrink-0 items-center" aria-hidden="true">
            {trackItems.map((msg, idx) => (
              <span
                key={`track2-${idx}`}
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
