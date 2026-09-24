import React, { useState, useEffect } from "react";
import { BarsAvatar } from "./BarsAvatar";
import { BarsAnimationState } from "../types";
import { Sparkles, ArrowDownRight, Check, X, Volume2 } from "lucide-react";

interface BarsSpeakingSpotlightProps {
  isOpen: boolean;
  adviceText: string;
  recommendedAction?: string;
  animation?: BarsAnimationState;
  onClose: () => void;
  onApplyAction?: (actionText: string) => void;
}

export const BarsSpeakingSpotlight: React.FC<BarsSpeakingSpotlightProps> = ({
  isOpen,
  adviceText,
  recommendedAction,
  animation = "talk",
  onClose,
  onApplyAction,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  // Typewriter effect
  useEffect(() => {
    if (!isOpen || !adviceText) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);

    let currentIndex = 0;
    const speed = 25; // ms per char

    const timer = setInterval(() => {
      if (currentIndex < adviceText.length) {
        currentIndex++;
        setDisplayedText(adviceText.slice(0, currentIndex));
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [isOpen, adviceText]);

  if (!isOpen) return null;

  return (
    <div
      id="m3-bars-speaking-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
    >
      <div
        className="w-full max-w-lg rounded-[32px] glass-panel-elevated border-2 border-cyan-400/50 p-5 sm:p-6 shadow-[0_0_60px_rgba(0,240,255,0.3)] flex flex-col items-center text-center space-y-4 relative overflow-hidden"
      >
        {/* Ambient glow spotlight in modal */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full glass-pill hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          title="Свернуть назад в чат"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Live Speaking Header */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-semibold backdrop-blur-sm z-10">
          <Volume2 className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
          <span>Б.А.Р.С. инструктирует в реальном времени</span>
        </div>

        {/* Large 3D Robot in Hero Mode */}
        <div className="relative my-1 z-10">
          <BarsAvatar
            animation={isTyping ? "talk" : animation}
            size="hero"
            autoRotate={true}
            interactive={true}
            className="shadow-2xl"
          />
        </div>

        {/* Typewriter Text Card */}
        <div className="w-full rounded-2xl bg-black/50 border border-white/10 p-4 text-left shadow-inner space-y-2 z-10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono border-b border-white/10 pb-1.5">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Анализ диспозиции:
            </span>
            {isTyping && <span className="text-amber-400 font-mono animate-pulse">Печатает...</span>}
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-sans min-h-[50px]">
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" />}
          </p>
        </div>

        {/* Suggested Action Button (if exists) */}
        {recommendedAction && (
          <div className="w-full z-10">
            <button
              onClick={() => {
                if (onApplyAction) onApplyAction(recommendedAction);
                onClose();
              }}
              className="w-full p-3.5 rounded-2xl glass-panel hover:bg-white/10 active:bg-white/15 border border-cyan-400/40 text-left flex items-center justify-between group transition-all cursor-pointer shadow-md"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[10px] uppercase font-bold text-cyan-300 block font-mono">
                  Рекомендуемый контраргумент:
                </span>
                <span className="text-xs text-slate-200 line-clamp-2">
                  «{recommendedAction}»
                </span>
              </div>
              <ArrowDownRight className="w-5 h-5 text-cyan-400 shrink-0 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-2 w-full pt-1 z-10">
          {isTyping ? (
            <button
              onClick={() => {
                setDisplayedText(adviceText);
                setIsTyping(false);
              }}
              className="flex-1 h-11 rounded-full glass-pill hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Показать весь текст
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-95 text-slate-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Понятно, встать назад в чат</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
