import React, { useState, useEffect } from "react";
import { BarsAnimationState } from "../types";
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

// CSS keyframes injected once
const BARS_KEYFRAMES = `
@keyframes bars-idle-breathe {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.015) translateY(-2px); }
}
@keyframes bars-talk-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1.1) drop-shadow(0 0 12px rgba(0,240,255,0.5)); }
  25% { transform: scale(1.03) rotate(1deg); filter: brightness(1.25) drop-shadow(0 0 20px rgba(0,240,255,0.7)); }
  75% { transform: scale(0.98) rotate(-1deg); filter: brightness(1.15) drop-shadow(0 0 16px rgba(0,240,255,0.6)); }
}
@keyframes bars-warn-shake {
  0%, 100% { transform: translateX(0) scale(1); }
  10% { transform: translateX(-4px) scale(1.02); }
  20% { transform: translateX(4px) scale(1.02); }
  30% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  50% { transform: translateX(-2px); }
  60% { transform: translateX(2px); }
  70% { transform: translateX(-1px); }
  80% { transform: translateX(1px); }
  90% { transform: translateX(0); }
}
@keyframes bars-win-bounce {
  0%, 100% { transform: translateY(0) scale(1); filter: brightness(1.1); }
  30% { transform: translateY(-8px) scale(1.05); filter: brightness(1.3) drop-shadow(0 0 25px rgba(16,185,129,0.6)); }
  50% { transform: translateY(-3px) scale(1.02); }
  70% { transform: translateY(-6px) scale(1.04); filter: brightness(1.25) drop-shadow(0 0 20px rgba(16,185,129,0.5)); }
}
@keyframes bars-attack-punch {
  0%, 100% { transform: scale(1) rotate(0deg); }
  15% { transform: scale(1.08) rotate(-3deg); filter: brightness(1.3) drop-shadow(0 0 20px rgba(244,63,94,0.7)); }
  30% { transform: scale(0.95) rotate(2deg); }
  50% { transform: scale(1.06) rotate(-2deg); filter: brightness(1.2) drop-shadow(0 0 15px rgba(244,63,94,0.5)); }
  70% { transform: scale(0.97) rotate(1deg); }
}
@keyframes bars-bluff-flicker {
  0%, 100% { opacity: 1; filter: brightness(1); }
  15% { opacity: 0.7; filter: brightness(1.4) hue-rotate(15deg); }
  30% { opacity: 1; filter: brightness(0.9); }
  45% { opacity: 0.8; filter: brightness(1.3) hue-rotate(-10deg); }
  60% { opacity: 1; filter: brightness(1.1); }
  80% { opacity: 0.85; filter: brightness(1.2) hue-rotate(8deg); }
}
@keyframes bars-thinking-glow {
  0%, 100% { filter: brightness(0.9) saturate(0.8); transform: scale(1); }
  50% { filter: brightness(1.1) saturate(1.1) drop-shadow(0 0 12px rgba(168,85,247,0.4)); transform: scale(1.01); }
}
@keyframes bars-hit-recoil {
  0% { transform: scale(1) translateX(0); }
  15% { transform: scale(0.92) translateX(6px); filter: brightness(1.5) saturate(0.5); }
  30% { transform: scale(0.96) translateX(-4px); }
  50% { transform: scale(1) translateX(2px); filter: brightness(1.1); }
  70% { transform: scale(1) translateX(-1px); }
  100% { transform: scale(1) translateX(0); filter: brightness(1); }
}
@keyframes bars-death-fade {
  0% { transform: scale(1) rotate(0deg); filter: brightness(1) grayscale(0); }
  40% { transform: scale(0.95) rotate(3deg); filter: brightness(0.7) grayscale(0.5); }
  70% { transform: scale(0.9) rotate(-2deg) translateY(4px); filter: brightness(0.5) grayscale(0.8); }
  100% { transform: scale(0.88) rotate(5deg) translateY(6px); filter: brightness(0.4) grayscale(1); }
}
@keyframes bars-ring-pulse {
  0%, 100% { box-shadow: 0 0 15px var(--ring-color); }
  50% { box-shadow: 0 0 30px var(--ring-color), 0 0 60px var(--ring-color); }
}
@keyframes bars-visor-scan {
  0%, 100% { opacity: 0.3; transform: translateY(30%) scaleY(0.15); }
  50% { opacity: 0.6; transform: translateY(45%) scaleY(0.1); }
}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement("style");
  style.textContent = BARS_KEYFRAMES;
  document.head.appendChild(style);
  stylesInjected = true;
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
  const [tempUserAnim, setTempUserAnim] = useState<string | null>(null);
  const [clickFlash, setClickFlash] = useState(false);

  useEffect(() => {
    injectStyles();
  }, []);

  const activeState = tempUserAnim || animation || "idle";
  const norm = (activeState || "").toLowerCase();

  // Click reaction
  const handleAvatarClick = () => {
    triggerHaptic("light");
    setClickFlash(true);
    setTimeout(() => setClickFlash(false), 200);

    if (onClick) {
      onClick();
    } else {
      const isHappy = norm === "win" || norm === "talk" || norm === "compromise";
      setTempUserAnim(isHappy ? "win" : "talk");
      setTimeout(() => setTempUserAnim(null), 2200);
    }
  };

  // Size map
  const sizeMap = {
    xs:   { container: "w-10 h-10 min-w-[40px] min-h-[40px]", rounded: "rounded-lg" },
    sm:   { container: "w-14 h-14 min-w-[56px] min-h-[56px]", rounded: "rounded-xl" },
    md:   { container: "w-20 h-20 min-w-[80px] min-h-[80px]", rounded: "rounded-2xl" },
    lg:   { container: "w-32 h-32 min-w-[128px] min-h-[128px]", rounded: "rounded-2xl" },
    xl:   { container: "w-48 h-48 min-w-[192px] min-h-[192px]", rounded: "rounded-3xl" },
    hero: { container: "w-64 h-64 sm:w-72 sm:h-72 min-w-[256px] min-h-[256px]", rounded: "rounded-3xl" },
  }[size]!;

  // Animation style per state
  const getAnimStyle = (): React.CSSProperties => {
    switch (norm) {
      case "talk":
      case "wave":
      case "speaking":
      case "reply":
        return { animation: "bars-talk-pulse 1.2s ease-in-out infinite" };
      case "warn":
      case "danger":
      case "stress":
        return { animation: "bars-warn-shake 0.6s ease-in-out infinite" };
      case "attack":
      case "press":
      case "punch":
        return { animation: "bars-attack-punch 0.8s ease-in-out infinite" };
      case "win":
      case "victory":
      case "triumph":
      case "compromise":
      case "agree":
      case "success":
        return { animation: "bars-win-bounce 1s ease-in-out infinite" };
      case "bluff":
      case "chomp":
      case "threat":
        return { animation: "bars-bluff-flicker 0.7s ease-in-out infinite" };
      case "thinking":
      case "listening":
      case "typing":
      case "loading":
      case "blinking":
        return { animation: "bars-thinking-glow 2s ease-in-out infinite" };
      case "hit":
      case "flinch":
      case "shock":
      case "defended":
        return { animation: "bars-hit-recoil 0.5s ease-out" };
      case "death":
      case "fail":
      case "deadlock":
      case "broken":
        return { animation: "bars-death-fade 1.5s ease-in-out forwards" };
      case "idle":
      default:
        return { animation: "bars-idle-breathe 3s ease-in-out infinite" };
    }
  };

  // Ring glow color
  const getRingColor = (): { border: string; glow: string; css: string } => {
    if (norm === "talk" || norm === "wave" || norm === "speaking" || norm === "reply") {
      return { border: "border-cyan-400", glow: "rgba(6,182,212,0.5)", css: "shadow-[0_0_25px_rgba(6,182,212,0.5)]" };
    }
    if (norm === "warn" || norm === "attack" || norm === "danger" || norm === "press" || norm === "punch") {
      return { border: "border-rose-500", glow: "rgba(244,63,94,0.5)", css: "shadow-[0_0_25px_rgba(244,63,94,0.5)]" };
    }
    if (norm === "win" || norm === "compromise" || norm === "victory" || norm === "agree" || norm === "success") {
      return { border: "border-emerald-400", glow: "rgba(16,185,129,0.5)", css: "shadow-[0_0_25px_rgba(16,185,129,0.5)]" };
    }
    if (norm === "bluff" || norm === "threat") {
      return { border: "border-amber-400", glow: "rgba(245,158,11,0.4)", css: "shadow-[0_0_20px_rgba(245,158,11,0.4)]" };
    }
    if (norm === "death" || norm === "fail") {
      return { border: "border-gray-600", glow: "rgba(100,100,100,0.3)", css: "shadow-[0_0_10px_rgba(100,100,100,0.3)]" };
    }
    if (norm === "hit" || norm === "flinch") {
      return { border: "border-orange-400", glow: "rgba(251,146,60,0.5)", css: "shadow-[0_0_20px_rgba(251,146,60,0.5)]" };
    }
    return { border: "border-purple-400/50", glow: "rgba(168,85,247,0.3)", css: "shadow-[0_0_15px_rgba(168,85,247,0.3)]" };
  };

  // Status badge text
  const getGestureTitle = (): string => {
    switch (norm) {
      case "talk":
      case "speaking":
      case "reply":
        return "Б.А.Р.С. говорит и жестикулирует";
      case "warn":
      case "danger":
        return "Внимание: угроза BATNA!";
      case "attack":
      case "press":
      case "punch":
        return "Отражение прессинга!";
      case "bluff":
      case "threat":
        return "Проверка блефа!";
      case "compromise":
      case "agree":
      case "win":
      case "victory":
        return "Одобрение условий сделки";
      case "thinking":
      case "loading":
        return "Анализирует ситуацию...";
      case "hit":
      case "flinch":
        return "Удар по позициям!";
      case "death":
      case "fail":
        return "Переговоры сорваны!";
      case "idle":
      default:
        return "Б.А.Р.С. в боевой готовности";
    }
  };

  // Bottom status badge label
  const getStatusLabel = () => {
    if (norm === "warn" || norm === "attack" || norm === "danger" || norm === "press") {
      return <span className="text-rose-400 font-bold">! ТРЕВОГА BATNA !</span>;
    }
    if (norm === "win" || norm === "compromise" || norm === "victory" || norm === "agree") {
      return <span className="text-emerald-400 font-bold">✓ СДЕЛКА СОГЛАСОВАНА</span>;
    }
    if (norm === "talk" || norm === "speaking" || norm === "reply") {
      return <span className="text-cyan-400 font-bold">ИНСТРУКТИРУЕТ...</span>;
    }
    if (norm === "bluff" || norm === "threat") {
      return <span className="text-amber-400 font-bold">⚡ БЛЕФ ОБНАРУЖЕН</span>;
    }
    if (norm === "thinking" || norm === "loading") {
      return <span className="text-purple-400 font-bold">АНАЛИЗИРУЕТ...</span>;
    }
    if (norm === "death" || norm === "fail") {
      return <span className="text-gray-500 font-bold">СИСТЕМА OFFLINE</span>;
    }
    if (norm === "hit" || norm === "flinch") {
      return <span className="text-orange-400 font-bold">КОНТРАТАКА!</span>;
    }
    return <span className="text-purple-300 font-medium">Б.А.Р.С. ONLINE</span>;
  };

  // Status ping indicator
  const getPingClass = (): string => {
    if (norm === "talk" || norm === "speaking" || norm === "reply") return "bg-cyan-400 animate-ping";
    if (norm === "warn" || norm === "attack" || norm === "danger" || norm === "press") return "bg-rose-500 animate-pulse";
    if (norm === "win" || norm === "compromise" || norm === "victory") return "bg-emerald-400 animate-pulse";
    if (norm === "bluff" || norm === "threat") return "bg-amber-400 animate-pulse";
    if (norm === "thinking" || norm === "loading") return "bg-purple-400 animate-pulse";
    if (norm === "death" || norm === "fail") return "bg-gray-500";
    return "bg-purple-400";
  };

  // Visor overlay color
  const getVisorOverlay = (): string | null => {
    if (norm === "warn" || norm === "attack" || norm === "danger") return "rgba(244,63,94,0.15)";
    if (norm === "win" || norm === "compromise" || norm === "victory") return "rgba(16,185,129,0.12)";
    if (norm === "talk" || norm === "speaking") return "rgba(0,240,255,0.1)";
    if (norm === "bluff") return "rgba(245,158,11,0.12)";
    if (norm === "death" || norm === "fail") return "rgba(0,0,0,0.4)";
    return null;
  };

  const ring = getRingColor();
  const animStyle = getAnimStyle();
  const visorColor = getVisorOverlay();
  const showBadge = size === "md" || size === "lg" || size === "xl" || size === "hero";

  return (
    <div
      onClick={handleAvatarClick}
      className={`relative flex flex-col items-center justify-center shrink-0 cursor-pointer group active:scale-95 transition-transform ${className}`}
    >
      {/* Outer Container with animated ring */}
      <div
        className={`relative ${sizeMap.rounded} overflow-hidden border-2 bg-gradient-to-b from-[#1c1b29] via-[#10111a] to-[#0a0b12] ${sizeMap.container} ${ring.border} ${ring.css} transition-all duration-300 backdrop-blur-md`}
        style={{ "--ring-color": ring.glow } as any}
        title={`Робот-наставник Б.А.Р.С. (${getGestureTitle()})`}
      >
        {/* Animated Robot Image */}
        <div className="w-full h-full" style={animStyle}>
          <img
            src="/bars_avatar.jpg"
            alt="Б.А.Р.С. — Робот-наставник ОЭЗ «Алабуга»"
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
        </div>

        {/* Emotion Color Overlay */}
        {visorColor && (
          <div
            className="absolute inset-0 pointer-events-none transition-colors duration-300"
            style={{ backgroundColor: visorColor }}
          />
        )}

        {/* Click flash */}
        {clickFlash && (
          <div className="absolute inset-0 bg-white/30 pointer-events-none animate-pulse rounded-inherit" />
        )}

        {/* Scanning visor line (idle / thinking) */}
        {(norm === "idle" || norm === "thinking" || norm === "loading") && (
          <div
            className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none"
            style={{ animation: "bars-visor-scan 3s ease-in-out infinite" }}
          />
        )}

        {/* Status Ping indicator */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 pointer-events-none z-10">
          <span className={`w-2 h-2 rounded-full ${getPingClass()}`} />
        </div>

        {/* Bottom Badge */}
        {showBadge && (
          <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 backdrop-blur-sm py-0.5 text-center text-[9px] font-mono text-slate-300 tracking-tight pointer-events-none border-t border-white/10 z-10">
            {getStatusLabel()}
          </div>
        )}
      </div>

      {/* External Status Badge */}
      {showStatusBadge && (
        <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-[10px] font-medium text-purple-200 text-center whitespace-nowrap shadow-sm backdrop-blur-md">
          {getGestureTitle()}
        </div>
      )}
    </div>
  );
};
