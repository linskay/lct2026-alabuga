import React from "react";
import { Play, Settings, ShieldCheck, Sparkles, Cpu, Award } from "lucide-react";

interface HomeScreenProps {
  onEnterArena: () => void;
  onOpenAdmin: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onEnterArena,
  onOpenAdmin,
}) => {
  return (
    <main
      role="main"
      className="relative w-full h-screen max-h-screen h-[100dvh] bg-[#07080D] text-slate-100 flex flex-col justify-between items-center px-4 py-3 sm:py-5 overflow-hidden select-none"
    >
      {/* 1. ИНЖЕНЕРНАЯ МИКРОСЕТКА (Blueprint Grid) + РАДИАЛЬНОЕ СВЕЧЕНИЕ */}
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

      {/* Мягкие акцентные неоновые пятна */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#7b2cbf]/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 2. ВЕРХНЯЯ ЧАСТЬ: Логотип, Заголовок, Подзаголовок */}
      <header className="relative z-10 flex flex-col items-center text-center w-full max-w-md pt-0.5 sm:pt-1 shrink-0">
        {/* Бейдж ОЭЗ 033 */}
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

        {/* Главный заголовок */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          АРЕНА ПЕРЕГОВОРОВ
        </h1>

        {/* Подзаголовок */}
        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 tracking-wide">
          Интерактивный AI-тренажер жестких B2B-сделок
        </p>
      </header>

      {/* 3. ЦЕНТРАЛЬНАЯ ЧАСТЬ: 3D-модель робота Б.А.Р.С. смещена ближе к кнопкам (без полос/прогресс-баров) */}
      <div className="relative z-10 w-full max-w-sm flex-1 flex flex-col items-center justify-end my-0 py-0 min-h-0 overflow-hidden">
        {/* Мягкое фоновое рассеянное свечение (без четких линий и полосок) */}
        <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-[#7b2cbf]/35 via-purple-600/20 to-[#00f0ff]/20 blur-3xl pointer-events-none" />

        {/* 3D-моделька с правильным центрированием и расположением ближе к кнопкам */}
        <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
          <model-viewer
            id="bars-lobby-avatar"
            src="/bars.glb"
            alt="Робот-наставник Б.А.Р.С. ОЭЗ Алабуга"
            autoplay
            animation-name="Idle"
            camera-orbit="0deg 84deg 110%"
            camera-target="0m 0.52m 0m"
            interaction-prompt="none"
            shadow-intensity="1.2"
            shadow-softness="0.9"
            exposure="1.15"
            style={
              {
                width: "100%",
                height: "100%",
                position: "relative",
                zIndex: 10,
                "--poster-color": "transparent",
              } as any
            }
          >
            <div slot="progress-bar" style={{ display: "none" }} />
          </model-viewer>
        </div>

        {/* Компактный бейдж статуса под роботом */}
        <div className="relative z-20 -mt-3 mb-1 px-3 py-0.5 rounded-full bg-slate-950/80 border border-purple-500/30 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
          <Cpu className="w-3 h-3 text-[#00f0ff]" />
          <span className="text-[10px] font-mono text-slate-300 font-semibold">
            Б.А.Р.С. <span className="text-purple-400">ONLINE</span>
          </span>
        </div>
      </div>

      {/* 4. НИЖНЯЯ ЧАСТЬ: Ровно 2 крупные удобные кнопки на всю ширину */}
      <footer className="relative z-10 w-full max-w-md space-y-2.5 pb-1 sm:pb-2 shrink-0">
        {/* Главная кнопка действия (Primary CTA) */}
        <button
          onClick={onEnterArena}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7b2cbf] via-[#9d4edd] to-[#00f0ff] text-slate-950 font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_0_35px_rgba(123,44,191,0.5)] hover:shadow-[0_0_45px_rgba(0,240,255,0.7)] hover:brightness-110 active:scale-[0.985] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
          <span>ВОЙТИ В ПЕРЕГОВОРНУЮ</span>
        </button>

        {/* Второстепенная кнопка (Secondary Outline CTA) */}
        <button
          onClick={onOpenAdmin}
          className="w-full py-2.5 sm:py-3 px-6 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/15 hover:border-[#7b2cbf]/60 text-slate-200 hover:text-white font-bold text-xs sm:text-sm tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2 active:scale-[0.985] cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#00f0ff]" />
          <span>ПАНЕЛЬ АДМИНИСТРАТОРА</span>
        </button>

        {/* Мелкая сноска для жюри */}
        <p className="text-[9px] sm:text-[10px] text-center text-slate-500 font-mono tracking-wider pt-0.5">
          KOTLIN MULTIPLATFORM • COMPOSE UI & WEBASSEMBLY
        </p>
      </footer>
    </main>
  );
};
