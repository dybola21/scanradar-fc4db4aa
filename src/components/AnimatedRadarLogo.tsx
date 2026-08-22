import { cn } from "@/lib/utils";

interface AnimatedRadarLogoProps {
  className?: string;
  size?: number;
}

export function AnimatedRadarLogo({ className, size = 34 }: AnimatedRadarLogoProps) {
  return (
    <div 
      className={cn("flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full block"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes scanRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .radar-sweep {
              transform-origin: 20px 20px;
              animation: scanRotate 3s linear infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .radar-sweep {
                animation: none;
              }
            }
            @keyframes blipPulse {
              0% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
              100% { opacity: 0.3; transform: scale(1); }
            }
            .radar-blip {
              transform-origin: 28px 14px;
              animation: blipPulse 2s ease-in-out infinite;
            }
          `}
        </style>
        
        {/* Radar Background - Navy Blue (#172033) */}
        <circle 
          cx="20" 
          cy="20" 
          r="19" 
          fill="#172033" 
        />
        
        {/* Concentric Circles - Light blue/white with opacity */}
        <circle cx="20" cy="20" r="6" fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.2" />
        <circle cx="20" cy="20" r="12" fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.2" />
        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.2" />
        
        {/* Crosshair lines */}
        <line x1="20" y1="2" x2="20" y2="38" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />
        <line x1="2" y1="20" x2="38" y2="20" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />

        {/* Scanning Sweep Group (Beam + Sector) */}
        <g className="radar-sweep">
          {/* Translucent Sector */}
          <path
            d="M 20 20 L 20 2 A 18 18 0 0 1 32.7 7.3 Z"
            fill="url(#radarSweepGradient)"
            opacity="0.8"
          />
          {/* Main Beam - Cyan (#38BDF8) */}
          <line 
            x1="20" 
            y1="20" 
            x2="20" 
            y2="2" 
            stroke="#38BDF8" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
        </g>

        {/* Detected Point (Blip) - Green (#22C55E) */}
        <circle 
          cx="28" 
          cy="14" 
          r="1.8" 
          fill="#22C55E" 
          className="radar-blip"
        />

        {/* Center Point */}
        <circle cx="20" cy="20" r="1.5" fill="#38BDF8" />

        <defs>
          <linearGradient id="radarSweepGradient" x1="20" y1="20" x2="32.7" y2="7.3" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}