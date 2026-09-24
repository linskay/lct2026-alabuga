import React, { useState } from "react";
import { MethodologyTag } from "../types";
import { Sparkles, AlertCircle, HelpCircle, CheckCircle2, Compass, Info } from "lucide-react";

interface MethodologyTagBadgeProps {
  tag?: MethodologyTag;
}

export const MethodologyTagBadge: React.FC<MethodologyTagBadgeProps> = ({ tag }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!tag) return null;

  const getStyle = () => {
    switch (tag.category) {
      case "ERROR":
        return {
          bg: "bg-[#8c1d18]/30 hover:bg-[#8c1d18]/50 border-[#f2b8b5]/50 text-[#f9dedc]",
          icon: <AlertCircle className="w-3 h-3 text-[#f2b8b5]" />,
          labelPrefix: "Ошибка",
        };
      case "SPIN":
        return {
          bg: "bg-[#004f58]/40 hover:bg-[#004f58]/60 border-[#00f0ff]/40 text-[#9eeffd]",
          icon: <HelpCircle className="w-3 h-3 text-[#00f0ff]" />,
          labelPrefix: "SPIN",
        };
      case "HARVARD":
        return {
          bg: "bg-[#1b4332]/40 hover:bg-[#1b4332]/60 border-[#52b788]/40 text-[#b7e4c7]",
          icon: <CheckCircle2 className="w-3 h-3 text-[#74c69d]" />,
          labelPrefix: "Гарвард",
        };
      case "BATNA":
        return {
          bg: "bg-[#4f378b]/40 hover:bg-[#4f378b]/60 border-[#d0bcff]/40 text-[#eaddff]",
          icon: <Sparkles className="w-3 h-3 text-[#d0bcff]" />,
          labelPrefix: "BATNA",
        };
      case "TACTIC":
      default:
        return {
          bg: "bg-[#36343b]/60 hover:bg-[#36343b] border-[#49454f]/50 text-[#e6e0e9]",
          icon: <Compass className="w-3 h-3 text-[#cac4d0]" />,
          labelPrefix: "Тактика",
        };
    }
  };

  const style = getStyle();

  return (
    <div className="relative inline-block my-1 self-end">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border flex items-center gap-1.5 transition-all shadow-sm cursor-pointer select-none ${style.bg}`}
      >
        {style.icon}
        <span>[{tag.tag}]</span>
        <Info className="w-2.5 h-2.5 opacity-60 ml-0.5" />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 bottom-full mb-1.5 z-30 w-64 p-2.5 rounded-xl bg-[#211f26] border border-[#49454f] text-[11px] text-[#e6e0e9] shadow-xl leading-relaxed animate-in fade-in zoom-in-95 pointer-events-none">
          <div className="font-semibold text-white mb-1 flex items-center gap-1">
            {style.icon}
            <span>{tag.tag}</span>
          </div>
          <p className="text-[#cac4d0]">{tag.description}</p>
        </div>
      )}
    </div>
  );
};
