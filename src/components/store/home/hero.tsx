"use client";

import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { WordsReveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import type { SiteSettings } from "@/lib/settings-schema";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const WAVE_A = [
  "M0 120 C 180 40 360 40 540 110 S 900 190 1080 110 S 1300 40 1440 90 L1440 260 L0 260 Z",
  "M0 100 C 200 160 380 30 560 90 S 880 150 1080 70 S 1320 120 1440 60 L1440 260 L0 260 Z",
];
const WAVE_B = [
  "M0 170 C 240 110 420 200 640 150 S 1000 90 1200 160 S 1380 190 1440 150 L1440 260 L0 260 Z",
  "M0 150 C 220 200 460 120 660 170 S 980 210 1180 130 S 1380 120 1440 170 L1440 260 L0 260 Z",
];

function Silk() {
  const reduce = useReducedMotion();
  const loop = (frames: string[], duration: number) =>
    reduce ? { d: frames[0] } : { d: frames, transition: { duration, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const } };
  return (
    <svg aria-hidden viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[22vh] min-h-28 w-full md:h-[30vh]">
      <defs>
        <linearGradient id="silk-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16604B" stopOpacity=".55" />
          <stop offset="1" stopColor="#0B4D3B" stopOpacity=".85" />
        </linearGradient>
        <linearGradient id="silk-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16604B" />
          <stop offset=".55" stopColor="#0B4D3B" />
          <stop offset="1" stopColor="#06281F" />
        </linearGradient>
        <linearGradient id="silk-line" x1="0" x2="1">
          <stop offset="0" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset=".5" stopColor="#D4AF37" stopOpacity=".9" />
          <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path fill="url(#silk-a)" initial={{ d: WAVE_A[0] }} animate={loop(WAVE_A, 9)} />
      <motion.path fill="url(#silk-b)" initial={{ d: WAVE_B[0] }} animate={loop(WAVE_B, 11)} />
      <motion.path fill="none" stroke="url(#silk-line)" strokeWidth="2" initial={{ d: WAVE_B[0], pathLength: 0 }} animate={{ ...loop(WAVE_B, 11), pathLength: 1 }} />
    </svg>
  );
}

function Emblem({ size }: { size: string }) {
  return (
    <div className={cn("relative aspect-square", size)}>
      {/* rotating engraved ring */}
      <svg viewBox="0 0 300 300" className="absolute inset-0 size-full animate-spin-slow motion-reduce:animate-none" aria-hidden>
        <defs>
          <path id="ring" d="M150 150 m -128 0 a 128 128 0 1 1 256 0 a 128 128 0 1 1 -256 0" />
        </defs>
        <circle cx="150" cy="150" r="146" fill="none" stroke="#D4AF37" strokeOpacity=".55" strokeWidth="1" />
        <circle cx="150" cy="150" r="112" fill="none" stroke="#D4AF37" strokeOpacity=".35" strokeWidth=".8" />
        <text fill="#0B4D3B" fontSize="12" letterSpacing="5.8" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
          <textPath href="#ring">AVERO • MUTAGIM • MEN'S FASHION • AVERO • MUTAGIM •</textPath>
        </text>
      </svg>
      <motion.div
        initial={{ scale: 0.92, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.4, ease: EASE }}
        className="absolute inset-[17%] overflow-hidden rounded-full shadow-[0_30px_60px_-25px_rgb(11_77_59/0.55)] ring-1 ring-gold/50"
      >
        <Image src="/brand/logo.webp" alt="شعار AVERO MUTAGIM" fill priority sizes="(min-width:1024px) 360px, 60vw" className="scale-[1.08] object-cover" />
      </motion.div>
    </div>
  );
}

export function Hero({ hero }: { hero: SiteSettings["hero"] }) {
  const ref = React.useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const visualY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 140]);
  const visualScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1, 0.86]);
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -60]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  return (
    <section ref={ref} className="grain relative isolate overflow-hidden bg-gradient-to-b from-blush via-[#f7f2e8] to-ivory" aria-labelledby="hero-title">
      {/* soft light blooms */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 -right-20 size-96 rounded-full bg-dusty/30 blur-3xl" />

      <div className="container-lux relative grid min-h-[calc(100svh-7.5rem)] items-center gap-6 pb-[24vh] pt-8 md:pb-[30vh] lg:min-h-[min(calc(100svh-7.5rem),900px)] lg:grid-cols-2 lg:gap-12 lg:pt-4">
        <motion.div style={{ y: visualY, scale: visualScale, opacity: fade }} className="order-1 flex justify-center lg:order-2">
          {hero.videoUrl ? (
            <div className="relative w-[min(78vw,430px)]">
              <motion.div
                initial={{ clipPath: "inset(100% 0 0 0 round 999px 999px 24px 24px)" }}
                animate={{ clipPath: "inset(0% 0 0 0 round 999px 999px 24px 24px)" }}
                transition={{ duration: 1.5, ease: EASE }}
                className="relative aspect-[3/4] overflow-hidden rounded-t-[140px] rounded-b-[24px] border border-gold/40 shadow-[0_25px_60px_-15px_rgba(11,77,59,0.35)]"
              >
                <video autoPlay loop muted playsInline className="size-full object-cover">
                  <source src={hero.videoUrl} type="video/mp4" />
                </video>
              </motion.div>
              <div className="absolute -bottom-8 -left-6 w-28 sm:w-36">
                <Emblem size="w-full" />
              </div>
            </div>
          ) : hero.imageUrl ? (
            <div className="relative w-[min(78vw,430px)]">
              <motion.div
                initial={{ clipPath: "inset(100% 0 0 0 round 999px 999px 24px 24px)" }}
                animate={{ clipPath: "inset(0% 0 0 0 round 999px 999px 24px 24px)" }}
                transition={{ duration: 1.5, ease: EASE }}
                className="relative aspect-[3/4] overflow-hidden"
              >
                <Image src={hero.imageUrl} alt={hero.imageAlt || hero.title} fill priority sizes="(min-width:1024px) 430px, 78vw" className="object-cover" />
              </motion.div>
              <div className="absolute -bottom-8 -left-6 w-28 sm:w-36">
                <Emblem size="w-full" />
              </div>
            </div>
          ) : (
            <Emblem size="w-[min(68vw,300px)] sm:w-[340px] lg:w-[440px]" />
          )}
        </motion.div>

        <motion.div style={{ y: textY, opacity: fade }} className="order-2 text-center lg:order-1 lg:text-start">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
            className="text-xs font-medium tracking-[0.3em] text-mauve sm:text-sm"
          >
            {hero.eyebrow}
          </motion.p>
          <h1 id="hero-title" className="mt-4 text-[2.35rem] font-medium leading-[1.15] text-burgundy min-[390px]:text-[2.6rem] sm:text-6xl lg:text-[4.4rem]">
            <WordsReveal text={hero.title} delay={0.35} />
          </h1>
          {hero.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.75 }}
              className="mx-auto mt-5 max-w-md text-[1.02rem] leading-relaxed text-muted sm:text-lg lg:mx-0"
            >
              {hero.subtitle}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.95 }}
            className="mt-8 flex flex-col items-stretch gap-3 min-[390px]:flex-row min-[390px]:justify-center lg:justify-start"
          >
            <Link href={hero.primaryCta.href} className={cn(buttonVariants({ size: "lg" }), "group")}>
              {hero.primaryCta.label}
              <ArrowLeft className="transition-transform duration-500 group-hover:-translate-x-1" />
            </Link>
            <Link href={hero.secondaryCta.href} className={buttonVariants({ size: "lg", variant: "secondary" })}>
              {hero.secondaryCta.label}
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <Silk />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.4em] text-ivory/80 md:flex"
      >
        <span className="latin">SCROLL</span>
        <motion.span animate={reduce ? {} : { y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="block h-8 w-px bg-ivory/70" />
      </motion.div>
    </section>
  );
}
