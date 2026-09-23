import React, { useEffect, useRef, useState } from "react";
import { BarsAnimationState } from "../types";

interface BarsAvatarProps {
  animation: BarsAnimationState;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  showStatusBadge?: boolean;
  interactive?: boolean; // If true, camera-controls are enabled; if false, robot is purely automatic
  autoRotate?: boolean;
}

export const BarsAvatar: React.FC<BarsAvatarProps> = ({
  animation,
  size = "md",
  className = "",
  showStatusBadge = false,
  interactive = false,
  autoRotate = true,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [modelError, setModelError] = useState(false);
  const [activeAnimName, setActiveAnimName] = useState<string>("SK_ZMikeAnim_ZMIKE_Idle");

  // Map state to ZMike animations from the Google Drive model
  const resolveAnimation = (state: BarsAnimationState, available: string[]): string => {
    const findAnim = (patterns: string[]) => {
      for (const p of patterns) {
        const match = available.find((a) => a.toLowerCase().includes(p.toLowerCase()));
        if (match) return match;
      }
      return "";
    };

    if (state === "talk") {
      return (
        findAnim(["WaveLoop", "WaveStart", "Wave", "talk", "ExitWave"]) ||
        "SK_ZMikeAnim_ZMIKE_WaveLoop"
      );
    }
    if (state === "warn") {
      return (
        findAnim(["IdleAggro", "IdleBreaker", "HitRegister", "Chomp", "warn"]) ||
        "SK_ZMikeAnim_ZMIKE_IdleAggro"
      );
    }
    if (state === "win") {
      return (
        findAnim(["WaveComplete", "WaveLoop", "Jump", "win"]) ||
        "SK_ZMikeAnim_ZMIKE_WaveComplete"
      );
    }
    // Idle state
    return (
      findAnim(["Idle", "Blinking"]) ||
      "SK_ZMikeAnim_ZMIKE_Idle"
    );
  };

  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleModelLoad = () => {
      const available = viewer.availableAnimations || [];
      const chosen = resolveAnimation(animation, available);
      setActiveAnimName(chosen);
      viewer.animationName = chosen;
      if (viewer.play) {
        viewer.play();
      }
    };

    viewer.addEventListener("load", handleModelLoad);
    // If already loaded
    if (viewer.availableAnimations && viewer.availableAnimations.length > 0) {
      handleModelLoad();
    }

    return () => {
      viewer.removeEventListener("load", handleModelLoad);
    };
  }, [animation]);

  // When animation prop changes on already loaded viewer
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (viewer && viewer.availableAnimations) {
      const chosen = resolveAnimation(animation, viewer.availableAnimations);
      setActiveAnimName(chosen);
      viewer.animationName = chosen;
      if (viewer.play) {
        viewer.play();
      }
    }
  }, [animation]);

  // Dimensions
  const sizeClasses = {
    xs: "w-9 h-9 min-w-[36px] min-h-[36px]",
    sm: "w-12 h-12 min-w-[48px] min-h-[48px]",
    md: "w-18 h-18 min-w-[72px] min-h-[72px]",
    lg: "w-28 h-28 min-w-[112px] min-h-[112px]",
    xl: "w-44 h-44 min-w-[176px] min-h-[176px]",
    hero: "w-56 h-56 sm:w-64 sm:h-64 min-w-[224px] min-h-[224px]",
  }[size];

  const ringGlow = {
    talk: "border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.6)]",
    warn: "border-[#f2b8b5] shadow-[0_0_20px_rgba(242,184,181,0.6)]",
    win: "border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.6)]",
    idle: "border-[#d0bcff]/50 shadow-[0_0_12px_rgba(208,188,255,0.3)]",
  }[animation];

  const getGestureTitle = (state: BarsAnimationState): string => {
    switch (state) {
      case "talk":
        return "Б.А.Р.С. говорит и жестикулирует";
      case "warn":
        return "Внимание: угроза BATNA!";
      case "win":
        return "Одобрение условий сделки";
      case "idle":
      default:
        return "Б.А.Р.С. в боевой готовности";
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
      {/* Outer Cyber Shield Container */}
      <div
        className={`relative rounded-2xl overflow-hidden border-2 bg-gradient-to-b from-[#2b2930] via-[#1d1b20] to-[#141218] ${sizeClasses} ${ringGlow} transition-all duration-300`}
        title={`Робот-наставник Б.А.Р.С. (${getGestureTitle(animation)})`}
      >
        {!modelError ? (
          <model-viewer
            ref={modelViewerRef}
            src="/z_mike.glb"
            alt="Б.А.Р.С. Z-Mike 3D Робот"
            autoplay
            animation-name={activeAnimName}
            {...(interactive ? { "camera-controls": true, "touch-action": "pan-y" } : {})}
            disable-zoom={!interactive}
            disable-pan={!interactive}
            auto-rotate={autoRotate ? true : undefined}
            rotation-per-second={autoRotate ? "16deg" : "0deg"}
            shadow-intensity="1.2"
            exposure="1.15"
            camera-orbit="0deg 80deg 115%"
            camera-target="auto auto auto"
            style={
              {
                width: "100%",
                height: "100%",
                "--poster-color": "transparent",
                pointerEvents: interactive ? "auto" : "none",
              } as any
            }
            onError={() => {
              // Try fallback to bars.glb
              const viewer = modelViewerRef.current;
              if (viewer && viewer.src !== "/bars.glb") {
                viewer.src = "/bars.glb";
              } else {
                setModelError(true);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 bg-[#1d1b20]">
            <span className="text-xs font-bold text-[#d0bcff] font-mono">БАРС</span>
            <span className="text-[10px] text-[#00f0ff] font-mono">3D AI</span>
          </div>
        )}

        {/* Live Audio / Status Ping */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 pointer-events-none z-10">
          <span
            className={`w-2 h-2 rounded-full ${
              animation === "talk"
                ? "bg-[#00f0ff] animate-ping"
                : animation === "warn"
                ? "bg-[#f2b8b5] animate-pulse"
                : animation === "win"
                ? "bg-[#10b981] animate-pulse"
                : "bg-[#d0bcff]"
            }`}
          />
        </div>

        {/* Bottom Badge for larger sizes */}
        {(size === "md" || size === "lg" || size === "xl" || size === "hero") && (
          <div className="absolute bottom-0 inset-x-0 bg-[#141218]/85 backdrop-blur-xs py-0.5 text-center text-[9px] font-mono text-[#cac4d0] tracking-tight pointer-events-none border-t border-[#49454f]/30 z-10">
            {animation === "warn" ? (
              <span className="text-[#f2b8b5] font-bold">! ТРЕВОГА BATNA !</span>
            ) : animation === "win" ? (
              <span className="text-[#00f0ff] font-bold">✓ ВЫГОДНАЯ СДЕЛКА</span>
            ) : animation === "talk" ? (
              <span className="text-[#00f0ff] font-bold">ГОВОРИТ...</span>
            ) : (
              <span>Б.А.Р.С. 3D</span>
            )}
          </div>
        )}
      </div>

      {showStatusBadge && (
        <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-[#2b2930] border border-[#49454f] text-[10px] font-medium text-[#d0bcff] text-center whitespace-nowrap shadow-sm">
          {getGestureTitle(animation)}
        </div>
      )}
    </div>
  );
};
