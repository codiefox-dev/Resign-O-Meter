"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const POP = ["🎉", "🎈", "🤡", "✨", "🥳", "😂", "🤪", "💥"];
const RESET_MS = 4000;

type Mood = "idle" | "happy" | "angry" | "smash";

// Fixed pixel size — same on every device
const FACE_SIZE = 320; // px

/* ─────────────────────────────────────────────────────────────
   TUNE THESE — percentages of the face (0..100)
   Click "show grid" to read off positions from the 10×10 grid.
   size = width of the element as % of FACE_SIZE
   ───────────────────────────────────────────────────────────── */
const EYES = {
  left: { x: 49, y: 27, size: 7 }, // ← size adjusts this eye's width
  right: { x: 63, y: 30, size: 7 },
};
const MOUTH = { x: 45, y: 40 };
const TONGUE = { w: 45, h: 65 }; // ← px — width & height of tongue
const EARS = {
  left: { x: 35, y: 26, size: 15 }, // ← size adjusts ear width
  right: { x: 70, y: 35, size: 15 },
};

/* ─────────────────────────────────────────────────────────────
   SPEECH BUBBLES — random lines that fly out on poke
   Add / edit these freely. One is picked per poke.
   ───────────────────────────────────────────────────────────── */
const SPEECH = [
  { text: "Bye bye!", emoji: "👋" },
  { text: "It's done bro!", emoji: "😎" },
  { text: "Go Gyanu!", emoji: "🔥" },
  { text: "Resign already!", emoji: "📜" },
  { text: "Oh ho ho!", emoji: "😱" },
  { text: "Not again!", emoji: "😩" },
  { text: "Bhai bhai bhai!", emoji: "😂" },
];

function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ensure = () => {
    if (!ctxRef.current) {
      const AC =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AC) ctxRef.current = new AC();
    }
    return ctxRef.current;
  };

  const boing = useCallback(() => {
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.32);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }, []);

  const crash = useCallback(() => {
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
  }, []);

  const ding = useCallback(() => {
    const ctx = ensure();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }, []);

  return { boing, crash, ding };
}

type SpeechPop = {
  id: number;
  text: string;
  emoji: string;
  // position + direction
  x: number; // starting x% of face
  y: number; // starting y% of face
  side: "left" | "right" | "top" | "bottom";
  rotate: number;
};

