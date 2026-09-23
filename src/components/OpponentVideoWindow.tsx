import React, { useEffect, useRef, useState } from "react";
import { AdminScenarioConfig, NegotiationMetrics, BarsAnimationState } from "../types";
import { ShieldCheck, Video, Mic, Volume2 } from "lucide-react";

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
  const [activeAnim, setActiveAnim] = useState<string>("Idle");

  // Determine automated animation based on live negotiation state
  const determineAutomatedAnimation = (): string => {
    if (isDealClosed) {
      return "ThumbsUp";
    }
    if (isDealFailed) {
      return "No";
    }
    if (isLoading) {
      // Opponent is processing response
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

  // Sync animation automatically whenever states change
  useEffect(() => {
    const chosen = determineAutomatedAnimation();
    setActiveAnim(chosen);

    const viewer = modelViewerRef.current;
    if (viewer) {
      const apply = () => {
        const available: string[] = viewer.availableAnimations || [];
        const finalAnim = available.includes(chosen) ? chosen : "Idle";
        viewer.animationName = finalAnim;
        if (viewer.play) {
          viewer.play();
        }
      };

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
      className={`relative w-full rounded-3xl overflow-hidden border border-white/[0.12] bg-gradient-to-b from-[#131522] via-[#0b0c16] to-[#06070c] shadow-[0_12px_40px_rgba(0,0,0,0.65)] flex flex-col ${className}`}
    >
      {/* Background Studio Lighting & Subtle Tech Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(99,102,241,0.18)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,240,255,0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Video Header / Conference Room HUD */}
      <div className="relative z-10 px-4 py-2.5 flex items-center justify-between border-b border-white/[0.08] bg-[#080911]/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
            <Video className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                {config.opponentName}
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/5 border border-white/10 text-slate-300 hidden sm:inline-block">
                {config.opponentRole}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {config.opponentCompany} • Переговорный зал ОЭЗ «Алабуга»
            </div>
          </div>
        </div>

        {/* Video Call Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[10px] font-mono text-slate-300">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>HD 1080p</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-[10px] font-mono font-bold text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>REC</span>
          </div>
        </div>
      </div>

      {/* 3D Video Viewport: Opponent sitting directly across the negotiation table */}
      <div className="relative w-full h-52 sm:h-64 md:h-72 flex items-center justify-center overflow-hidden">
        {/* Holographic conference table pedestal */}
        <div className="absolute -bottom-10 inset-x-0 h-28 bg-gradient-to-t from-[#05060a] via-[#101222]/80 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-2 w-72 h-10 rounded-[100%] border border-cyan-400/20 bg-cyan-500/5 shadow-[0_0_40px_rgba(0,240,255,0.15)] pointer-events-none" />

        {!modelError ? (
          <model-viewer
            ref={modelViewerRef}
            src="/bars.glb"
            alt={`${config.opponentName} - 3D Виртуальный переговорщик`}
            autoplay
            animation-name={activeAnim}
            camera-controls
            touch-action="pan-y"
            disable-zoom
            shadow-intensity="1.6"
            shadow-softness="0.8"
            exposure="1.2"
            camera-orbit="0deg 78deg 105%"
            camera-target="auto auto auto"
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
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-xl font-bold font-mono shadow-[0_0_30px_rgba(0,240,255,0.3)]">
              {config.opponentName.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-xs text-slate-300 mt-3 font-medium">{config.opponentName}</p>
          </div>
        )}

        {/* Live Audio / Speaking Indicator Overlay */}
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

        {/* Dynamic State Overlay Ribbon on Video */}
        <div className="absolute bottom-3 right-3 z-20">
          <div
            className={`px-3 py-1 rounded-full border text-[11px] font-medium backdrop-blur-md flex items-center gap-2 shadow-lg transition-all ${status.color}`}
          >
            <span className={`w-2 h-2 rounded-full ${status.indicator}`} />
            <span className="truncate max-w-[200px] sm:max-w-[320px]">{status.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
