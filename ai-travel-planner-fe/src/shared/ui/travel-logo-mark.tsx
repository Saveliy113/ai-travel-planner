type TravelLogoMarkProps = {
  className?: string
}

/**
 * Brand mark: gradient tile + wireframe globe (travel) + highlight node (assistant).
 */
export const TravelLogoMark = ({ className }: TravelLogoMarkProps) => {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="40"
      viewBox="0 0 40 40"
      width="40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="travel-logo-face"
          x1="6"
          x2="34"
          y1="4"
          y2="36"
        >
          <stop stopColor="#2563eb" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <rect
        fill="url(#travel-logo-face)"
        height="40"
        rx="12"
        width="40"
      />
      <g
        opacity="0.95"
        stroke="white"
        strokeLinecap="round"
        strokeWidth="1.35"
      >
        <circle cx="20" cy="20" r="9.5" />
        <ellipse cx="20" cy="20" rx="4.2" ry="9.5" />
        <path d="M10.5 20h19" />
        <path d="M20 10.5c2.2 3.2 3.5 6.5 3.5 9.5s-1.3 6.8-3.5 10" opacity="0.75" />
        <path d="M20 10.5c-2.2 3.2-3.5 6.5-3.5 9.5s1.3 6.8 3.5 10" opacity="0.75" />
      </g>
      <circle cx="28" cy="11" fill="white" r="2.4" opacity="0.98" />
      <circle cx="28" cy="11" fill="#6366f1" opacity="0.35" r="4.5" />
    </svg>
  )
}
