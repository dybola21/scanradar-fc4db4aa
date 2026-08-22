import { cn } from "@/lib/utils";

interface AnimatedRadarSceneProps {
  className?: string;
  size?: number;
}

export function AnimatedRadarScene({ className, size = 400 }: AnimatedRadarSceneProps) {
  return (
    <div 
      className={cn("flex items-center justify-center shrink-0 overflow-visible", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full block overflow-visible"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes scanRotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .radar-sweep-group {
              transform-origin: 50px 50px;
              animation: scanRotate 4s linear infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .radar-sweep-group {
                animation: none;
              }
            }
            @keyframes blipPulse {
              0% { opacity: 0.1; transform: scale(0.8); }
              50% { opacity: 0.8; transform: scale(1.4); }
              100% { opacity: 0.1; transform: scale(0.8); }
            }
            .radar-blip {
              animation: blipPulse 3s ease-in-out infinite;
              transform-box: fill-box;
            }
            .radar-blip-1 { animation-delay: 0s; transform-origin: center; }
            .radar-blip-2 { animation-delay: 1s; transform-origin: center; }
            .radar-blip-3 { animation-delay: 2s; transform-origin: center; }
            .radar-blip-4 { animation-delay: 0.5s; transform-origin: center; }
            .radar-blip-5 { animation-delay: 1.5s; transform-origin: center; }
            
            .radar-grid-line {
              stroke: rgba(56, 189, 248, 0.08);
              stroke-width: 0.2;
            }
          `}
        </style>
        
        {/* Background Grid */}
        <g className="radar-grid">
          <circle cx="50" cy="50" r="10" fill="none" className="radar-grid-line" />
          <circle cx="50" cy="50" r="20" fill="none" className="radar-grid-line" />
          <circle cx="50" cy="50" r="30" fill="none" className="radar-grid-line" />
          <circle cx="50" cy="50" r="40" fill="none" className="radar-grid-line" />
          <circle cx="50" cy="50" r="48" fill="none" className="radar-grid-line" strokeWidth="0.4" />
          
          {/* Axis lines */}
          <line x1="50" y1="2" x2="50" y2="98" className="radar-grid-line" />
          <line x1="2" y1="50" x2="98" y2="50" className="radar-grid-line" />
          
          {/* Diagonal lines */}
          <line x1="15" y1="15" x2="85" y2="85" className="radar-grid-line" />
          <line x1="85" y1="15" x2="15" y2="85" className="radar-grid-line" />
        </g>

        {/* Detected Points (Blips) */}
        <circle cx="72" cy="28" r="1.5" fill="#22C55E" className="radar-blip radar-blip-1" />
        <circle cx="32" cy="65" r="1.2" fill="#22C55E" className="radar-blip radar-blip-2" />
        <circle cx="58" cy="78" r="1.4" fill="#22C55E" className="radar-blip radar-blip-3" />
        <circle cx="45" cy="15" r="1.1" fill="#22C55E" className="radar-blip radar-blip-4" />
        <circle cx="85" cy="60" r="1.3" fill="#22C55E" className="radar-blip radar-blip-5" />

        {/* Scanning Sweep */}
        <g className="radar-sweep-group">
          <path
            d="M 50 50 L 50 2 A 48 48 0 0 1 83.9 15.9 Z"
            fill="url(#radarSweepGradient)"
            opacity="0.8"
          />
          <line 
            x1="50" y1="50" x2="50" y2="2" 
            stroke="#38BDF8" 
            strokeWidth="0.8" 
            strokeLinecap="round" 
          />
        </g>

        {/* Center Point */}
        <circle cx="50" cy="50" r="1.5" fill="#38BDF8" />
        <circle cx="50" cy="50" r="4" fill="#38BDF8" opacity="0.1" />

        <defs>
          <linearGradient id="radarSweepGradient" x1="50" y1="50" x2="83.9" y2="15.9" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
