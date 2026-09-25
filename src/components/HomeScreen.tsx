import React, { useRef, useState } from "react";
import { Play, Settings, Cpu, Sparkles } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface HomeScreenProps {
  onEnterArena: () => void;
  onOpenAdmin: () => void;
}

const LOBBY_SPEECHES = [
  "Приветствую в ОЭЗ «Алабуга»! Готовы проверить стойкость перед жесткими закупщиками?",
  "Помни золотое правило: защищай ставку 460 ₽/м² и выявляй скрытые дедлайны оппонента!",
  "Не поддавайся на блеф с Калугой: у них дефицит высоковольтных мощностей 110 кВ.",
  "Жми «Войти в переговорную» — разберем встречные аргументы в реальном времени!",
  "Наставник Б.А.Р.С. на связи! Твой главный щит на арене — хладнокровие и BATNA.",
];

// CSS for HomeScreen robot animations
const HOME_ROBOT_STYLES = `
@keyframes home-robot-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.01); }
}
@keyframes home-robot-wave {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
  15% { transform: translateY(-4px) rotate(-2deg) scale(1.03); }
  30% { transform: translateY(-2px) rotate(2deg) scale(1.02); }
  45% { transform: translateY(-5px) rotate(-1deg) scale(1.04); }
  60% { transform: translateY(-3px) rotate(1deg) scale(1.02); }
  80% { transform: translateY(-1px) rotate(0deg) scale(1.01); }
}
@keyframes home-robot-victory {
  0%, 100% { transform: translateY(0) scale(1); filter: brightness(1.1); }
  25% { transform: translateY(-10px) scale(1.06); filter: brightness(1.3) drop-shadow(0 0 20px rgba(16,185,129,0.5)); }
  50% { transform: translateY(-4px) scale(1.02); }
  75% { transform: translateY(-8px) scale(1.05); filter: brightness(1.25) drop-shadow(0 0 15px rgba(0,240,255,0.5)); }
}
@keyframes home-pedestal-glow {
  0%, 100% { box-shadow: 0 0 30px rgba(123,44,191,0.3), 0 0 60px rgba(123,44,191,0.1); }
  50% { box-shadow: 0 0 40px rgba(0,240,255,0.3), 0 0 80px rgba(123,44,191,0.2); }
}
`;

