import React, { useEffect, useRef, useState } from "react";
import { BarsAnimationState } from "../types";

interface BarsRobotViewProps {
  animation: BarsAnimationState;
  className?: string;
}

export const BarsRobotView: React.FC<BarsRobotViewProps> = ({ animation, className = "" }) => {
  const modelViewerRef = useRef<any>(null);
  const [modelError, setModelError] = useState(false);

  // Map application states to RobotExpressive animations
  const getAnimationName = (state: BarsAnimationState): string => {
    switch (state) {
      case "talk":
        return "Wave";
      case "warn":
        return "No";
      case "win":
        return "ThumbsUp";
      case "idle":
      default:
        return "Idle";
    }
  };

  const getStatusBadge = (state: BarsAnimationState) => {
    switch (state) {
      case "talk":
        return {
          text: "Б.А.Р.С. АНАЛИЗ & РЕЧЬ",
          color: "bg-cyan-400",
          textColor: "text-cyan-200",
          border: "border-cyan-500/40",
          bg: "bg-cyan-950/70",
        };
      case "warn":
        return {
          text: "Б.А.Р.С. ТРЕВОГА: BATNA",
          color: "bg-rose-500",
          textColor: "text-rose-200",
          border: "border-rose-500/50",
          bg: "bg-rose-950/70",
        };
      case "win":
        return {
          text: "Б.А.Р.С. СДЕЛКА ДОСТИГНУТА",
          color: "bg-emerald-400",
          textColor: "text-emerald-200",
          border: "border-emerald-500/50",
          bg: "bg-emerald-950/70",
        };
      case "idle":
      default:
        return {
          text: "Б.А.Р.С. ONLINE",
          color: "bg-emerald-400",
          textColor: "text-purple-200",
          border: "border-purple-400/40",
          bg: "bg-purple-900/60",
        };
    }
  };

  const badge = getStatusBadge(animation);

  // Update animation in model-viewer when state changes
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (viewer) {
      const anim = getAnimationName(animation);
      viewer.animationName = anim;
      if (viewer.play) {
        viewer.play();
      }
    }
  }, [animation]);

  return (
    <div
      className={`relative w-full h-72 rounded-2xl bg-gradient-to-b from-purple-950/25 via-[#13141f] to-slate-950/90 border border-purple-500/30 overflow-hidden flex items-center justify-center shadow-inner ${className}`}
    >
      {/* Background cyber grid & glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,44,191,0.18)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#7b2cbf15_1px,transparent_1px),linear-gradient(to_bottom,#7b2cbf15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {!modelError ? (
        <model-viewer
          ref={modelViewerRef}
          id="bars-robot-viewer"
          src="/bars.glb"
          alt="Б.А.Р.С. 3D Ассистент (ОЭЗ Алабуга)"
          autoplay
          animation-name={getAnimationName(animation)}
          camera-controls
          disable-zoom
          auto-rotate
          rotation-per-second="10deg"
          shadow-intensity="1.5"
          exposure="1.1"
          style={{ width: "100%", height: "100%", "--poster-color": "transparent" } as any}
          onError={() => setModelError(true)}
        />
      ) : (
        /* Dynamic 3D Fallback canvas if WebGL / model fails */
        <div className="flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 rounded-2xl bg-[#7b2cbf]/30 border border-[#7b2cbf] flex items-center justify-center text-[#00f0ff] font-mono text-xl font-bold animate-pulse shadow-[0_0_20px_rgba(123,44,191,0.5)]">
            BARS
          </div>
          <p className="text-xs text-purple-200 mt-2 font-mono">Бортовой Аналитик 3D</p>
        </div>
      )}

      {/* Futuristic corner brackets */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#00f0ff]/50 pointer-events-none" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#00f0ff]/50 pointer-events-none" />

      {/* Telemetry Tag Top-Left */}
      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-black/60 border border-slate-800 text-[10px] font-mono text-slate-400 backdrop-blur-sm flex items-center gap-1.5 pointer-events-none">
        <span className="text-[#00f0ff]">SYS:</span> 3D_AI_AVATAR
      </div>

      {/* Neon status-badge directly over 3D robot */}
      <div
        className={`absolute bottom-3 right-3 px-3 py-1 rounded-full ${badge.bg} border ${badge.border} text-[11px] font-mono ${badge.textColor} backdrop-blur-md flex items-center gap-2 shadow-lg transition-all duration-300 pointer-events-none`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.color} animate-pulse`} />
        <span id="bars-anim-status" className="tracking-wide font-semibold">
          {badge.text}
        </span>
      </div>
    </div>
  );
};
