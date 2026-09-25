import React, { useEffect, useRef, useState } from "react";
import { BarsAnimationState } from "../types";
import { Sparkles, Volume2, ShieldAlert, CheckCircle2, RotateCw, Hand, ThumbsUp, PartyPopper, Ban, Zap } from "lucide-react";
import { resolveRobotAnimation, MIKE_ANIMATIONS } from "../utils/robotAnimations";
import { triggerHaptic } from "../utils/haptics";

interface BarsHologramStageProps {
  animation: BarsAnimationState;
  feedbackText: string;
  onApplyAdvice?: (advice: string) => void;
  className?: string;
  compact?: boolean;
}

export const BarsHologramStage: React.FC<BarsHologramStageProps> = ({
  animation,
  feedbackText,
  onApplyAdvice,
  className = "",
  compact = false,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [modelError, setModelError] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [activeGesture, setActiveGesture] = useState<string>(MIKE_ANIMATIONS.idle);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync animation when prop changes
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const applyAnim = () => {
      const available = viewer.availableAnimations || [];
      const chosen = resolveRobotAnimation(animation, available);
      setActiveGesture(chosen);
      viewer.animationName = chosen;
      if (viewer.play) {
        viewer.play();
      }
    };

    if (viewer.availableAnimations && viewer.availableAnimations.length > 0) {
      applyAnim();
    } else {
      viewer.addEventListener("load", applyAnim, { once: true });
    }

    if (animation === "talk") {
      setIsSpeaking(true);
      const timer = setTimeout(() => setIsSpeaking(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setIsSpeaking(false);
    }
  }, [animation]);

  const [activeGestureLabel, setActiveGestureLabel] = useState<string>("Спокойствие");

  // Manually trigger gestures
  const triggerGesture = (animKey: string, label: string = "Жест") => {
    triggerHaptic("light");
    const viewer = modelViewerRef.current;
    if (!viewer) return;
    const available = viewer.availableAnimations || [];
    const resolved = resolveRobotAnimation(animKey, available);
    setActiveGesture(resolved);
    setActiveGestureLabel(label);
    viewer.animationName = resolved;
    if (viewer.play) {
      viewer.play();
    }
  };

  const getStatusColor = () => {
    switch (animation) {
      case "talk":
        return {
          glow: "rgba(6, 182, 212, 0.45)",
          border: "border-cyan-400/50",
          badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-400/40",
          icon: <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />,
          label: "РЕЧЬ И АРГУМЕНТАЦИЯ",
        };
      case "warn":
        return {
          glow: "rgba(244, 63, 94, 0.45)",
          border: "border-rose-500/50",
          badgeBg: "bg-rose-950/80 text-rose-300 border-rose-500/40",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />,
          label: "УГРОЗА BATNA / БЛЕФ",
        };
      case "win":
        return {
          glow: "rgba(16, 185, 129, 0.45)",
          border: "border-emerald-400/50",
          badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-400/40",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />,
          label: "СДЕЛКА СОГЛАСОВАНА",
        };
      case "idle":
      default:
        return {
          glow: "rgba(168, 85, 247, 0.35)",
          border: "border-purple-500/40",
          badgeBg: "bg-purple-950/80 text-purple-300 border-purple-500/40",
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
          label: "МОНИТОРИНГ ПЕРЕГОВОРОВ",
        };
    }
  };

  const status = getStatusColor();

  return (
    <div
      className={`relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-gradient-to-b from-[#18192a]/85 via-[#10111e]/90 to-[#080912]/95 border ${status.border} shadow-[0_16px_50px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-500 ${className}`}
      style={{
        boxShadow: `0 0 35px ${status.glow}, inset 0 1px 1px rgba(255,255,255,0.12)`,
      }}
    >
      {/* Ambient background light cone & tech grid */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${status.glow} 0%, transparent 65%)`,
        }}
      />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#00f0ff20_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff20_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* Top Header / Telemetry Bar */}
      <div className="relative z-10 px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-white/[0.08] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff] animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-wider text-white font-mono flex items-center gap-1.5">
              Б.А.Р.С. 3D
              <span className="text-[10px] text-cyan-400 font-normal">| Ассистент ОЭЗ</span>
            </span>
            <span className="text-[10px] text-slate-400">Бортовой Аналитик Развития Стратегий</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-medium flex items-center gap-1.5 backdrop-blur-sm ${status.badgeBg}`}
          >
            {status.icon}
            <span className="hidden sm:inline">{status.label}</span>
          </span>

          {/* Toggle Rotation Button */}
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all text-xs ${
              isRotating
                ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-300"
                : "bg-slate-800/60 border-white/10 text-slate-400 hover:text-white"
            }`}
            title={isRotating ? "Остановить вращение 3D" : "Включить авто-вращение"}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} style={{ animationDuration: "8s" }} />
          </button>
        </div>
      </div>

      {/* 3D Holographic Stage Area */}
      <div className={`relative w-full ${compact ? "h-56" : "h-72 sm:h-80"} flex items-center justify-center`}>
        {/* Hologram projection pedestal rings */}
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-12 rounded-[100%] border border-cyan-400/30 bg-cyan-500/5 shadow-[0_0_30px_rgba(0,240,255,0.3)] animate-pulse" />
          <div className="absolute w-36 h-8 rounded-[100%] border border-purple-400/40 bg-purple-500/5" />
          <div className="absolute w-20 h-4 rounded-[100%] border border-white/30" />
        </div>

        {!modelError ? (
          <model-viewer
            ref={modelViewerRef}
            src="/bars.glb"
            alt="Б.А.Р.С. 3D Интерактивный Робот"
            autoplay
            animation-name={activeGesture}
            camera-controls
            touch-action="pan-y"
            disable-zoom
            auto-rotate={isRotating ? true : undefined}
            rotation-per-second="18deg"
            shadow-intensity="1.5"
            shadow-softness="0.75"
            exposure="1.2"
            environment-image="neutral"
            camera-orbit="0deg 80deg 75%"
            camera-target="0m 0.82m 0m"
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
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-mono text-2xl font-bold shadow-[0_0_30px_rgba(0,240,255,0.4)] animate-pulse">
              BARS
            </div>
            <p className="text-xs text-slate-300 mt-3 font-mono">Бортовой Аналитик 3D</p>
          </div>
        )}

        {/* Audio Waveform Equalizer when speaking / analyzing */}
        <div className="absolute bottom-3 left-4 flex items-end gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md pointer-events-none">
          <span className="text-[10px] text-cyan-400 font-mono font-bold mr-1">VOICE:</span>
          {[40, 75, 55, 90, 60, 45, 80].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full ${
                isSpeaking || animation === "talk" ? "bg-cyan-400 animate-pulse" : "bg-slate-600"
              }`}
              style={{
                height: isSpeaking || animation === "talk" ? `${Math.max(6, (h * (i % 2 === 0 ? 1 : 0.7)) / 3)}px` : "6px",
                transition: "height 0.2s ease",
              }}
            />
          ))}
        </div>

        {/* Active Gesture Tag */}
        <div className="absolute bottom-3 right-4 px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md pointer-events-none text-[10px] font-mono text-slate-300">
          ЖЕСТ: <span className="text-cyan-300 font-bold">{activeGestureLabel}</span>
        </div>
      </div>

      {/* Quick Interactive Gesture Triggers */}
      <div className="px-4 py-2 bg-black/40 border-t border-white/[0.06] flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        <span className="text-[10px] text-slate-400 font-mono shrink-0 mr-1 hidden sm:inline">ЖЕСТЫ:</span>
        <div className="flex items-center gap-1.5 w-full justify-between sm:justify-start">
          <button
            onClick={() => triggerGesture("Wave", "Приветствие")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeGestureLabel === "Приветствие"
                ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
            }`}
            title="Помахать рукой / Приветствие"
          >
            <Hand className="w-3 h-3 text-cyan-400" />
            <span>Жест</span>
          </button>

          <button
            onClick={() => triggerGesture("No", "Отказ (BATNA)")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeGestureLabel === "Отказ (BATNA)"
                ? "bg-rose-500/30 text-rose-200 border border-rose-400/50"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
            }`}
            title="Несогласие / Отклонить блеф"
          >
            <Ban className="w-3 h-3 text-rose-400" />
            <span>Отказ</span>
          </button>

          <button
            onClick={() => triggerGesture("ThumbsUp", "Одобрение")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeGestureLabel === "Одобрение"
                ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/50"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
            }`}
            title="Одобрить условия / Класс"
          >
            <ThumbsUp className="w-3 h-3 text-emerald-400" />
            <span>Одобрить</span>
          </button>

          <button
            onClick={() => triggerGesture("Dance", "Триумф сделки")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeGestureLabel === "Триумф сделки"
                ? "bg-purple-500/30 text-purple-200 border border-purple-400/50"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
            }`}
            title="Танец победы сделки"
          >
            <PartyPopper className="w-3 h-3 text-purple-400" />
            <span>Триумф</span>
          </button>

          <button
            onClick={() => triggerGesture("Punch", "Атака / Прессинг")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeGestureLabel === "Атака / Прессинг"
                ? "bg-amber-500/30 text-amber-200 border border-amber-400/50"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
            }`}
            title="Силовой выпад / Прессинг"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Прессинг</span>
          </button>
        </div>
      </div>

      {/* Dynamic Tactical Speech Bubble */}
      {feedbackText && (
        <div className="p-4 bg-gradient-to-r from-slate-900/90 via-[#121422]/90 to-slate-900/90 border-t border-cyan-500/20 backdrop-blur-xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wide text-cyan-300 flex items-center gap-1.5 font-mono uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Тактический инсайт наставника
            </span>
            <span className="text-[10px] text-slate-400 font-mono">LIVE AI</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-black/30 p-2.5 rounded-xl border border-white/5">
            «{feedbackText}»
          </p>

          {onApplyAdvice && (
            <button
              onClick={() => onApplyAdvice(feedbackText)}
              className="mt-1 self-end px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-400/30 text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>Использовать подсказку</span>
              <span className="text-[10px]">↵</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
