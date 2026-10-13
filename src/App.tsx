import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageFace from "./components/ImageFace.tsx";
import { usePoll, type Choice } from "./hooks/usePoll";

const KEY = "gyanu-poll-voted";
const read = () => {
  try {
    return localStorage.getItem(KEY) as Choice | null;
  } catch {
    return null;
  }
};

export default function App() {
  const { counts, loading, vote } = usePoll();
  const [voted, setVoted] = useState<Choice | null>(read());
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  // Track which button was just clicked for the burst effect
  const [burst, setBurst] = useState<Choice | null>(null);

  const total = counts.resign + counts.stay;
  const yes = total ? Math.round((counts.resign / total) * 100) : 0;
  const no = total ? 100 - yes : 0;

  const cast = async (c: Choice) => {
    if (voted) return;

    // trigger burst animation immediately
    setBurst(c);
    window.setTimeout(() => setBurst(null), 900);

    if (await vote(c)) {
      setVoted(c);
      setError(false);
      try {
        localStorage.setItem(KEY, c);
      } catch {
        /* ignore */
      }
    } else {
      setError(true);
      setBurst(null);
    }
  };

  const bonk = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 250);
  };

  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: "Should Gyanu resign?",
          text: "Vote in this satirical poll",
          url: location.href,
        });
      else {
        await navigator.clipboard.writeText(location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <main
      className={`mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center px-3 py-6 sm:px-4 sm:py-10 ${
        shake ? "shake" : ""
      }`}
    >
      {/* TITLE */}
      <div className="relative w-full">
        <span className="absolute -top-3 left-6 h-6 w-16 rotate-[-12deg] bg-white/50" />
        <span className="absolute -top-3 right-6 h-6 w-16 rotate-[10deg] bg-white/50" />
        <h1 className="mx-auto max-w-full rotate-[-2deg] bg-card px-4 py-3 text-center font-display text-2xl leading-tight text-shell shadow-[6px_6px_0_#ff3ea5] sm:px-6 sm:py-4 sm:text-4xl md:text-6xl">
          Should Gyanu resign?
        </h1>
      </div>

      <p className="mt-4 max-w-md px-2 text-center text-base sm:mt-6 sm:text-lg">
        Vote, watch the live results, then give a bonk.
      </p>

      {/* FACE + RAYS */}
      <div className="relative my-4 flex w-full items-center justify-center sm:my-6">
        <div
          className="rays pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "min(90vw, 34rem)",
            height: "min(90vw, 34rem)",
          }}
          aria-hidden
        />
        <div className="relative flex items-center justify-center">
          <ImageFace onSmash={bonk} />
        </div>
      </div>

      {/* SHARE */}
      <div className="mb-6 flex w-full justify-center sm:mb-8">
        <button
          onClick={share}
          aria-label={copied ? "Link copied" : "Share this poll"}
          className="group relative flex items-center gap-2 overflow-hidden rounded-full border-2 border-white/80 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white hover:text-shell hover:shadow-[0_0_0_4px_rgba(255,255,255,0.15)] active:scale-95 sm:px-6 sm:py-3 sm:text-base"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-4 w-4 transition-transform duration-300 sm:h-5 sm:w-5 ${
              copied ? "scale-110" : "group-hover:-rotate-12"
            }`}
          >
            {copied ? (
              <polyline points="20 6 9 17 4 12" />
            ) : (
              <>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </>
            )}
          </svg>
          <span className="relative">
            <span
              className={`block transition-all duration-300 ${
                copied
                  ? "-translate-y-2 opacity-0"
                  : "translate-y-0 opacity-100"
              }`}
            >
              Share this poll
            </span>
            <span
              className={`absolute inset-0 block transition-all duration-300 ${
                copied ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              Link copied!
            </span>
          </span>
        </button>
      </div>

      {/* VOTE BUTTONS */}
      <section className="w-full">
        <h2 className="mb-3 text-center font-display text-xl sm:text-2xl">
          {voted ? "Thanks, your vote is counted!" : "Cast your vote"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* RESIGN BUTTON */}
          <VoteButton
            onClick={() => cast("resign")}
            disabled={!!voted}
            side="yes"
            burst={burst === "resign"}
          >
            Yes, he should resign
          </VoteButton>

          {/* STAY BUTTON */}
          <VoteButton
            onClick={() => cast("stay")}
            disabled={!!voted}
            side="no"
            burst={burst === "stay"}
          >
            No, he should stay
          </VoteButton>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-center text-hot">
            Your vote could not be sent. Please check your internet and try
            again.
          </p>
        )}
      </section>

      {/* LIVE RESULTS */}
      <section
        aria-live="polite"
        className="order-1 mt-8 w-full border-4 border-white/80 bg-black/30 p-4 sm:p-5 md:order-first md:mb-8 md:mt-0"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg sm:text-xl">Live results</h2>
          <span className="flex items-center gap-2 text-xs font-bold sm:text-sm">
            <span className="live-dot h-3 w-3 rounded-full bg-red-500" />
            LIVE
          </span>
        </div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-4xl text-hot sm:text-5xl">{yes}%</p>
            <p className="text-sm font-bold sm:text-base">Want him to resign</p>
            <p className="text-xs opacity-80 sm:text-sm">
              {counts.resign.toLocaleString("en-IN")} votes
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl text-sun sm:text-5xl">{no}%</p>
            <p className="text-sm font-bold sm:text-base">Want him to stay</p>
            <p className="text-xs opacity-80 sm:text-sm">
              {counts.stay.toLocaleString("en-IN")} votes
            </p>
          </div>
        </div>
        <div className="flex h-6 overflow-hidden bg-white/15 sm:h-8">
          <div
            className="bg-hot transition-all duration-700"
            style={{ width: `${yes}%` }}
          />
          <div
            className="bg-sun transition-all duration-700"
            style={{ width: `${no}%` }}
          />
        </div>
        <p className="mt-3 text-center text-xs opacity-80 sm:text-sm">
          {loading
            ? "Loading votes..."
            : `${total.toLocaleString("en-IN")} total votes`}
        </p>
      </section>

      {/* FOOTER */}
      <footer className="order-3 mt-10 max-w-md px-2 text-center text-xs opacity-70">
        created By @404ishy <br />
        [One vote per browser]
      </footer>
    </main>
  );
}

