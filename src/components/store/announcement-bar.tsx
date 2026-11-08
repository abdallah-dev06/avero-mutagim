"use client";

import { AnimatePresence, motion } from "motion/react";
import * as React from "react";

export function AnnouncementBar({ messages }: { messages: string[] }) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  React.useEffect(() => {
    if (messages.length < 2 || paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % messages.length), 4200);
    return () => clearInterval(t);
  }, [messages.length, paused]);
  if (!messages.length) return null;
  return (
    <div
      className="relative z-40 bg-burgundy text-ivory"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="pt-safe" />
      <div className="container-lux relative flex h-9 items-center justify-center overflow-hidden text-center text-[0.8rem] font-medium tracking-wide sm:text-sm" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={i}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 truncate"
          >
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-gold/90" />
            {messages[i]}
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-gold/90" />
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
