import React, { useEffect, useRef, useState } from "react";
import { AdminScenarioConfig, NegotiationMetrics, BarsAnimationState } from "../types";
import { ShieldCheck, Video, Mic } from "lucide-react";

interface OpponentVideoWindowProps {
  config: AdminScenarioConfig;
  metrics: NegotiationMetrics;
  barsAnimation: BarsAnimationState;
  isLoading: boolean;
  isDealClosed: boolean;
  isDealFailed: boolean;
  className?: string;
}

export const OpponentVideoWindow: React.FC<OpponentVideoWindowProps> = ({
  config,
  metrics,
  barsAnimation,
  isLoading,
  isDealClosed,
  isDealFailed,
  className = "",
}) => {
  const modelViewerRef = useRef<any>(null);
  const [modelError, setModelError] = useState(false);
  const [activeAnim, setActiveAnim] = useState<string>("idle");

  // Determine automated animation based on live negotiation state
  const determineAutomatedAnimation = (): string => {
    if (isDealClosed) {
      return "ThumbsUp";
    }
    if (isDealFailed) {
      return "No";
    }
    if (isLoading) {
      return "Standing";
    }
    if (barsAnimation === "warn" || metrics.tension >= 65) {
      return "No";
    }
    if (barsAnimation === "win" || metrics.deal_readiness >= 75) {
      return "ThumbsUp";
    }
    if (barsAnimation === "talk") {
      return "Wave";
    }
    return "Idle";
  };

  // Sync animation and camera target
  useEffect(() => {
    const chosen = determineAutomatedAnimation();
    setActiveAnim(chosen);

    const viewer = modelViewerRef.current;
    if (viewer) {
      const apply = () => {
        const available: string[] = viewer.availableAnimations || [];
        const match = available.find((a) => a.toLowerCase() === chosen.toLowerCase()) || "Idle";
        viewer.animationName = match;
        if (viewer.play) {
          viewer.play();
        }
      };

      // Exact camera parameters requested:
      // camera-target="0m 0.9m 0m", camera-orbit="0deg 75deg 3.5m", field-of-view="32deg"
      viewer.setAttribute("camera-target", "0m 0.9m 0m");
      viewer.setAttribute("camera-orbit", "0deg 75deg 3.5m");
      viewer.setAttribute("field-of-view", "32deg");

      if (viewer.availableAnimations && viewer.availableAnimations.length > 0) {
        apply();
      } else {
        viewer.addEventListener("load", apply, { once: true });
      }
    }
  }, [barsAnimation, metrics.tension, metrics.deal_readiness, isLoading, isDealClosed, isDealFailed]);

  // Determine live status message of the opponent
  const getOpponentStatus = () => {
    if (isDealClosed) {
      return {
        text: "Сделка согласована: готов к подписанию протокола",
        color: "text-emerald-400 bg-emerald-950/80 border-emerald-500/40",
        indicator: "bg-emerald-400 shadow-[0_0_8px_#10b981]",
      };
    }
    if (isDealFailed) {
      return {
        text: "Переговоры сорваны: оппонент отклонил предложение",
        color: "text-rose-400 bg-rose-950/80 border-rose-500/40",
        indicator: "bg-rose-500 shadow-[0_0_8px_#ff3366]",
      };
    }
    if (isLoading) {
      return {
        text: `${config.opponentName.split(" ")[0]} обдумывает ваши условия...`,
        color: "text-amber-300 bg-amber-950/80 border-amber-400/40",
        indicator: "bg-amber-400 animate-ping shadow-[0_0_8px_#fbbf24]",
      };
    }
    if (metrics.tension >= 65) {
      return {
        text: "Защитная позиция: недоволен давлением или ставкой",
        color: "text-rose-300 bg-rose-950/80 border-rose-500/40",
        indicator: "bg-rose-500 animate-pulse shadow-[0_0_8px_#ff3366]",
      };
    }
    if (metrics.deal_readiness >= 65) {
      return {
        text: "Благоприятный настрой: условия устраивают компанию",
        color: "text-emerald-300 bg-emerald-950/80 border-emerald-500/40",
        indicator: "bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]",
      };
    }
    return {
      text: "В прямом эфире • Внимательно слушает аргументацию",
      color: "text-cyan-300 bg-cyan-950/80 border-cyan-500/40",
      indicator: "bg-cyan-400 shadow-[0_0_8px_#00f0ff]",
    };
  };

  const status = getOpponentStatus();

  return (
    <div
      id="opponent-stage"
      className={`relative w-full h-[340px] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-purple-500/20 overflow-hidden flex items-center justify-center transition-all duration-500 shadow-[0_12px_40px_rgba(0,0,0,0.65)] ${
        isLoading ? "border-purple-500/60 shadow-[0_0_40px_rgba(123,44,191,0.35)]" : ""
      } ${className}`}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(99,102,241,0.18)_0%,transparent_70%)] pointer-events-none" />

      {/* 3D Model-Viewer with exact camera parameters */}
      {!modelError ? (
        <model-viewer
          id="opponent-3d"
          ref={modelViewerRef}
          src="./bars.glb"
          alt={`${config.opponentName} - 3D Виртуальный переговорщик`}
          autoplay
          animation-name={activeAnim}
          camera-orbit={isLoading ? "0deg 75deg 3.0m" : "0deg 75deg 3.5m"}
          camera-target="0m 0.9m 0m"
          field-of-view="32deg"
          interaction-prompt="none"
          shadow-intensity="1.5"
          shadow-softness="0.8"
          exposure="1.2"
          style={
            {
              pointerEvents: "none",
              width: "100%",
              height: "100%",
              "--poster-color": "transparent",
            } as any
          }
          onError={() => setModelError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-xl font-bold font-mono shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            {config.opponentName.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs text-slate-300 mt-3 font-medium">{config.opponentName}</p>
        </div>
      )}

      {/* Плашка статуса (Верхний левый угол) */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center gap-2 z-20">
        <span className={`w-2 h-2 rounded-full ${status.indicator}`} />
        <span className="text-[11px] font-mono text-slate-300">
          {config.opponentName} {isLoading ? "(Обдумывает...)" : "(В эфире)"}
        </span>
      </div>

      {/* HD 1080p & REC Badges (Верхний правый угол) */}
      <div className="absolute top-3 right-3 flex items-center gap-2 shrink-0 z-20">
        <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/50 border border-white/10 text-[10px] font-mono text-slate-300 backdrop-blur-md">
          <ShieldCheck className="w-3 h-3 text-cyan-400" />
          <span>HD 1080p</span>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-mono font-bold text-red-400 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>REC</span>
        </div>
      </div>

      {/* Live Audio / Speaking Indicator Overlay (Нижний левый угол) */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md">
        <Mic className={`w-3.5 h-3.5 ${isLoading ? "text-amber-400 animate-pulse" : "text-cyan-400"}`} />
        <div className="flex items-end gap-0.5 h-3">
          {[40, 75, 50, 90, 60].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full ${
                isLoading || activeAnim === "Wave" ? "bg-cyan-400 animate-pulse" : "bg-slate-600"
              }`}
              style={{
                height: isLoading || activeAnim === "Wave" ? `${Math.max(4, h / 7)}px` : "4px",
              }}
            />
          ))}
        </div>
      </div>

      {/* Dynamic State Overlay Ribbon on Video (Нижний правый угол) */}
      <div className="absolute bottom-3 right-3 z-20">
        <div
          className={`px-3 py-1 rounded-full border text-[11px] font-medium backdrop-blur-md flex items-center gap-2 shadow-lg transition-all ${status.color}`}
        >
          <span className={`w-2 h-2 rounded-full ${status.indicator}`} />
          <span className="truncate max-w-[200px] sm:max-w-[320px]">{status.text}</span>
        </div>
      </div>
    </div>
  );
};
