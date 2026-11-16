import { Link } from "react-router-dom";

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="cv-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C5CFC" />
          <stop offset="1" stopColor="#00D4FF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0B1020" />
      <circle
        cx="32"
        cy="32"
        r="18"
        fill="none"
        stroke="url(#cv-logo-g)"
        strokeWidth="4"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="9"
        fill="none"
        stroke="#00D4FF"
        strokeWidth="3"
        transform="rotate(-25 32 32)"
      />
      <path
        d="M27 26l-6 6 6 6M37 26l6 6-6 6"
        fill="none"
        stroke="#F8FAFC"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 font-extrabold tracking-tight text-fg no-underline"
      aria-label="CODEVERSE"
    >
      <LogoMark />
      <span className="text-lg">
        CODE<span className="gradient-text">VERSE</span>
      </span>
    </Link>
  );
}
