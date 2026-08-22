import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface AnimatedRadarSceneProps {
  className?: string;
  size?: number;
}

/**
 * SVG Building Silhouette
 */
const BuildingIcon = ({ x, y, size = 6, delay, duration }: { x: number, y: number, size?: number, delay: number, duration: number }) => {
  return (
    <g 
      transform={`translate(${x - size / 2}, ${y - size / 2})`}
      className="radar-detection"
      style={{ 
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#22C55E]"
      >
        <path
          d="M3 21H21M5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21M9 7H11M9 11H11M9 15H11M13 7H15M13 11H15M13 15H15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </g>
  );
};

export function AnimatedRadarScene({ className, size = 400 }: AnimatedRadarSceneProps) {
  const rotationDuration = 5; // seconds per full rotation

  // Detectable points with their coordinates and calculated angles for sync
  const points = useMemo(() => [
    { x: 72, y: 28 },
    { x: 32, y: 65 },
    { x: 58, y: 78 },
    { x: 45, y: 15 },
    { x: 85, y: 60 },
    { x: 25, y: 35 },
    { x: 15, y: 70 },
  ].map(p => {
    // Center is 50, 50.
    const dx = p.x - 50;
    const dy = p.y - 50;
    // atan2 gives angle from positive x-axis. 
    // Convert to angle from negative y-axis (top) clockwise.
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    // delay = (angle / 360) * duration
    const delay = (angle / 360) * rotationDuration;
    
    return { ...p, angle, delay };
  }), [rotationDuration]);

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
              animation: scanRotate ${rotationDuration}s linear infinite;
            }
            
            @keyframes detectionSequence {
              0% { opacity: 0; transform: scale(0.7); }
              0.5% { opacity: 1; transform: scale(1.1); filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.6)); }
              5% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 2px rgba(34, 197, 94, 0.4)); }
              25% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 1px rgba(34, 197, 94, 0.2)); }
              35% { opacity: 0; transform: scale(0.9); }
              100% { opacity: 0; }
            }

            .radar-detection {
              opacity: 0;
              animation: detectionSequence ${rotationDuration}s linear infinite;
              transform-box: fill-box;
              transform-origin: center;
            }

            @media (prefers-reduced-motion: reduce) {
              .radar-sweep-group {
                animation: none;
                transform: rotate(45deg);
              }
              .radar-detection {
                opacity: 0.8;
                animation: none;
              }
            }
            
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
        </g>

        {/* Detected Icons */}
        {points.map((p, i) => (
          <BuildingIcon 
            key={i} 
            x={p.x} 
            y={p.y} 
            size={6} 
            delay={p.delay} 
            duration={rotationDuration} 
          />
        ))}

        {/* Scanning Sweep */}
        <g className="radar-sweep-group">
          {/* Translucent sector (shadow) BEHIND the line */}
          {/* A 40 degree sector. Line is at 0 deg (top), sector goes from -40 to 0. */}
          <path
            d="M 50 50 L 19.2 13.2 A 48 48 0 0 1 50 2 Z"
            fill="url(#radarSweepGradient)"
            opacity="0.8"
          />
          {/* Leading edge line */}
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
          <linearGradient id="radarSweepGradient" x1="19.2" y1="13.2" x2="50" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
