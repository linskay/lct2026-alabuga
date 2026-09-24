import React, { useEffect, useRef, useState } from "react";
import { AdminScenarioConfig, NegotiationMetrics, BarsAnimationState } from "../types";
import { ShieldCheck, Mic } from "lucide-react";

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

  // Sync animation and camera parameters
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

      viewer.setAttribute("camera-target", "0m 0.55m 0m");
      viewer.setAttribute("camera-orbit", "0deg 84deg 110%");
      viewer.setAttribute("field-of-view", "32deg");

      if (viewer.availableAnimations && viewer.availableAnimations.length > 0) {
        apply();
      } else {
        viewer.addEventListener("load", apply, { once: true });
      }
    }
  }, [barsAnimation, metrics.tension, metrics.deal_readiness, isLoading, isDealClosed, isDealFailed]);

  // Dynamic stress atmosphere calculation (linear RGB interpolation)
  // Tension: 0-100
  // 0-30%: deep purple #7B2CBF (123, 44, 191)
  // 35-65%: magenta / rose (#C026D3 / #E11D48)
  // 70-100%: warning neon red #EF4444 (239, 68, 68)
  const clampedTension = Math.max(0, Math.min(100, metrics.tension));
  const factor = clampedTension / 100;

  const startColor = { r: 123, g: 44, b: 191 }; // Brand Alabuga purple
  const dangerColor = { r: 239, g: 68, b: 68 }; // Alarm red

  const currentR = Math.round(startColor.r + (dangerColor.r - startColor.r) * factor);
  const currentG = Math.round(startColor.g + (dangerColor.g - startColor.g) * factor);
  const currentB = Math.round(startColor.b + (dangerColor.b - startColor.b) * factor);

  const glowRgba = `rgba(${currentR}, ${currentG}, ${currentB}, ${0.28 + factor * 0.28})`;
  const borderRgba = `rgba(${currentR}, ${currentG}, ${currentB}, ${0.25 + factor * 0.45})`;
  const hexColor = `#${((1 << 24) + (currentR << 16) + (currentG << 8) + currentB).toString(16).slice(1)}`;

  // Stress status badge config
  const getStressBadge = () => {
    if (clampedTension < 40) {
      return {
        label: "СТАТУС: ШТИЛЬ / КОНСТРУКТИВ",
        color: "#C084FC",
        ping: false,
      };
    }
    if (clampedTension < 75) {
      return {
        label: "ДАВЛЕНИЕ РАСТЕТ",
        color: "#F43F5E",
        ping: false,
      };
    }
    return {
      label: "КРИТИЧЕСКИЙ СТРЕСС / ЦЕЙТНОТ",
      color: "#EF4444",
      ping: true,
    };
  };

  const stressBadge = getStressBadge();

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
      className={`relative w-full h-[380px] rounded-3xl overflow-hidden border transition-all duration-700 ease-out flex items-center justify-center bg-[#090a10] shadow-[0_12px_45px_rgba(0,0,0,0.7)] ${className}`}
      style={{
        borderColor: borderRgba,
        boxShadow: `0 12px 45px rgba(0,0,0,0.7), 0 0 35px ${borderRgba}`,
      }}
    >
      {/* 1. Фоновое объемное световое пятно (Glow Spot) - динамически меняет спектр от фиолетового к красному */}
      <div
        id="stage-glow"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[90px] pointer-events-none transition-all duration-700 ease-out"
        style={{ background: glowRgba }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(0,0,0,0)_0%,rgba(9,10,16,0.6)_100%)] pointer-events-none" />

      {/* 2. Мягкое атмосферное пятно под ногами робота (без рамок/бордеров, чтобы не напоминало прогресс-бар) */}
      <div
        className="absolute bottom-3 w-64 h-12 rounded-full blur-xl pointer-events-none transition-all duration-700 ease-out opacity-70 z-0"
        style={{ background: glowRgba }}
      />

      {/* 3. Сам 3D-робот (полностью помещается в экран, отцентрирован по высоте) */}
      {!modelError ? (
        <div className="w-full h-full p-4 flex items-center justify-center relative z-10 pointer-events-none">
          <model-viewer
            id="opponent-3d"
            ref={modelViewerRef}
            src="./bars.glb"
            alt={`${config.opponentName} - 3D Виртуальный переговорщик`}
            autoplay
            animation-name={activeAnim}
            camera-orbit="0deg 84deg 110%"
            camera-target="0m 0.55m 0m"
            field-of-view="32deg"
            interaction-prompt="none"
            shadow-intensity="1.2"
            shadow-softness="0.8"
            exposure="1.1"
            style={
              {
                pointerEvents: "none",
                width: "100%",
                height: "100%",
                position: "relative",
                "--poster-color": "transparent",
              } as any
            }
            onError={() => setModelError(true)}
          >
            {/* Скрываем встроенный прогресс-бар model-viewer */}
            <div slot="progress-bar" style={{ display: "none" }} />
          </model-viewer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-20 h-20 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-xl font-bold font-mono shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            {config.opponentName.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs text-slate-300 mt-3 font-medium">{config.opponentName}</p>
        </div>
      )}

      {/* Плашка статуса оппонента (Верхний левый угол) */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center gap-2 z-20">
        <span className={`w-2 h-2 rounded-full ${status.indicator}`} />
        <span className="text-[11px] font-mono text-slate-300">
          {config.opponentName} {isLoading ? "(Обдумывает...)" : "(В эфире)"}
        </span>
      </div>

      {/* Динамический индикатор тревоги / стресса в правом верхнем углу */}
      <div className="absolute top-3 right-3 flex items-center gap-2 shrink-0 z-20">
        <div
          className="px-3 py-1 rounded-full bg-slate-950/85 border border-white/10 backdrop-blur-md flex items-center gap-2 transition-all duration-500 shadow-md"
          style={{ borderColor: `${borderRgba}` }}
        >
          <span
            id="stress-dot"
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              stressBadge.ping ? "animate-ping" : ""
            }`}
            style={{ backgroundColor: hexColor, boxShadow: `0 0 8px ${hexColor}` }}
          />
          <span
            id="stress-text"
            className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider transition-colors duration-500 uppercase"
            style={{ color: stressBadge.color }}
          >
            {stressBadge.label} ({clampedTension}%)
          </span>
        </div>

        {/* REC Badge */}
        <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-mono font-bold text-red-400 backdrop-blur-md">
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
          <span className="truncate max-w-[180px] sm:max-w-[300px]">{status.text}</span>
        </div>
      </div>
    </div>
  );
};
