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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
    >
      <div
        className="w-full max-w-lg rounded-[28px] bg-[#211f26] border-2 border-[#00f0ff]/50 p-4 sm:p-6 shadow-[0_0_40px_rgba(0,240,255,0.25)] flex flex-col items-center text-center space-y-4 relative"
      >
        {/* Close / Return to Chat Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#2b2930] hover:bg-[#36343b] text-[#cac4d0] hover:text-white flex items-center justify-center transition-colors"
          title="Свернуть назад в чат"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Live Speaking Header */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#004f58] border border-[#00f0ff]/40 text-[#9eeffd] text-xs font-semibold">
          <Volume2 className="w-3.5 h-3.5 animate-bounce text-[#00f0ff]" />
          <span>Б.А.Р.С. инструктирует в реальном времени</span>
        </div>

        {/* Large 3D Robot in Hero Mode */}
        <div className="relative my-1">
          <BarsAvatar
            animation={isTyping ? "talk" : animation}
            size="hero"
            autoRotate={true}
            interactive={true}
            className="shadow-2xl"
          />
        </div>

        {/* Typewriter Text Card */}
        <div className="w-full rounded-2xl bg-[#1d1b20] border border-[#49454f]/50 p-4 text-left shadow-inner space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#cac4d0] font-mono border-b border-[#49454f]/30 pb-1.5">
            <span className="flex items-center gap-1.5 text-[#00f0ff]">
              <Sparkles className="w-3.5 h-3.5" /> Анализ диспозиции:
            </span>
            {isTyping && <span className="text-amber-400 animate-pulse">Печатает...</span>}
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-[#e6e0e9] font-sans min-h-[50px]">
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-[#00f0ff] animate-pulse" />}
          </p>
        </div>

        {/* Suggested Action Button (if exists) */}
        {recommendedAction && (
          <div className="w-full">
            <button
              onClick={() => {
                if (onApplyAction) onApplyAction(recommendedAction);
                onClose();
              }}
              className="w-full p-3 rounded-2xl bg-[#2b2930] hover:bg-[#36343b] active:bg-[#49454f] border border-[#d0bcff]/40 text-left flex items-center justify-between group transition-all"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[10px] uppercase font-bold text-[#d0bcff] block">
                  Рекомендуемый контраргумент:
                </span>
                <span className="text-xs text-[#e6e0e9] line-clamp-2">
                  «{recommendedAction}»
                </span>
              </div>
              <ArrowDownRight className="w-5 h-5 text-[#00f0ff] shrink-0 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center gap-2 w-full pt-1">
          {isTyping ? (
            <button
              onClick={() => {
                setDisplayedText(adviceText);
                setIsTyping(false);
              }}
              className="flex-1 h-11 rounded-full bg-[#2b2930] hover:bg-[#36343b] text-[#cac4d0] text-xs font-semibold transition-colors"
            >
              Показать весь текст
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-full bg-[#d0bcff] hover:bg-[#eaddff] active:scale-95 text-[#381e72] text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
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
