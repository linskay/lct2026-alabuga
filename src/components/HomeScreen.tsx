import React, { useState } from "react";
import { Play, Settings, Sparkles, Cpu } from "lucide-react";
import { AlabugaWatermark, AlabugaLogo } from "./AlabugaLogo";
import { triggerHaptic } from "../utils/haptics";

interface HomeScreenProps {
  onEnterArena: () => void;
  onOpenAdmin: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onEnterArena,
  onOpenAdmin,
}) => {
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [robotAnim, setRobotAnim] = useState<"idle" | "wave" | "win">("idle");

  const BARS_TIPS = [
    "Оппонент часто блефует в первых раундах. Требуй прозрачной сметы!",
    "Никогда не уступай без встречного требования. Принцип ОЭЗ «Алабуга»!",
    "Следи за шкалой BATNA: если она упадет ниже 40%, инвестор сорвется.",
    "Налоговые каникулы — твой главный козырь. Прибереги для закрытия сделки.",
    "Индустриальный парк «Синергия» заполнен на 82%. Создавай дефицит площадей!",
  ];

  const handleRobotClick = () => {
    triggerHaptic("heavy");
    const nextAnim = robotAnim === "idle" ? "wave" : robotAnim === "wave" ? "win" : "idle";
    setRobotAnim(nextAnim);
    const randomTip = BARS_TIPS[Math.floor(Math.random() * BARS_TIPS.length)];
    setSpeechText(randomTip);
    setTimeout(() => setSpeechText(null), 4500);
    setTimeout(() => setRobotAnim("idle"), 2500);
  };

  const getAnimStyle = (): React.CSSProperties => {
    switch (robotAnim) {
      case "wave":
        return { animation: "home-robot-wave 1.2s ease-in-out infinite" };
      case "win":
        return { animation: "home-robot-victory 1s ease-in-out infinite" };
      case "idle":
      default:
        return { animation: "home-robot-float 3.5s ease-in-out infinite" };
    }
  };

  const getGlowBorder = (): string => {
    switch (robotAnim) {
      case "wave":
        return "border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.4)]";
      case "win":
        return "border-emerald-400/60 shadow-[0_0_30px_rgba(16,185,129,0.4)]";
      default:
        return "border-purple-500/40 shadow-[0_0_24px_rgba(123,44,191,0.35)]";
    }
  };

  return (
    <main
      role="main"
      className="relative w-full h-screen max-h-screen h-[100dvh] bg-[#07080D] text-slate-100 flex flex-col justify-between items-center px-4 py-3 sm:py-5 overflow-hidden select-none"
    >
      {/* 1. ПОЛУПРОЗРАЧНАЯ ПОДЛОЖКА-ЛОГОТИП ОЭЗ «АЛАБУГА» + ИНЖЕНЕРНАЯ СЕТКА */}
      <AlabugaWatermark />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 65% 55% at 50% 45%, rgba(123, 44, 191, 0.22) 0%, rgba(7, 8, 13, 0.95) 75%),
            linear-gradient(to right, rgba(0, 240, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 28px 28px, 28px 28px",
        }}
      />

      {/* Мягкие акцентные неоновые пятна */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#7b2cbf]/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 2. ХЕДЕР: Типографика 3.1 */}
      <header className="relative z-10 flex flex-col items-center text-center w-full max-w-md pt-0.5 sm:pt-1 shrink-0">
        {/* Бейдж ОЭЗ (033 «Алабуга»): деликатный шрифт, аккуратная миниатюрная иконка */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#121524]/85 border border-[#7b2cbf]/40 shadow-[0_0_16px_rgba(123,44,191,0.3)] backdrop-blur-md mb-2">
          <AlabugaLogo size={11} fill="#00F0FF" className="shrink-0" />
          <span className="text-[9px] sm:text-[10px] font-mono tracking-widest text-[#00f0ff] font-medium">
            ОЭЗ «АЛАБУГА»
          </span>
          <span className="text-[9px] text-slate-500 font-mono">|</span>
          <span className="text-[9px] sm:text-[10px] font-mono text-purple-300 font-normal">
            033
          </span>
        </div>

        {/* Главный заголовок: благородный геометрический гротеск Inter / SF Pro Display, font-weight: ExtraBold, letter-spacing: 2sp (~0.14em) */}
        <h1
          className="text-xl sm:text-2xl md:text-[28px] font-extrabold uppercase text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
            letterSpacing: "0.14em",
          }}
        >
          АРЕНА ПЕРЕГОВОРОВ
        </h1>

        {/* Подзаголовок: только Интерактивный AI-тренажер */}
        <p className="text-[11px] sm:text-xs text-slate-400 font-normal mt-1 tracking-wider font-sans">
          Интерактивный AI-тренажер
        </p>
      </header>

      {/* 3. ЦЕНТРАЛЬНАЯ ЧАСТЬ: Робот-наставник Б.А.Р.С. из ветки ipesterev */}
      <div className="relative z-10 w-full max-w-sm flex-1 flex flex-col items-center justify-end my-0 py-0 min-h-0 overflow-visible">
        {/* Фоновое рассеянное свечение */}
        <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-[#7b2cbf]/35 via-purple-600/20 to-[#00f0ff]/20 blur-3xl pointer-events-none" />

        {/* Всплывающий речевой баллон тактического совета Б.А.Р.С. */}
        {speechText && (
          <div className="absolute -top-4 inset-x-2 z-30 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
            <div className="max-w-xs px-3.5 py-2 rounded-2xl bg-black/90 border border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.4)] backdrop-blur-xl text-center">
              <span className="text-[9px] text-cyan-400 font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1 mb-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                СОВЕТ НАСТАВНИКА Б.А.Р.С.
              </span>
              <p className="text-xs text-white leading-snug font-sans">
                «{speechText}»
              </p>
            </div>
          </div>
        )}

        {/* Аватар робота Б.А.Р.С. (ipesterev) */}
        <div
          onClick={handleRobotClick}
          className="w-full h-full relative flex items-center justify-center cursor-pointer group active:scale-98 transition-transform"
          title="Нажмите на робота Б.А.Р.С., чтобы услышать тактический совет!"
        >
          {/* Анимированный пьедестал свечения */}
          <div
            className="absolute bottom-4 w-48 h-4 rounded-full bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent blur-md pointer-events-none"
            style={{ animation: "home-pedestal-glow 4s ease-in-out infinite" }}
          />

          {/* Контейнер робота */}
          <div
            className={`relative w-52 h-52 sm:w-60 sm:h-60 rounded-3xl overflow-hidden border-2 ${getGlowBorder()} transition-all duration-300`}
            style={getAnimStyle()}
          >
            <img
              src="/bars_avatar.jpg"
              alt="Робот-наставник Б.А.Р.С. ОЭЗ Алабуга"
              className="w-full h-full object-cover object-top"
              draggable={false}
            />

            {/* Эмоциональные цветовые оверлеи */}
            {robotAnim === "wave" && (
              <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none transition-opacity duration-300" />
            )}
            {robotAnim === "win" && (
              <div className="absolute inset-0 bg-emerald-400/10 pointer-events-none transition-opacity duration-300" />
            )}

            {/* Сканирующая полоса визора в режиме ожидания */}
            {robotAnim === "idle" && (
              <div
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none"
                style={{ animation: "bars-visor-scan 3s ease-in-out infinite" }}
              />
            )}
          </div>
        </div>

        {/* Компактный бейдж статуса под роботом */}
        <div
          onClick={handleRobotClick}
          className="relative z-20 -mt-3 mb-1 px-3 py-0.5 rounded-full bg-slate-950/85 border border-purple-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer hover:border-cyan-400/50 transition-colors"
        >
          <Cpu className="w-3 h-3 text-[#00f0ff]" />
          <span className="text-[10px] font-mono text-slate-300 font-semibold">
            Б.А.Р.С. <span className="text-purple-400">ONLINE</span> • НАЖМИТЕ ДЛЯ СОВЕТА
          </span>
        </div>
      </div>

      {/* 4. НИЖНЯЯ ЧАСТЬ: КНОПКИ NEO-B2B CYBER-APPLE (h-14 & h-12, gap-3.5) */}
      <footer className="relative z-10 w-full max-w-md flex flex-col gap-3.5 pb-1 sm:pb-2 shrink-0">
        {/* 1. ГЛАВНАЯ КНОПКА («▶ ВОЙТИ В ПЕРЕГОВОРНУЮ») */}
        <button
          onClick={onEnterArena}
          className="w-full h-14 px-6 rounded-2xl bg-gradient-to-r from-[#7B2CBF] to-[#480CA8] text-white font-bold text-sm sm:text-base tracking-wide uppercase shadow-[0_4px_20px_-2px_rgba(123,44,191,0.5)] hover:shadow-[0_6px_28px_rgba(123,44,191,0.7)] hover:brightness-110 active:scale-[0.985] transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          {/* Аккуратный полупрозрачный контейнер иконки Play */}
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
          <span>ВОЙТИ В ПЕРЕГОВОРНУЮ</span>
        </button>

        {/* 2. ВТОРОСТЕПЕННАЯ КНОПКА («⚙ ПАНЕЛЬ АДМИНИСТРАТОРА»): Glassmorphism */}
        <button
          onClick={onOpenAdmin}
          className="w-full h-12 px-6 rounded-2xl border border-white/10 hover:border-white/40 text-slate-300 hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.18)] font-semibold text-xs sm:text-sm tracking-wide transition-all backdrop-blur-xl flex items-center justify-center gap-2.5 active:scale-[0.985] cursor-pointer shadow-lg group"
          style={{ backgroundColor: "rgba(22, 25, 38, 0.6)" }}
        >
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20 group-hover:border-purple-400/40 transition-colors">
            <Settings className="w-4 h-4 text-purple-400 group-hover:rotate-45 group-hover:text-purple-300 transition-all duration-300" />
          </div>
          <span>ПАНЕЛЬ АДМИНИСТРАТОРА</span>
        </button>

        {/* Название команды и год */}
        <p className="text-[10px] sm:text-[11px] text-center text-slate-400/80 font-mono tracking-wider pt-0.5">
          No PHP — No Problems • 2026
        </p>
      </footer>
    </main>
  );
};
