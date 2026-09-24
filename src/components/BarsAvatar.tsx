import React, { useEffect, useRef, useState } from "react";
import { BarsAnimationState } from "../types";
import { resolveRobotAnimation, MIKE_ANIMATIONS } from "../utils/robotAnimations";
import { triggerHaptic } from "../utils/haptics";

interface BarsAvatarProps {
  animation: BarsAnimationState | string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  showStatusBadge?: boolean;
  interactive?: boolean;
  autoRotate?: boolean;
  onClick?: () => void;
}

export const BarsAvatar: React.FC<BarsAvatarProps> = ({
  animation,
  size = "md",
  className = "",
  showStatusBadge = false,
  interactive = false,
  autoRotate = true,
  onClick,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [modelError, setModelError] = useState(false);
  const [activeAnimName, setActiveAnimName] = useState<string>(MIKE_ANIMATIONS.idle);
  const [tempUserAnim, setTempUserAnim] = useState<string | null>(null);

  // Sync animation with props and available animations
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const animToResolve = tempUserAnim || animation;

    const handleModelLoad = () => {
      const available = viewer.availableAnimations || [];
      const chosen = resolveRobotAnimation(animToResolve, available);
      setActiveAnimName(chosen);
      viewer.animationName = chosen;
      if (viewer.play) {
        viewer.play();
      }
    };

    viewer.addEventListener("load", handleModelLoad);
    if (viewer.availableAnimations && viewer.availableAnimations.length > 0) {
      handleModelLoad();
    }

    return () => {
      viewer.removeEventListener("load", handleModelLoad);
    };
  }, [animation, tempUserAnim]);

  // Click on avatar reaction
  const handleAvatarClick = () => {
    triggerHaptic("light");
    if (onClick) {
      onClick();
    } else {
      // Internal cheerful reaction
      const isHappy = animation === "win" || animation === "talk";
      setTempUserAnim(isHappy ? "win" : "talk");
      setTimeout(() => {
        setTempUserAnim(null);
      }, 2200);
    }
  };

  // Dimensions
  const sizeClasses = {
    xs: "w-10 h-10 min-w-[40px] min-h-[40px]",
    sm: "w-14 h-14 min-w-[56px] min-h-[56px]",
    md: "w-20 h-20 min-w-[80px] min-h-[80px]",
    lg: "w-32 h-32 min-w-[128px] min-h-[128px]",
    xl: "w-48 h-48 min-w-[192px] min-h-[192px]",
    hero: "w-64 h-64 sm:w-72 sm:h-72 min-w-[256px] min-h-[256px]",
  }[size];

  const getRingGlow = (state: string): string => {
    const norm = (state || "").toLowerCase();
    if (norm === "talk" || norm === "wave" || norm === "speaking") {
      return "border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)]";
    }
    if (norm === "warn" || norm === "attack" || norm === "danger") {
      return "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)]";
    }
    if (norm === "win" || norm === "compromise" || norm === "victory") {
      return "border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]";
    }
    if (norm === "bluff") {
      return "border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]";
    }
    return "border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
  };

  const getGestureTitle = (state: string): string => {
    const norm = (state || "").toLowerCase();
    switch (norm) {
      case "talk":
        return "Б.А.Р.С. говорит и жестикулирует";
      case "warn":
        return "Внимание: угроза BATNA!";
      case "attack":
        return "Отражение прессинга!";
      case "bluff":
        return "Проверка блефа!";
      case "compromise":
      case "win":
        return "Одобрение условий сделки";
      case "idle":
      default:
        return "Б.А.Р.С. в боевой готовности";
    }
  };

  const ringGlow = getRingGlow(tempUserAnim || animation);

  return (
    <div
      onClick={handleAvatarClick}
      className={`relative flex flex-col items-center justify-center shrink-0 cursor-pointer group active:scale-95 transition-transform ${className}`}
    >
      {/* Outer Cyber Shield Container */}
      <div
        className={`relative rounded-2xl overflow-hidden border-2 bg-gradient-to-b from-[#1c1b29] via-[#10111a] to-[#0a0b12] ${sizeClasses} ${ringGlow} transition-all duration-300 backdrop-blur-md`}
        title={`Робот-наставник Б.А.Р.С. (${getGestureTitle(animation)})`}
      >
        {!modelError ? (
          <model-viewer
            ref={modelViewerRef}
            src="/bars.glb"
            alt="Б.А.Р.С. 3D Робот-наставник (ОЭЗ «Алабуга»)"
            autoplay
            animation-name={activeAnimName}
            {...(interactive ? { "camera-controls": true, "touch-action": "pan-y" } : {})}
            disable-zoom={!interactive}
            disable-pan={!interactive}
            auto-rotate={autoRotate ? true : undefined}
            rotation-per-second={autoRotate ? "16deg" : "0deg"}
            shadow-intensity="1.5"
            exposure="1.2"
            environment-image="neutral"
            camera-orbit="0deg 80deg 75%"
            camera-target="0m 0.85m 0m"
            style={
              {
                width: "100%",
                height: "100%",
                "--poster-color": "transparent",
                pointerEvents: interactive ? "auto" : "none",
              } as any
            }
            onError={() => {
              setModelError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-[#121320] border border-cyan-500/20">
            <span className="text-xs font-bold text-cyan-400 font-mono tracking-wider">Б.А.Р.С.</span>
            <span className="text-[10px] text-purple-300 font-mono">3D AI MENTOR</span>
          </div>
        )}

        {/* Live Audio / Status Ping */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 pointer-events-none z-10">
          <span
            className={`w-2 h-2 rounded-full ${
              animation === "talk"
                ? "bg-cyan-400 animate-ping"
                : animation === "warn" || animation === "attack"
                ? "bg-rose-500 animate-pulse"
                : animation === "win" || animation === "compromise"
                ? "bg-emerald-400 animate-pulse"
                : "bg-purple-400"
            }`}
          />
        </div>

        {/* Bottom Badge for larger sizes */}
        {(size === "md" || size === "lg" || size === "xl" || size === "hero") && (
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm py-0.5 text-center text-[9px] font-mono text-slate-300 tracking-tight pointer-events-none border-t border-white/10 z-10">
            {animation === "warn" || animation === "attack" ? (
              <span className="text-rose-400 font-bold">! ТРЕВОГА BATNA !</span>
            ) : animation === "win" || animation === "compromise" ? (
              <span className="text-emerald-400 font-bold">✓ СДЕЛКА СОГЛАСОВАНА</span>
            ) : animation === "talk" ? (
              <span className="text-cyan-400 font-bold">ИНСТРУКТИРУЕТ...</span>
            ) : (
              <span className="text-purple-300 font-medium">Б.А.Р.С. ONLINE</span>
            )}
          </div>
        )}
      </div>

      {showStatusBadge && (
        <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-[10px] font-medium text-purple-200 text-center whitespace-nowrap shadow-sm backdrop-blur-md">
          {getGestureTitle(animation)}
        </div>
      )}
    </div>
  );
};