let homeStylesInjected = false;
function injectHomeStyles() {
  if (homeStylesInjected) return;
  const style = document.createElement("style");
  style.textContent = HOME_ROBOT_STYLES;
  document.head.appendChild(style);
  homeStylesInjected = true;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onEnterArena,
  onOpenAdmin,
}) => {
  const [robotAnim, setRobotAnim] = useState<"idle" | "wave" | "win">("idle");
  const [speechText, setSpeechText] = useState<string | null>(null);
  const speechIndexRef = useRef<number>(0);
  const timeoutRef = useRef<any>(null);

  React.useEffect(() => {
    injectHomeStyles();
  }, []);

  const handleRobotClick = () => {
    triggerHaptic("medium");
    const nextSpeech = LOBBY_SPEECHES[speechIndexRef.current % LOBBY_SPEECHES.length];
    speechIndexRef.current += 1;
    setSpeechText(nextSpeech);

    const isWave = speechIndexRef.current % 2 === 1;
    setRobotAnim(isWave ? "wave" : "win");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSpeechText(null);
      setRobotAnim("idle");
    }, 4000);
  };

  const getAnimStyle = (): React.CSSProperties => {
    switch (robotAnim) {
      case "wave":
        return { animation: "home-robot-wave 1.2s ease-in-out infinite" };
      case "win":
        return { animation: "home-robot-victory 1s ease-in-out infinite" };
      case "idle":
      default:
        return { animation: "home-robot-float 3s ease-in-out infinite" };
    }
  };

  const getGlowBorder = (): string => {
    switch (robotAnim) {
      case "wave":
        return "border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.3)]";
      case "win":
        return "border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.3)]";
      default:
        return "border-purple-500/40 shadow-[0_0_20px_rgba(123,44,191,0.3)]";
    }
  };

  return (
    <main
      role="main"
      className="relative w-full h-screen max-h-screen h-[100dvh] bg-[#07080D] text-slate-100 flex flex-col justify-between items-center px-4 py-3 sm:py-5 overflow-hidden select-none"
    >
      {/* 1. Blueprint Grid + Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 65% 55% at 50% 45%, rgba(123, 44, 191, 0.28) 0%, rgba(7, 8, 13, 0.95) 75%),
            linear-gradient(to right, rgba(0, 240, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 28px 28px, 28px 28px",
        }}
      />

      {/* Neon accent spots */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#7b2cbf]/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 2. Header */}
      <header className="relative z-10 flex flex-col items-center text-center w-full max-w-md pt-0.5 sm:pt-1 shrink-0">
        {/* OEZ Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#121524]/90 border border-[#7b2cbf]/50 shadow-[0_0_20px_rgba(123,44,191,0.4)] backdrop-blur-md mb-1.5 sm:mb-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#00f0ff] font-semibold">
            ОЭЗ «АЛАБУГА»
          </span>
          <span className="text-[10px] text-slate-500 font-mono">|</span>
          <span className="text-[10px] sm:text-[11px] font-mono text-purple-300 font-medium">
            ПОЛИГОН #033
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          АРЕНА ПЕРЕГОВОРОВ
        </h1>

        {/* Subtitle */}
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 tracking-wide">
          Интерактивный AI-тренажер жестких B2B-сделок
        </p>
      </header>

      {/* 3. Robot Б.А.Р.С. */}
      <div className="relative z-10 w-full max-w-sm flex-1 flex flex-col items-center justify-end my-0 py-0 min-h-0 overflow-visible">
        {/* Background glow behind robot */}
        <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-[#7b2cbf]/35 via-purple-600/20 to-[#00f0ff]/20 blur-3xl pointer-events-none" />

        {/* Speech Bubble */}
        {speechText && (
          <div className="absolute -top-4 inset-x-2 z-30 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
            <div className="max-w-xs px-3.5 py-2 rounded-2xl bg-black/85 border border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.4)] backdrop-blur-xl text-center">
              <span className="text-[9px] text-cyan-400 font-mono font-bold tracking-wider uppercase block mb-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                СОВЕТ НАСТАВНИКА Б.А.Р.С.
              </span>
              <p className="text-xs text-white leading-snug font-sans">
                «{speechText}»
              </p>
            </div>
          </div>
        )}

        {/* Robot Avatar with CSS Animation */}
        <div
          onClick={handleRobotClick}
          className="w-full h-full relative flex items-center justify-center cursor-pointer group active:scale-98 transition-transform"
          title="Нажмите на робота Б.А.Р.С., чтобы услышать тактический инсайт!"
        >
          {/* Animated pedestal glow */}
          <div
            className="absolute bottom-4 w-48 h-4 rounded-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent blur-md pointer-events-none"
            style={{ animation: "home-pedestal-glow 4s ease-in-out infinite" }}
          />

          {/* Robot Image */}
          <div
            className={`relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden border-2 ${getGlowBorder()} transition-all duration-300`}
            style={getAnimStyle()}
          >
            <img
              src="/bars_avatar.jpg"
              alt="Робот-наставник Б.А.Р.С. ОЭЗ Алабуга"
              className="w-full h-full object-cover object-top"
              draggable={false}
            />

            {/* Emotion color overlay on reaction */}
            {robotAnim === "wave" && (
              <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none transition-opacity duration-300" />
            )}
            {robotAnim === "win" && (
              <div className="absolute inset-0 bg-emerald-400/10 pointer-events-none transition-opacity duration-300" />
            )}

            {/* Scanning visor line for idle */}
            {robotAnim === "idle" && (
              <div
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none"
                style={{ animation: "bars-visor-scan 3s ease-in-out infinite" }}
              />
            )}
          </div>
        </div>

        {/* Status Badge under robot */}
        <div
          onClick={handleRobotClick}
          className="relative z-20 -mt-3 mb-1 px-3 py-0.5 rounded-full bg-slate-950/80 border border-purple-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer hover:border-cyan-400/50 transition-colors"
        >
          <Cpu className="w-3 h-3 text-[#00f0ff]" />
          <span className="text-[10px] font-mono text-slate-300 font-semibold">
            Б.А.Р.С. <span className="text-purple-400">ONLINE</span> • НАЖМИТЕ ДЛЯ СОВЕТА
          </span>
        </div>
      </div>

      {/* 4. Bottom Buttons */}
      <footer className="relative z-10 w-full max-w-md space-y-2.5 pb-1 sm:pb-2 shrink-0">
        {/* Primary CTA */}
        <button
          onClick={onEnterArena}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7b2cbf] via-[#9d4edd] to-[#00f0ff] text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_0_35px_rgba(123,44,191,0.5)] hover:shadow-[0_0_45px_rgba(0,240,255,0.7)] hover:brightness-110 active:scale-[0.985] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
          <span>ВОЙТИ В ПЕРЕГОВОРНУЮ</span>
        </button>

        {/* Secondary CTA */}
        <button
          onClick={onOpenAdmin}
          className="w-full py-2.5 sm:py-3 px-6 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/15 hover:border-[#7b2cbf]/60 text-slate-200 hover:text-white font-bold text-xs sm:text-sm tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2 active:scale-[0.985] cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#00f0ff]" />
          <span>ПАНЕЛЬ АДМИНИСТРАТОРА</span>
        </button>

        {/* Footer note */}
        <p className="text-[9px] sm:text-[10px] text-center text-slate-500 font-mono tracking-wider pt-0.5">
          KOTLIN MULTIPLATFORM • COMPOSE UI &amp; WEBASSEMBLY
        </p>
      </footer>
    </main>
  );
};
