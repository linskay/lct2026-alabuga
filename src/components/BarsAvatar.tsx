import React, { useEffect, useRef, useState } from "react";
import { BarsAnimationState } from "../types";

interface BarsAvatarProps {
  animation: BarsAnimationState;
  size?: "sm" | "md" | "lg";
  className?: string;
  showStatusBadge?: boolean;
}

export const BarsAvatar: React.FC<BarsAvatarProps> = ({
  animation,
  size = "md",
  className = "",
  showStatusBadge = false,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [modelError, setModelError] = useState(false);

  // Map state to animated gesture of the living 3D character
  const getAnimationName = (state: BarsAnimationState): string => {
    switch (state) {
      case "talk":
        return "Wave"; // Жестикулирует рукой, утверждает и приветствует
      case "warn":
        return "No"; // Отрицает, предупреждает об опасности
      case "win":
        return "ThumbsUp"; // Победный жест, одобрение сделки
      case "idle":
      default:
        return "Idle"; // Живое покачивание, дыхание, осмотр собеседника
    }
  };

  const getGestureTitle = (state: BarsAnimationState): string => {
    switch (state) {
      case "talk":
        return "Жестикулирует: объясняет тактику";
      case "warn":
        return "Жестикулирует: предупреждение BATNA!";
      case "win":
        return "Жестикулирует: одобрение сделки";
      case "idle":
      default:
        return "Внимательно наблюдает";
    }
  };

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (viewer) {
      viewer.animationName = getAnimationName(animation);
      if (viewer.play) {
        viewer.play();
      }
    }
  }, [animation]);

  // Dimensions based on size
  const sizeClasses = {
    sm: "w-14 h-14 min-w-[56px] min-h-[56px]",
    md: "w-20 h-20 min-w-[80px] min-h-[80px]",
    lg: "w-28 h-28 min-w-[112px] min-h-[112px]",
  }[size];

  const ringGlow = {
    talk: "border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.5)]",
    warn: "border-rose-500 shadow-[0_0_18px_rgba(255,51,102,0.6)] animate-pulse",
    win: "border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.6)]",
    idle: "border-[#7b2cbf] shadow-[0_0_12px_rgba(123,44,191,0.4)]",
  }[animation];

  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
      {/* Outer Glowing Cyber Ring */}
      <div
        className={`relative rounded-2xl overflow-hidden border-2 bg-gradient-to-b from-[#1b1e2c] to-[#0a0c12] ${sizeClasses} ${ringGlow} transition-all duration-300`}
        title={`Робот-наставник Б.А.Р.С. (${getGestureTitle(animation)})`}
      >
        {!modelError ? (
          <model-viewer
            ref={modelViewerRef}
            src="/bars.glb"
            alt="Б.А.Р.С. 3D Аватар"
            autoplay
            animation-name={getAnimationName(animation)}
            camera-controls
            disable-zoom
            auto-rotate
            rotation-per-second="15deg"
            shadow-intensity="1.5"
            exposure="1.2"
            camera-orbit="0deg 75deg 110%"
            camera-target="0m 1.05m 0m"
            style={
              {
                width: "100%",
                height: "100%",
                "--poster-color": "transparent",
              } as any
            }
            onError={() => setModelError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 bg-[#141622]">
            <span className="text-xs font-bold text-[#00f0ff] font-mono">БАРС</span>
            <span className="text-[9px] text-purple-300 font-mono">3D</span>
          </div>
        )}

        {/* Live Audio / Neural Indicator Dot */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 pointer-events-none">
          <span
            className={`w-2 h-2 rounded-full ${
              animation === "talk"
                ? "bg-[#00f0ff] animate-ping"
                : animation === "warn"
                ? "bg-rose-500 animate-pulse"
                : animation === "win"
                ? "bg-emerald-400 animate-pulse"
                : "bg-purple-400"
            }`}
          />
        </div>

        {/* Role Sub-Badge inside bottom */}
        <div className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-xs py-0.5 text-center text-[9px] font-mono text-slate-300 tracking-tight pointer-events-none border-t border-white/10">
          {animation === "warn" ? (
            <span className="text-rose-400 font-bold">! ТРЕВОГА !</span>
          ) : animation === "win" ? (
            <span className="text-emerald-400 font-bold">✓ ПОБЕДА</span>
          ) : animation === "talk" ? (
            <span className="text-[#00f0ff] font-bold">ГОВОРИТ</span>
          ) : (
            <span>Б.А.Р.С.</span>
          )}
        </div>
      </div>

      {showStatusBadge && (
        <div className="mt-1.5 px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-[10px] font-mono text-purple-200 text-center whitespace-nowrap shadow-sm">
          {getGestureTitle(animation)}
        </div>
      )}
    </div>
  );
};