export default function ImageFace({ onSmash }: { onSmash?: () => void }) {
  const [hits, setHits] = useState(0);
  const [total, setTotal] = useState(0);
  const [mood, setMood] = useState<Mood>("idle");
  const [pops, setPops] = useState<{ id: number; e: string; x: number }[]>([]);
  const [speech, setSpeech] = useState<SpeechPop[]>([]);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);
  const [tongue, setTongue] = useState(false);
  const [extraEyes, setExtraEyes] = useState(false);

  const box = useRef<HTMLDivElement>(null);
  const resetTimer = useRef<number | undefined>(undefined);
  const popId = useRef(0);
  const speechId = useRef(0);
  const sound = useSound();

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 200) * 5;
      setLook({ x: (dx / d) * k, y: (dy / d) * k });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    let t: number;
    const loop = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 140);
      t = window.setTimeout(loop, 2000 + Math.random() * 3000);
    };
    t = window.setTimeout(loop, 1500);
    return () => window.clearTimeout(t);
  }, []);

  const poke = useCallback(() => {
    const next = hits + 1;
    setHits(next);
    setTotal((t) => t + 1);

    if (next >= 5) sound.crash();
    else sound.boing();

    if (next >= 5) setMood("smash");
    else if (next >= 3) setMood("angry");
    else setMood("happy");

    if (next >= 3) setTongue(true);
    if (next % 4 === 0) setExtraEyes(true);

    // Emoji pop
    const id = popId.current++;
    const emoji = POP[Math.floor(Math.random() * POP.length)];
    const x = 10 + Math.random() * 75;
    setPops((p) => [...p.slice(-4), { id, e: emoji, x }]);
    window.setTimeout(() => {
      setPops((p) => p.filter((pop) => pop.id !== id));
    }, 850);

    // ── Speech bubble ────────────────────────────────────────────────────
    const line = SPEECH[Math.floor(Math.random() * SPEECH.length)];
    const sides: SpeechPop["side"][] = ["left", "right", "top", "bottom"];
    const chosenSide = sides[Math.floor(Math.random() * sides.length)];

    // Starting position on the face (near the mouth area)
    const startX = 45 + Math.random() * 15;
    const startY = 45 + Math.random() * 15;

    const speechPop: SpeechPop = {
      id: speechId.current++,
      text: line.text,
      emoji: line.emoji,
      x: startX,
      y: startY,
      side: chosenSide,
      rotate: (Math.random() - 0.5) * 12, // -6 to +6 deg
    };

    setSpeech((s) => [...s.slice(-2), speechPop]); // keep max 3 at once

    window.setTimeout(() => {
      setSpeech((s) => s.filter((sp) => sp.id !== speechPop.id));
    }, 1800);

    onSmash?.();

    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setHits(0);
      setMood("idle");
      setTongue(false);
      setExtraEyes(false);
      sound.ding();
    }, RESET_MS);
  }, [hits, onSmash, sound]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const wrapperAnimate =
    mood === "smash"
      ? {
          rotate: [0, -8, 8, -6, 6, 0],
          scaleX: [1, 1.14, 0.9, 1.06, 1],
          scaleY: [1, 0.88, 1.14, 0.96, 1],
          x: [0, -6, 6, -4, 4, 0],
          y: [0, -4, 0, -3, 0],
        }
      : mood === "angry"
        ? { rotate: [0, -4, 4, -3, 3, 0], x: [0, -4, 4, -2, 2, 0] }
        : mood === "happy"
          ? { rotate: [0, -2, 2, 0], scale: [1, 1.05, 1], y: [0, -4, 0] }
          : { rotate: [0, -1.5, 1.5, 0] };

  const wrapperDuration =
    mood === "smash" ? 0.45 : mood === "idle" ? 3.6 : 0.55;
  const squeezeKey = hits;

  return (
    <div
      className="relative select-none"
      style={{
        width: FACE_SIZE,
        height: FACE_SIZE + 60,
        background: "transparent",
      }}
    >
      <div
        className="relative"
        style={{
          width: FACE_SIZE,
          height: FACE_SIZE,
          background: "transparent",
        }}
      >
        {/* Emoji pops */}
        <AnimatePresence>
          {pops.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -90, scale: 1.6, rotate: 20 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="pointer-events-none absolute z-40 text-4xl drop-shadow-lg"
              style={{ left: `${p.x}%`, top: 40 }}
            >
              {p.e}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* ── SPEECH BUBBLES ─────────────────────────────────────────── */}
        <AnimatePresence>
          {speech.map((s) => {
            // Determine the fly-out direction
            const dir =
              s.side === "left"
                ? { x: -140, y: -40, rotate: -12 }
                : s.side === "right"
                  ? { x: 140, y: -40, rotate: 12 }
                  : s.side === "top"
                    ? { x: 0, y: -120, rotate: s.rotate }
                    : { x: 0, y: 100, rotate: s.rotate };

            return (
              <motion.div
                key={s.id}
                initial={{
                  opacity: 0,
                  scale: 0.3,
                  x: 0,
                  y: 0,
                  rotate: 0,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: dir.x,
                  y: dir.y,
                  rotate: dir.rotate,
                }}
                exit={{
                  opacity: 0,
                  scale: 1.4,
                  y: dir.y - 30,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 18,
                  opacity: { duration: 1.6 },
                }}
                className="pointer-events-none absolute z-[60] whitespace-nowrap"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="relative">
                  {/* Speech bubble body */}
                  <div
                    className="rounded-2xl border-[3px] border-black bg-white px-3 py-1.5 font-display text-lg font-black tracking-tight text-black shadow-[4px_4px_0_#000] sm:px-4 sm:py-2 sm:text-2xl"
                    style={{
                      textShadow: "1px 1px 0 rgba(255,255,255,0.9)",
                    }}
                  >
                    <span className="mr-1">{s.emoji}</span>
                    <span>{s.text}</span>
                  </div>

                  {/* Little tail */}
                  <div
                    className="absolute h-3 w-3 rotate-45 border-b-[3px] border-l-[3px] border-black bg-white"
                    style={{
                      bottom: -7,
                      left: s.side === "right" ? "20%" : "50%",
                      transform: "translateX(-50%) rotate(-135deg)",
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* SMASH badge */}
        <AnimatePresence>
          {mood === "smash" && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg"
            >
              🔥 SMASH MODE
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CLICK ME / BONK ME indicator (no background) ────────────── */}
        <motion.div
          className="pointer-events-none absolute -top-2 left-1/2 z-[70] -translate-x-1/2"
          animate={{
            y: [0, -6, 0],
            rotate: [-4, 4, -4],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative flex items-center gap-1 font-display text-sm font-black tracking-tight text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.9)] sm:text-base"
          >
            <span className="text-base sm:text-lg">👆</span>
            <span>BONK ME!</span>
          </motion.div>
        </motion.div>

        <button
          onClick={poke}
          aria-label="Poke Gyanu"
          className="relative block h-full w-full cursor-pointer transition-transform active:scale-95 focus-visible:outline-4 focus-visible:outline-yellow-400"
          style={{ background: "transparent" }}
        >
          {/* Pendulum wrapper */}
          <motion.div
            animate={wrapperAnimate}
            transition={{
              duration: wrapperDuration,
              repeat: mood === "idle" ? Infinity : 0,
              ease: "easeInOut",
            }}
            style={{
              originY: 1,
              width: FACE_SIZE,
              height: FACE_SIZE,
              background: "transparent",
            }}
          >
            {/* Squeeze pulse */}
            <motion.div
              key={squeezeKey}
              animate={{
                scaleX: [1, 1.06, 0.97, 1],
                scaleY: [1, 0.94, 1.04, 1],
              }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="relative overflow-hidden rounded-full"
              style={{
                width: FACE_SIZE,
                height: FACE_SIZE,
                background: "transparent",
              }}
            >
              {/* PHOTO */}
              <img
                src="/gy.png"
                alt="Gyanu"
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover object-[center_25%]"
              />

              {/* EARS */}
              <Ear
                cx={EARS.left.x}
                cy={EARS.left.y}
                size={EARS.left.size}
                side="left"
              />
              <Ear
                cx={EARS.right.x}
                cy={EARS.right.y}
                size={EARS.right.size}
                side="right"
              />

              {/* GOOGLY EYES */}
              <GooglyEye
                cx={EYES.left.x}
                cy={EYES.left.y}
                look={look}
                blink={blink}
                size={EYES.left.size}
              />
              <GooglyEye
                cx={EYES.right.x}
                cy={EYES.right.y}
                look={look}
                blink={blink}
                size={EYES.right.size}
              />

              {/* Extra eyes */}
              {extraEyes && (
                <>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="pointer-events-none absolute"
                    style={{
                      left: `${EYES.left.x - 12}%`,
                      top: `${EYES.left.y + 10}%`,
                    }}
                  >
                    <span className="text-3xl">👁️</span>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="pointer-events-none absolute"
                    style={{
                      right: `${100 - EYES.right.x - 12}%`,
                      top: `${EYES.right.y + 12}%`,
                    }}
                  >
                    <span className="text-3xl">👁️</span>
                  </motion.div>
                </>
              )}

              {/* TONGUE */}
              <AnimatePresence>
                {tongue && (
                  <motion.div
                    initial={{ y: -20, opacity: 0, scaleY: 0 }}
                    animate={{ y: 0, opacity: 1, scaleY: 1 }}
                    exit={{ y: -20, opacity: 0, scaleY: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="pointer-events-none absolute"
                    style={{
                      left: `${MOUTH.x}%`,
                      top: `${MOUTH.y + 2}%`,
                      transform: "translate(-50%, 0)",
                      transformOrigin: "top center",
                    }}
                  >
                    <svg
                      width={TONGUE.w}
                      height={TONGUE.h}
                      viewBox="0 0 40 60"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M 10 0 Q 10 30 20 55 Q 30 30 30 0 Z"
                        fill="#e85b6b"
                        stroke="#a03040"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="20"
                        y1="6"
                        x2="20"
                        y2="42"
                        stroke="#a03040"
                        strokeWidth="1.2"
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Red vignette */}
              <AnimatePresence>
                {(mood === "smash" || mood === "angry") && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: mood === "smash" ? [0.15, 0.35, 0.15] : 0.15,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: mood === "smash" ? 0.6 : 0.3,
                      repeat: mood === "smash" ? Infinity : 0,
                    }}
                    className="pointer-events-none absolute inset-0 z-20"
                    style={{
                      background:
                        "radial-gradient(circle at center, transparent 35%, rgba(220,38,38,0.85) 100%)",
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </button>
      </div>

      <p
        className="mt-2 text-center text-sm opacity-80"
        style={{ width: FACE_SIZE }}
      >
        Total pokes: {total}
        {mood === "angry" && " 😠"}
        {mood === "smash" && " 🤬"}
        {mood === "happy" && " 😄"}
      </p>
    </div>
  );
}

/* ─── GooglyEye ─────────────────────────────────────────────────────── */
function GooglyEye({
  cx,
  cy,
  look,
  blink,
  size = 14,
}: {
  cx: number;
  cy: number;
  look: { x: number; y: number };
  blink: boolean;
  size?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${cx}%`,
        top: `${cy}%`,
        width: `${size}%`,
        height: `${size}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <motion.div
        className="grid h-full w-full place-items-center rounded-full bg-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.25)]"
        animate={{ scaleY: blink ? 0.08 : 1 }}
        transition={{ duration: 0.12 }}
      >
        <div
          className="rounded-full bg-black"
          style={{
            width: "52%",
            height: "52%",
            transform: `translate(${look.x}px, ${look.y}px)`,
            transition: "transform 0.08s ease-out",
          }}
        />
      </motion.div>
    </div>
  );
}

/* ─── Ear ───────────────────────────────────────────────────────────── */
function Ear({
  cx,
  cy,
  size,
  side,
}: {
  cx: number;
  cy: number;
  size: number;
  side: "left" | "right";
}) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${cx}%`,
        top: `${cy}%`,
        width: `${size}%`,
        height: `${size * 1.15}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 1, // behind the googly eyes
      }}
    >
      <svg
        viewBox="0 0 40 46"
        className="h-full w-full"
        style={{
          transform: side === "right" ? "scaleX(-1)" : undefined,
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.2))",
        }}
      >
        {/* Outer ear */}
        <path
          d="M 8 8 Q 2 20 8 36 Q 16 46 26 40 Q 34 32 32 20 Q 28 6 16 6 Q 10 6 8 8 Z"
          fill="#d9a273"
          stroke="#8a5a35"
          strokeWidth="1.5"
        />
        {/* Inner ear fold */}
        <path
          d="M 14 14 Q 10 22 14 32 Q 20 38 26 34 Q 30 28 28 20 Q 24 12 18 12 Q 15 12 14 14 Z"
          fill="#c48a5e"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}