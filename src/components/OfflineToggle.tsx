import React from "react";
import { Radio, Wifi, WifiOff } from "lucide-react";

interface OfflineToggleProps {
  isOffline: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

export const OfflineToggle: React.FC<OfflineToggleProps> = ({
  isOffline,
  onToggle,
  isLoading = false,
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={`h-9 px-3 rounded-full border flex items-center gap-1.5 text-xs font-sans font-medium transition-all shadow-sm cursor-pointer select-none active:scale-95 disabled:opacity-50 ${
        isOffline
          ? "bg-[#332d41] border-[#f2b8b5]/50 text-[#f2b8b5] hover:bg-[#3d364f]"
          : "bg-[#004f58]/40 border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#004f58]/70"
      }`}
      title={
        isOffline
          ? "Включен автономный режим (Offline Fallback). Кликните, чтобы включить Live OpenRouter."
          : "Включен режим Live OpenRouter. Кликните, чтобы переключить в Offline Fallback."
      }
    >
      {isOffline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 text-[#f2b8b5]" />
          <span className="hidden sm:inline">Offline Demo</span>
          <span className="sm:hidden">Offline</span>
        </>
      ) : (
        <>
          <Wifi className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
          <span className="hidden sm:inline">Live AI</span>
          <span className="sm:hidden">Live</span>
        </>
      )}
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
    </button>
  );
};