/* ─── VoteButton with pop-out animation ─────────────────────────────── */
function VoteButton({
  onClick,
  disabled,
  side,
  burst,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  side: "yes" | "no";
  burst: boolean;
  children: React.ReactNode;
}) {
  const isYes = side === "yes";
  const color = isYes ? "#ff3ea5" : "#ffd60a";
  const bg = isYes ? "bg-hot" : "bg-sun";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.04, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      animate={
        burst
          ? {
              scale: [1, 1.15, 0.95, 1.08, 1],
              rotate: [0, -3, 3, -2, 0],
            }
          : { scale: 1, rotate: 0 }
      }
      transition={{
        duration: burst ? 0.7 : 0.2,
        ease: "easeOut",
      }}
      className={`relative overflow-visible px-3 py-3 text-base font-bold text-shell shadow-[4px_4px_0_${color}] transition enabled:active:translate-x-1 enabled:active:translate-y-1 enabled:active:shadow-none sm:px-4 sm:py-4 sm:text-xl ${bg} ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <span className="relative z-10">{children}</span>

      {/* BURST — expanding ring + emoji rain */}
      <AnimatePresence>
        {burst && (
          <>
            {/* Expanding ring */}
            <motion.span
              key="ring"
              initial={{ opacity: 0.9, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-sm border-4"
              style={{ borderColor: color }}
            />

            {/* Emoji burst */}
            {["🎉", "✨", "💥", "⭐", "🎊"].map((emoji, i) => {
              const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
              const dist = 60 + Math.random() * 30;
              return (
                <motion.span
                  key={`emoji-${i}`}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    scale: [0, 1.3, 0.9],
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    rotate: (Math.random() - 0.5) * 90,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.75, ease: "easeOut" }}
                  className="pointer-events-none absolute left-1/2 top-1/2 z-20 text-2xl"
                  style={{ transform: "translate(-50%, -50%)" }}
                >
                  {emoji}
                </motion.span>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Success ring flash for voted state */}
      {disabled && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.9, 1.1, 1.3] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 rounded-sm ring-4"
          style={{ boxShadow: `0 0 0 4px ${color}` }}
        />
      )}
    </motion.button>
  );
}
