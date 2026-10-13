import { useEffect, useRef, useState } from "react";

const WORDS = ["BONK!", "OOF!", "WHACK!", "POW!", "OUCH!"];
const LINES = [
  "Psst... click my face!",
  "Ouch!",
  "Hey, careful!",
  "Seriously?!",
  "I see stars...",
  "My glasses!",
  "Okay, that is enough!",
];
const MALLET = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><text y='38' font-size='38'>🔨</text></svg>")}") 6 6, pointer`;

// Cartoon placeholder. To use your own picture, replace the <svg> below with <img src="..." />.
export default function Face({ onSmash }: { onSmash?: () => void }) {
  const [hits, setHits] = useState(0);
  const [total, setTotal] = useState(0);
  const [anim, setAnim] = useState(0);
  const [words, setWords] = useState<{ id: number; t: string; x: number }[]>(
    [],
  );
  const [look, setLook] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // Eyes follow the mouse / finger
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = svgRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 200) * 8;
      setLook({ x: (dx / d) * k, y: (dy / d) * k });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  const smash = () => {
    setHits((h) => h + 1);
    setTotal((t) => t + 1);
    setAnim((a) => a + 1);
    const id = Date.now();
    setWords((w) => [
      ...w.slice(-3),
      {
        id,
        t: WORDS[Math.floor(Math.random() * WORDS.length)],
        x: 15 + Math.random() * 65,
      },
    ]);
    onSmash?.();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHits(0), 3500);
  };

  return (
    <div className="relative mx-auto w-72 select-none sm:w-96">
      <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-4 py-2 text-sm font-bold text-shell shadow-[3px_3px_0_#ff3ea5]">
        {LINES[Math.min(hits, 6)]}
      </div>
      {words.map((w) => (
        <span
          key={w.id}
          className="bonk pointer-events-none absolute top-16 z-10 font-display text-3xl text-sun drop-shadow-[2px_2px_0_#ff3ea5]"
          style={{ left: `${w.x}%` }}
        >
          {w.t}
        </span>
      ))}
      <div className="face-idle pt-8">
        <button
          onClick={smash}
          aria-label="Bonk the face"
          style={{ cursor: MALLET }}
          className="block w-full focus-visible:outline-4 focus-visible:outline-sun"
        >
          <svg
            ref={svgRef}
            key={anim}
            viewBox="0 0 300 300"
            className={anim ? "face-hit" : ""}
          >
            <circle cx="40" cy="160" r="22" fill="#e9a972" />
            <circle cx="260" cy="160" r="22" fill="#e9a972" />
            <circle
              cx="150"
              cy="150"
              r="120"
              fill="#f2b987"
              stroke="#3b1f14"
              strokeWidth="6"
            />
            <path
              d="M45 105 q-20 -45 25 -55 M255 105 q20 -45 -25 -55"
              stroke="#ddd"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
            />
            {hits >= 2 && (
              <g stroke="#3b1f14" strokeWidth="4">
                <circle cx="105" cy="50" r="17" fill="#ff7a7a" />
                <circle cx="99" cy="44" r="4" fill="#fff" stroke="none" />
              </g>
            )}
            {hits >= 4 && (
              <g stroke="#3b1f14" strokeWidth="4">
                <circle cx="205" cy="54" r="15" fill="#ff7a7a" />
                <circle cx="200" cy="48" r="4" fill="#fff" stroke="none" />
              </g>
            )}
            {/* eyes */}
            <circle cx="105" cy="130" r="30" fill="#fff" />
            <circle cx="195" cy="130" r="30" fill="#fff" />
            {hits > 0 ? (
              <g stroke="#3b1f14" strokeWidth="7" strokeLinecap="round">
                <path d="M90 115 l30 30 M120 115 l-30 30 M180 115 l30 30 M210 115 l-30 30" />
              </g>
            ) : (
              <g fill="#3b1f14">
                <circle
                  className="eye"
                  cx={105 + look.x}
                  cy={130 + look.y}
                  r="11"
                />
                <circle
                  className="eye"
                  cx={195 + look.x}
                  cy={130 + look.y}
                  r="11"
                />
              </g>
            )}
            {/* glasses (fall off after 5 bonks) */}
            <g
              key={hits >= 5 ? "off" : "on"}
              className={hits >= 5 ? "glasses-fall" : ""}
              fill="rgba(255,255,255,.25)"
              stroke="#3b1f14"
              strokeWidth="6"
            >
              <circle cx="105" cy="130" r="34" />
              <circle cx="195" cy="130" r="34" />
              <path
                d="M139 130 h22 M71 125 l-25 -8 M229 125 l25 -8"
                fill="none"
              />
            </g>
            <path d="M100 195 q50 -28 100 0 q-50 18 -100 0z" fill="#6b6b6b" />
            {hits === 0 && (
              <path
                d="M120 225 q30 22 60 0"
                stroke="#3b1f14"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
            )}
            {hits > 0 && hits < 3 && (
              <ellipse cx="150" cy="232" rx="18" ry="15" fill="#3b1f14" />
            )}
            {hits >= 3 && (
              <g>
                <ellipse cx="150" cy="232" rx="26" ry="18" fill="#3b1f14" />
                <ellipse cx="150" cy="242" rx="14" ry="9" fill="#ff6b8b" />
              </g>
            )}
            {hits > 0 && (
              <g
                className="orbit"
                fill="#ffd60a"
                stroke="#3b1f14"
                strokeWidth="3"
              >
                <path d="M60 40 l6 14 l15 2 l-11 10 l3 15 l-13 -8 l-13 8 l3 -15 l-11 -10 l15 -2z" />
                <path d="M255 60 l5 11 l12 1 l-9 8 l2 12 l-10 -6 l-10 6 l2 -12 l-9 -8 l12 -1z" />
              </g>
            )}
          </svg>
        </button>
      </div>
      <p className="mt-1 text-center text-sm opacity-80">
        Total bonks: {total}
      </p>
    </div>
  );
}
