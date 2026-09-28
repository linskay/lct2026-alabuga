import React, { useRef, useState, useEffect } from "react";
import { Play, Settings, Cpu, Sparkles } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { resolveRobotAnimation, MIKE_ANIMATIONS } from "../utils/robotAnimations";

interface HomeScreenProps {
  onEnterArena: () => void;
  onOpenAdmin: () => void;
}

const POKE_REACTIONS = [
  {
    text: "Эй! Я бортовой аналитический ИИ ОЭЗ «Алабуга», а не сенсорный экран!",
    anim: "hit", // flinch / отдергивается
  },
  {
    text: "Не тыкайте в обшивку — квантовая калибровка гироскопов собьётся...",
    anim: "fidget", // отряхивается / поправляет броню
  },
  {
    text: "Хватит нажимать! Лучше готовьте аргументы против блефа Калуги по мощностям.",
    anim: "warn", // недовольная строгая стойка
  },
  {
    text: "Тактическое замечание: на реальных переговорах тыкать в оппонента тоже не стоит!",
    anim: "thinking", // мигает в недоумении
  },
  {
    text: "Мои сенсоры фиксируют избыточное давление на корпус... Давайте уже к делу!",
    anim: "fidget",
  },
  {
    text: "Ладно, проверка связи пройдена. Помни главное: защищай 460 ₽/м² и держи BATNA!",
    anim: "wave", // дружелюбный взмах
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onEnterArena,
  onOpenAdmin,
}) => {
  const modelViewerRef = useRef<any>(null);
  const [activeAnim, setActiveAnim] = useState<string>(MIKE_ANIMATIONS.idle);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const speechIndexRef = useRef<number>(0);
  const timeoutRef = useRef<any>(null);

  // Periodic ambient wave gesture: every ~10 seconds Mike waves hello to the player
  useEffect(() => {
    const waveInterval = setInterval(() => {
      // Don't interrupt user-triggered speech tips
      if (timeoutRef.current) return;

      const viewer = modelViewerRef.current;
      if (viewer) {
        const available = viewer.availableAnimations || [];
        const waveAnim = resolveRobotAnimation("wave", available);
        setActiveAnim(waveAnim);
        viewer.animationName = waveAnim;
        if (viewer.play) {
          viewer.play();
        }

        // Return to idle after waving for 3.2 seconds
        setTimeout(() => {
          if (!timeoutRef.current) {
            const idleAnim = resolveRobotAnimation("idle", available);
            setActiveAnim(idleAnim);
            viewer.animationName = idleAnim;
            if (viewer.play) {
              viewer.play();
            }
          }
        }, 3200);
      }
    }, 10000);

    return () => clearInterval(waveInterval);
  }, []);

  const handleRobotClick = () => {
    triggerHaptic("medium");
    const reaction = POKE_REACTIONS[speechIndexRef.current % POKE_REACTIONS.length];
    speechIndexRef.current += 1;
    setSpeechText(reaction.text);

    const viewer = modelViewerRef.current;
    if (viewer) {
      const available = viewer.availableAnimations || [];
      const chosen = resolveRobotAnimation(reaction.anim, available);
      setActiveAnim(chosen);
      viewer.animationName = chosen;
      if (viewer.play) {
        viewer.play();
      }
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setSpeechText(null);
      const viewer = modelViewerRef.current;
      if (viewer) {
        const available = viewer.availableAnimations || [];
        const idleAnim = resolveRobotAnimation("idle", available);
        setActiveAnim(idleAnim);
        viewer.animationName = idleAnim;
        if (viewer.play) {
          viewer.play();
        }
      }
    }, 4500);
  };

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

      {/* 3. ЦЕНТРАЛЬНАЯ ЧАСТЬ: 3D-модель робота Б.А.Р.С. смещена ближе к кнопкам */}
      <div className="relative z-10 w-full max-w-sm flex-1 flex flex-col items-center justify-end my-0 py-0 min-h-0 overflow-visible">
        {/* Мягкое фоновое рассеянное свечение */}
        <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-[#7b2cbf]/35 via-purple-600/20 to-[#00f0ff]/20 blur-3xl pointer-events-none" />

        {/* Голографический речевой баллон наставника Б.А.Р.С. при клике */}
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

        {/* 3D-моделька с кликом и реакцией */}
        <div
          onClick={handleRobotClick}
          className="w-full h-full relative flex items-center justify-center cursor-pointer group active:scale-98 transition-transform"
          title="Нажмите на робота Б.А.Р.С., чтобы услышать тактический инсайт!"
        >
          <model-viewer
            id="bars-lobby-avatar"
            ref={modelViewerRef}
            src="/mike.glb"
            alt="Робот-наставник Б.А.Р.С. ОЭЗ Алабуга (3D робот)"
            autoplay
            animation-name={activeAnim}
            camera-orbit="0deg 80deg 72%"
            camera-target="0m 0.82m 0m"
            camera-controls
            touch-action="pan-y"
            disable-zoom
            interaction-prompt="none"
            shadow-intensity="1.5"
            shadow-softness="0.7"
            exposure="1.0"
            environment-image="neutral"
            auto-rotate
            rotation-per-second="8deg"
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

      {/* 4. НИЖНЯЯ ЧАСТЬ: 2 крупные удобные кнопки на всю ширину */}
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
