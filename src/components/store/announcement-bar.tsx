"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function AnnouncementBar({
  messages,
  speed = "normal",
}: {
  messages: string[];
  speed?: "slow" | "normal" | "fast";
}) {
  if (!messages.length) return null;

  // Duration in seconds based on speed setting
  const durationMap = {
    slow: "45s",
    normal: "32s",
    fast: "20s",
  };
  const duration = durationMap[speed] || "32s";

  // Format message text: highlight VETRINA BOUTIQUE with Playfair Display and luxury styling
  const renderMessageText = (text: string) => {
    if (text.includes("VETRINA BOUTIQUE")) {
      const parts = text.split("VETRINA BOUTIQUE");
      return (
        <span>
          {parts[0]}
          <span className="latin font-display font-semibold tracking-wider text-[#D9A6B6]">
            VETRINA BOUTIQUE
          </span>
          {parts[1]}
        </span>
      );
    }
    return <span>{text}</span>;
  };

  return (
    <div
      role="region"
      aria-label="إعلانات المتجر"
      className="group relative z-40 overflow-hidden border-b border-[#3f1a2b] bg-[#4B1F34] text-[#F9F6F4]"
    >
      <div className="pt-safe" />
      <div className="relative flex h-9 sm:h-10 items-center overflow-hidden">
        {/* Infinite marquee track containing duplicated sets for seamless continuous looping */}
        <div
          className="flex w-max items-center whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto"
          style={{
            animation: `marquee-announcement ${duration} linear infinite`,
          }}
        >
          {/* First set */}
          <div className="flex items-center shrink-0">
            {messages.map((msg, idx) => (
              <span key={`a-${idx}`} className="flex items-center text-xs sm:text-[13px] font-medium tracking-wide">
                <span className="inline-block px-3 sm:px-5">{renderMessageText(msg)}</span>
                <span
                  aria-hidden
                  className="inline-block size-1.5 rounded-full bg-[#8B4B65] shadow-[0_0_6px_rgba(139,75,101,0.7)]"
                />
              </span>
            ))}
          </div>

          {/* Second duplicate set for perfectly seamless gap-free infinite streaming */}
          <div className="flex items-center shrink-0" aria-hidden>
            {messages.map((msg, idx) => (
              <span key={`b-${idx}`} className="flex items-center text-xs sm:text-[13px] font-medium tracking-wide">
                <span className="inline-block px-3 sm:px-5">{renderMessageText(msg)}</span>
                <span
                  aria-hidden
                  className="inline-block size-1.5 rounded-full bg-[#8B4B65] shadow-[0_0_6px_rgba(139,75,101,0.7)]"
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
