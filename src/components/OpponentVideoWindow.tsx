import React, { useEffect, useRef, useState } from "react";
import { AdminScenarioConfig, NegotiationMetrics, BarsAnimationState } from "../types";
import { Mic, Sparkles, Hand, Shield, ArrowRightLeft, Zap } from "lucide-react";
import { resolveRobotAnimation, MIKE_ANIMATIONS, getEmotionMetadata } from "../utils/robotAnimations";
import { triggerHaptic } from "../utils/haptics";

interface OpponentVideoWindowProps {
  config: AdminScenarioConfig;
  metrics: NegotiationMetrics;
  barsAnimation: BarsAnimationState;
  isLoading: boolean;
  isDealClosed: boolean;
  isDealFailed: boolean;
  className?: string;
  emotion?: "attack" | "compromise" | "bluff" | "neutral";
  emotionLabel?: string;
  emotionEmoji?: string;
  isUserTyping?: boolean;
  lastBarsFeedback?: string;
}

export const OpponentVideoWindow: React.FC<OpponentVideoWindowProps> = ({
  config,
  metrics,
  barsAnimation,
  isLoading,
  isDealClosed,
  isDealFailed,
  className = "",
  emotion = "neutral",
  emotionLabel,
  emotionEmoji,
  isUserTyping = false,
  lastBarsFeedback = "",
}) => {
  const modelViewerRef = useRef<any>(null);
  const [modelError, setModelError] = useState(false);
  const [activeAnim, setActiveAnim] = useState<string>(MIKE_ANIMATIONS.idle);
  const [userInteractionAnim, setUserInteractionAnim] = useState<string | null>(null);
  const [speechBubbleText, setSpeechBubbleText] = useState<string | null>(null);
  const [isFlinching, setIsFlinching] = useState<boolean>(false);
  const toastTimeoutRef = useRef<any>(null);
  const lastProcessedFeedbackRef = useRef<string>("");

  // Detect whether user landed a strong counter-argument / defended bluff from BARS feedback
  useEffect(() => {
    if (!lastBarsFeedback || lastBarsFeedback === lastProcessedFeedbackRef.current) return;
    lastProcessedFeedbackRef.current = lastBarsFeedback;

    const lower = lastBarsFeedback.toLowerCase();
    const isBluffBroken =
      lower.includes("парирован") ||
      lower.includes("отличная защита") ||
      lower.includes("манипуляция отражена") ||
      lower.includes("победа над ловушкой");

    if (isBluffBroken) {
      setIsFlinching(true);
      triggerHaptic("heavy");
      const timer = setTimeout(() => {
        setIsFlinching(false);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [lastBarsFeedback]);

  // Determine automated animation based on live negotiation state and user actions
  const determineAutomatedState = (): string => {
    if (userInteractionAnim) {
      return userInteractionAnim;
    }

    if (isFlinching) {
      return "hit";
    }

    if (isDealClosed) {
      return "win";
    }

    if (isDealFailed) {
      return "death";
    }

    if (isLoading) {
      return "thinking";
    }

    if (isUserTyping) {
      return "listening";
    }

    // Emotion reaction from last response
    if (emotion === "attack") {
      return metrics.tension >= 70 ? "punch" : "warn";
    }

    if (emotion === "bluff") {
      return "bluff";
    }

    if (emotion === "compromise") {
      return "compromise";
    }

    // Tension and readiness thresholds
    if (barsAnimation === "warn" || metrics.tension >= 65) {
      return "warn";
    }

    if (barsAnimation === "win" || metrics.deal_readiness >= 75) {
      return "win";
    }

    if (barsAnimation === "talk") {
      return "talk";
    }

    return "idle";
  };

  // Sync animation and camera parameters
  useEffect(() => {
    const stateKey = determineAutomatedState();

    const viewer = modelViewerRef.current;
    if (viewer) {
      const apply = () => {
        const available: string[] = viewer.availableAnimations || [];
        const match = resolveRobotAnimation(stateKey, available);
        setActiveAnim(match);
        viewer.animationName = match;
        if (viewer.play) {
          viewer.play();
        }
      };

      viewer.setAttribute("camera-target", "0m 0.85m 0m");
      viewer.setAttribute("camera-orbit", "0deg 82deg 75%");
      viewer.setAttribute("field-of-view", "35deg");

      if (viewer.availableAnimations && viewer.availableAnimations.length > 0) {
        apply();
      } else {
        viewer.addEventListener("load", apply, { once: true });
      }
    }
  }, [
    barsAnimation,
    metrics.tension,
    metrics.deal_readiness,
    isLoading,
    isDealClosed,
    isDealFailed,
    emotion,
    isUserTyping,
    isFlinching,
    userInteractionAnim,
  ]);

  // Handle direct click on the 3D model (tactical inspection / user action)
  const handleModelClick = () => {
    triggerHaptic("medium");
    let animToPlay = "talk";
    let toast = `«${config.opponentName}: Слушаю вашу позицию. Предложите конкретные цифры.»`;

    if (isDealClosed) {
      animToPlay = "win";
      toast = `«${config.opponentName}: Протокол согласован. Готовы выходить на подписание!»`;
    } else if (isDealFailed) {
      animToPlay = "death";
      toast = `«${config.opponentName}: Переговоры исчерпаны. Мы уходим к конкурентам.»`;
    } else if (isLoading) {
      animToPlay = "thinking";
      toast = `«${config.opponentName} производит перерасчет финмодели и рисков...»`;
    } else if (isUserTyping) {
      animToPlay = "listening";
      toast = `«${config.opponentName} ожидает формулировку вашего аргумента...»`;
    } else if (metrics.tension >= 65 || emotion === "attack") {
      animToPlay = "punch";
      toast = `«${config.opponentName}: Не давите на меня ставкой! Мой совет директоров требует жестких рамок.»`;
    } else if (emotion === "bluff") {
      animToPlay = "bluff";
      toast = `«${config.opponentName}: В Ульяновске нам дают отличные условия, так что не тяните время.»`;
    } else if (metrics.deal_readiness >= 65 || emotion === "compromise") {
      animToPlay = "compromise";
      toast = `«${config.opponentName}: Ваши условия звучат всё более конструктивно. Обсудим детали.»`;
    }

    setUserInteractionAnim(animToPlay);
    setSpeechBubbleText(toast);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setUserInteractionAnim(null);
      setSpeechBubbleText(null);
    }, 2800);
  };

  // Quick user gesture trigger buttons
  const handleUserTrigger = (type: "wave" | "firm" | "agree" | "counter") => {
    triggerHaptic("light");
    let anim = "idle";
    let text = "";

    switch (type) {
      case "wave":
        anim = "talk";
        text = `«${config.opponentName}: Приветствую. Давайте сразу к сути сделки.»`;
        break;
      case "firm":
        anim = "warn";
        text = `«${config.opponentName}: Вижу, что вы жестко держите красные линии.»`;
        break;
      case "agree":
        anim = "compromise";
        text = `«${config.opponentName}: Зафиксируем этот пункт соглашения в протоколе.»`;
        break;
      case "counter":
        anim = "attack";
        text = `«${config.opponentName}: Встречный выпад принят. Но мы не отступим без уступок!»`;
        break;
    }

    setUserInteractionAnim(anim);
    setSpeechBubbleText(text);

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setUserInteractionAnim(null);
      setSpeechBubbleText(null);
    }, 2800);
  };

  // Dynamic stress atmosphere calculation (linear RGB interpolation)
  const clampedTension = Math.max(0, Math.min(100, metrics.tension));
  const factor = clampedTension / 100;

  const startColor = { r: 123, g: 44, b: 191 }; // Brand Alabuga purple
  const dangerColor = { r: 239, g: 68, b: 68 }; // Alarm red

  const currentR = Math.round(startColor.r + (dangerColor.r - startColor.r) * factor);
  const currentG = Math.round(startColor.g + (dangerColor.g - startColor.g) * factor);
  const currentB = Math.round(startColor.b + (dangerColor.b - startColor.b) * factor);

  const borderRgba = `rgba(${currentR}, ${currentG}, ${currentB}, ${0.25 + factor * 0.45})`;
  const hexColor = `#${((1 << 24) + (currentR << 16) + (currentG << 8) + currentB).toString(16).slice(1)}`;

  // Stress status badge config
  const getStressBadge = () => {
    if (clampedTension < 40) {
      return {
        label: "ШТИЛЬ / КОНСТРУКТИВ",
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
      label: "КРИТИЧЕСКИЙ СТРЕСС",
      color: "#EF4444",
      ping: true,
    };
  };

  const stressBadge = getStressBadge();
  const emotionMeta = getEmotionMetadata(emotion);

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
    if (isFlinching) {
      return {
        text: "Блеф парирован: оппонент ошеломлен вашим аргументом!",
        color: "text-amber-300 bg-amber-950/90 border-amber-400/50 animate-pulse",
        indicator: "bg-amber-400 animate-ping shadow-[0_0_10px_#fbbf24]",
      };
    }
    if (isLoading) {
      return {
        text: `${config.opponentName.split(" ")[0]} обдумывает ваши условия...`,
        color: "text-amber-300 bg-amber-950/80 border-amber-400/40",
        indicator: "bg-amber-400 animate-ping shadow-[0_0_8px_#fbbf24]",
      };
    }
    if (isUserTyping) {
      return {
        text: `${config.opponentName.split(" ")[0]} внимательно слушает формулировку...`,
        color: "text-cyan-300 bg-cyan-950/80 border-cyan-500/40",
        indicator: "bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]",
      };
    }
    if (emotion === "attack" || metrics.tension >= 65) {
      return {
        text: emotionLabel || "Защитная позиция: недоволен давлением или ставкой",
        color: "text-rose-300 bg-rose-950/80 border-rose-500/40",
        indicator: "bg-rose-500 animate-pulse shadow-[0_0_8px_#ff3366]",
      };
    }
    if (emotion === "bluff") {
      return {
        text: emotionLabel || "Проверка границ: оппонент блефует альтернативами",
        color: "text-amber-300 bg-amber-950/80 border-amber-500/40",
        indicator: "bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]",
      };
    }
    if (emotion === "compromise" || metrics.deal_readiness >= 65) {
      return {
        text: emotionLabel || "Благоприятный настрой: готовность к компромиссу",
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
      className={`relative w-full h-[380px] rounded-3xl overflow-hidden border transition-all duration-700 ease-out flex items-center justify-center bg-[#090a10] shadow-[0_12px_45px_rgba(0,0,0,0.7)] group select-none ${className}`}
      style={{
        borderColor: borderRgba,
        boxShadow: `0 12px 45px rgba(0,0,0,0.7), 0 0 35px ${borderRgba}`,
      }}
    >
      {/* 1. Фоновое объемное световое пятно (Glow Spot) */}
      <div
        className="absolute w-[360px] h-[360px] rounded-full blur-[100px] pointer-events-none transition-all duration-700 opacity-60"
        style={{
          background: `radial-gradient(circle, ${hexColor} 0%, rgba(123,44,191,0.2) 60%, transparent 100%)`,
        }}
      />

      {/* Голографический пьедестал стола переговоров */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#06070c] via-[#0e101c]/80 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-4 w-72 h-10 rounded-[100%] border border-cyan-400/20 bg-cyan-500/5 shadow-[0_0_40px_rgba(0,240,255,0.15)] pointer-events-none" />

      {/* 2. 3D-модель (Radical Robot Mike) в окне видеосвязи */}
      {!modelError ? (
        <div
          onClick={handleModelClick}
          className="w-full h-full relative flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-[0.99]"
          title="Нажмите на оппонента для тактической проверки реакции"
        >
          <model-viewer
            id="opponent-3d"
            ref={modelViewerRef}
            src="/bars.glb"
            alt={`${config.opponentName} - 3D Виртуальный переговорщик`}
            autoplay
            animation-name={activeAnim}
            camera-orbit="0deg 82deg 75%"
            camera-target="0m 0.85m 0m"
            field-of-view="35deg"
            interaction-prompt="none"
            shadow-intensity="1.5"
            shadow-softness="0.75"
            exposure="1.2"
            environment-image="neutral"
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

      {/* 3. Голографический речевой баллон при интерактивном клике пользователя */}
      {speechBubbleText && (
        <div className="absolute top-14 inset-x-4 z-30 flex justify-center animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <div className="max-w-md px-4 py-2 rounded-2xl bg-black/85 border border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.35)] backdrop-blur-xl text-center">
            <p className="text-xs sm:text-sm text-cyan-100 font-sans leading-snug drop-shadow-sm font-medium">
              {speechBubbleText}
            </p>
          </div>
        </div>
      )}

      {/* 4. Плашка статуса оппонента и эмоции (Верхний левый угол) */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-20 flex-wrap">
        <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.indicator}`} />
          <span className="text-[11px] font-mono text-slate-200 font-semibold truncate max-w-[130px] sm:max-w-[190px]">
            {config.opponentName}
          </span>
        </div>

        {/* Emotion Pill Badge */}
        <div className="hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-mono text-slate-300">
          <span>{emotionEmoji || emotionMeta.emoji}</span>
          <span className="font-semibold text-white/90">{emotionLabel || emotionMeta.label}</span>
        </div>
      </div>

      {/* 5. Динамический индикатор тревоги / стресса в правом верхнем углу */}
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

      {/* 6. Быстрые тактические жесты пользователя (User Interaction Toolbar) */}
      <div className="absolute bottom-12 inset-x-3 z-20 flex items-center justify-center gap-1.5 sm:gap-2 opacity-85 hover:opacity-100 transition-opacity">
        <div className="px-2 py-1 rounded-full bg-slate-950/80 border border-white/15 backdrop-blur-xl shadow-lg flex items-center gap-1 sm:gap-1.5">
          <span className="text-[9px] font-mono text-slate-400 uppercase mr-1 hidden sm:inline">ЖЕСТ:</span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUserTrigger("wave");
            }}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-cyan-500/25 border border-white/10 hover:border-cyan-400/50 text-[10px] font-medium text-slate-200 hover:text-cyan-200 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Подать приветственный знак"
          >
            <Hand className="w-3 h-3 text-cyan-400" />
            <span>Приветствие</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUserTrigger("firm");
            }}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-amber-500/25 border border-white/10 hover:border-amber-400/50 text-[10px] font-medium text-slate-200 hover:text-amber-200 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Продемонстрировать твердость позиции"
          >
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Твердость</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUserTrigger("agree");
            }}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-emerald-500/25 border border-white/10 hover:border-emerald-400/50 text-[10px] font-medium text-slate-200 hover:text-emerald-200 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Предложить сближение позиций"
          >
            <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
            <span>Сближение</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUserTrigger("counter");
            }}
            className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-rose-500/25 border border-white/10 hover:border-rose-400/50 text-[10px] font-medium text-slate-200 hover:text-rose-200 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            title="Парировать напор встречным вопросом"
          >
            <Zap className="w-3 h-3 text-rose-400" />
            <span>Парировать</span>
          </button>
        </div>
      </div>

      {/* 7. Live Audio / Speaking Indicator Overlay (Нижний левый угол) */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-white/10 backdrop-blur-md">
        <Mic className={`w-3.5 h-3.5 ${isLoading ? "text-amber-400 animate-pulse" : "text-cyan-400"}`} />
        <div className="flex items-end gap-0.5 h-3">
          {[40, 75, 50, 90, 60].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full ${
                isLoading || activeAnim.includes("Wave") || activeAnim.includes("Aggro")
                  ? "bg-cyan-400 animate-pulse"
                  : "bg-slate-600"
              }`}
              style={{
                height:
                  isLoading || activeAnim.includes("Wave")
                    ? `${Math.max(4, h / 7)}px`
                    : "4px",
              }}
            />
          ))}
        </div>
      </div>

      {/* 8. Dynamic State Overlay Ribbon on Video (Нижний правый угол) */}
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
