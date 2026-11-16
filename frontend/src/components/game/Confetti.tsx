import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = [
  "#7C5CFC",
  "#00D4FF",
  "#22C55E",
  "#F59E0B",
  "#EC4899",
  "#F8FAFC",
];

/** Yengil konfetti (framer-motion), reduced-motion da CSS orqali o'chadi */
export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        dur: 1.6 + Math.random() * 1.4,
        rot: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    [count],
  );
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", rotate: p.rot, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
