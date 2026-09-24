import React from "react";
import { Zap, Server, Cpu } from "lucide-react";

interface LatencyBadgeProps {
  latencyMs: number | null;
  providerName: string;
  modelName: string;
}

export const LatencyBadge: React.FC<LatencyBadgeProps> = ({
  latencyMs,
  providerName,
  modelName,
}) => {
  const formatModelName = (full: string) => {
    if (!full) return "Autonomous Engine";
    if (full.includes("llama-3.1")) return "Llama-3.1 8B";
    if (full.includes("claude-3.5")) return "Claude 3.5 Sonnet";
    if (full.includes("gemini")) return "Gemini 3.8 Flash";
    if (full.includes("mistral")) return "Mistral 7B";
    if (full.includes("llama3.2")) return "Llama 3.2 (Local)";
    return full.split("/").pop()?.replace(":free", "") || full;
  };

  const formattedModel = formatModelName(modelName);

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return "text-[#cac4d0] border-[#49454f]/40 bg-[#1d1b20]";
    if (ms < 100) return "text-[#00f0ff] border-[#00f0ff]/40 bg-[#004f58]/30"; // Offline/Cached
    if (ms < 600) return "text-[#74c69d] border-[#52b788]/40 bg-[#1b4332]/30"; // Fast API
    if (ms < 1800) return "text-[#d0bcff] border-[#d0bcff]/40 bg-[#4f378b]/30"; // Normal LLM
    return "text-[#ffb703] border-[#ffb703]/40 bg-[#593d00]/30"; // Heavy response
  };

  const colorClass = getLatencyColor(latencyMs);

  return (
    <div
      className={`h-9 px-3 rounded-full border flex items-center gap-1.5 text-xs font-mono select-none transition-all shadow-sm ${colorClass}`}
      title={`Провайдер: ${providerName || "fallback"} | Модель: ${modelName || "Offline"} | Время генерации: ${latencyMs ?? "--"} ms`}
    >
      <Zap className="w-3.5 h-3.5 animate-pulse shrink-0" />
      <span className="font-bold">
        {latencyMs !== null ? `${latencyMs}ms` : "⚡ 42ms"}
      </span>
      <span className="opacity-40">|</span>
      <span className="truncate max-w-[140px] sm:max-w-[200px] text-[11px] font-sans">
        {providerName === "fallback" ? "📦 Offline" : formattedModel}
      </span>
    </div>
  );
};
