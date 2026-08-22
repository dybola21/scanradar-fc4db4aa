import { cn } from "@/lib/utils";

interface ScanRadarLogoProps {
  className?: string;
  size?: number;
  theme?: "light" | "dark";
  showWordmark?: boolean;
  orientation?: "horizontal" | "vertical";
  iconOnly?: boolean;
}

export function ScanRadarLogo({
  className,
  size = 32,
  theme = "dark",
  showWordmark = true,
  orientation = "horizontal",
  iconOnly = false,
}: ScanRadarLogoProps) {
  const isDark = theme === "dark";
  
  // Wordmark colors
  const scanColor = isDark ? "#F6F8FB" : "#0B1220";
  const radarColor = isDark ? "#38BDF8" : "#0284C7";
  
  // Symbol colors
  const primaryBlue = "#38BDF8";
  const secondaryBlue = "#0284C7";
  const accentGreen = "#22C55E";

  const symbol = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Outer radar arc - incomplete for movement */}
      <path
        d="M38 12.5C42.5 18.5 43.5 26.5 40 33.5C36.5 40.5 29.5 44 22 43C14.5 42 8.5 36.5 6.5 29.5C4.5 22.5 6.5 15.5 11 10"
        stroke={primaryBlue}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      
      {/* Inner radar arc */}
      <path
        d="M32 18C34.5 21.5 35 26.5 33 30.5C31 34.5 27 36.5 22.5 36C18 35.5 14.5 32 13.5 28C12.5 24 13.5 19.5 16 16.5"
        stroke={secondaryBlue}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      
      {/* Center point */}
      <circle cx="24" cy="24" r="2" fill={accentGreen} />
      
      {/* Scan line and detected company node */}
      <g>
        <line
          x1="24"
          y1="24"
          x2="35"
          y2="13"
          stroke={primaryBlue}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Company node (square with rounded corners) */}
        <rect
          x="33"
          y="11"
          width="6"
          height="6"
          rx="1.5"
          fill={accentGreen}
        />
      </g>
    </svg>
  );

  if (iconOnly) {
    return (
      <div className={cn("inline-flex items-center justify-center", className)}>
        {symbol}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-[11px]",
        orientation === "vertical" ? "flex-col text-center" : "flex-row",
        className
      )}
    >
      {symbol}
      {showWordmark && (
        <span
          className="font-geist font-[700] tracking-tight pointer-events-none select-none"
          style={{ 
            fontSize: size * 0.72, // Scale text relative to logo size (approx 23-25px for 36px logo)
            lineHeight: 1 
          }}
        >
          <span style={{ color: scanColor }}>Scan</span>
          <span style={{ color: radarColor }}>Radar</span>
        </span>
      )}
    </div>
  );
}
