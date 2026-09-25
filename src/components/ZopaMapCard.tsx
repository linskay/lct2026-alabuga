import React from "react";
import { ZopaState } from "../types";
import { ArrowRightLeft, ShieldAlert, Sparkles, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

interface ZopaMapCardProps {
  zopa: ZopaState | null;
  minPriceBatna: number;
}

export const ZopaMapCard: React.FC<ZopaMapCardProps> = ({ zopa, minPriceBatna }) => {
  // Дефолтные значения на старте первого хода
  const state: ZopaState = zopa || {
    buyerMin: 300,
    buyerMax: 420,
    sellerMin: minPriceBatna || 460,
    sellerMax: 500,
    isOverlap: false,
    overlapMin: undefined,
    overlapMax: undefined,
    currentOffer: 300,
    status: "narrowing",
    changeReason: "Оппонент удерживает заниженную планку (300 ₽/м²), коридор сделки пока закрыт.",
  };

  const scaleMin = 280;
  const scaleMax = 520;
  const totalRange = scaleMax - scaleMin;

  const toPercent = (val: number) => {
    const clamped = Math.max(scaleMin, Math.min(scaleMax, val));
    return ((clamped - scaleMin) / totalRange) * 100;
  };

  const sellerLeft = toPercent(state.sellerMin);
  const sellerRight = toPercent(state.sellerMax);
  const sellerWidth = Math.max(2, sellerRight - sellerLeft);

  const buyerLeft = toPercent(state.buyerMin);
  const buyerRight = toPercent(state.buyerMax);
  const buyerWidth = Math.max(2, buyerRight - buyerLeft);

  const overlapLeft = state.overlapMin ? toPercent(state.overlapMin) : 0;
  const overlapRight = state.overlapMax ? toPercent(state.overlapMax) : 0;
  const overlapWidth = state.isOverlap && state.overlapMin && state.overlapMax
    ? Math.max(2, overlapRight - overlapLeft)
    : 0;

  const currentOfferPercent = toPercent(state.currentOffer || state.buyerMin);

  const getStatusBadge = () => {
    switch (state.status) {
      case "agreed":
        return {
          label: "Сделка согласована",
          color: "bg-[#004f58] text-[#9eeffd] border-[#00f0ff]/40",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]" />,
        };
      case "deadlock":
        return {
          label: "Тупик / Схлопывание",
          color: "bg-[#8c1d18] text-[#f9dedc] border-[#f2b8b5]/40",
          icon: <ShieldAlert className="w-3.5 h-3.5 text-[#f2b8b5]" />,
        };
      case "expanding":
        return {
          label: "ZOPA открыта (Коридор найден)",
          color: "bg-[#1b4332] text-[#95d5b2] border-[#52b788]/40",
          icon: <Sparkles className="w-3.5 h-3.5 text-[#74c69d]" />,
        };
      case "narrowing":
      default:
        return {
          label: "Сближение позиций",
          color: "bg-[#4f378b]/40 text-[#d0bcff] border-[#d0bcff]/30",
          icon: <TrendingUp className="w-3.5 h-3.5 text-[#d0bcff]" />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1d1b20] border border-[#49454f]/40 space-y-3 shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-bold text-[#e6e0e9] uppercase tracking-wider">
            Карта ZOPA (Интересы сторон)
          </span>
        </div>
        <span
          className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1.5 ${statusBadge.color}`}
        >
          {statusBadge.icon}
          {statusBadge.label}
        </span>
      </div>

      {/* Dynamic Graphic Scales */}
      <div className="space-y-2.5 pt-1">
        {/* Scale labels ruler */}
        <div className="relative h-4 text-[10px] font-mono text-[#8e8994] select-none">
          <span className="absolute left-0">300 ₽</span>
          <span className="absolute left-[38%] -translate-x-1/2">380 ₽</span>
          <span className="absolute left-[70%] -translate-x-1/2 text-[#00f0ff] font-bold">
            {state.sellerMin} ₽ (BATNA)
          </span>
          <span className="absolute right-0">500 ₽</span>
        </div>

        {/* 1. Bar: ОЭЗ «Алабуга» (Интерес арендодателя) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#cac4d0] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
              Границы ОЭЗ (BATNA):
            </span>
            <span className="text-[#00f0ff] font-mono font-bold">
              {state.sellerMin} – {state.sellerMax} ₽/м²
            </span>
          </div>
          <div className="relative w-full h-3 rounded-full bg-[#2b2930] overflow-hidden border border-[#49454f]/20">
            <div
              className="absolute h-full rounded-full bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] transition-all duration-700 shadow-sm"
              style={{
                left: `${sellerLeft}%`,
                width: `${sellerWidth}%`,
              }}
            />
          </div>
        </div>

        {/* 2. Bar: Оппонент (Инвестор) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#cac4d0] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#d0bcff]" />
              Готовность инвестора:
            </span>
            <span className="text-[#d0bcff] font-mono font-bold">
              {state.buyerMin} – {state.buyerMax} ₽/м²
            </span>
          </div>
          <div className="relative w-full h-3 rounded-full bg-[#2b2930] overflow-hidden border border-[#49454f]/20">
            <div
              className="absolute h-full rounded-full bg-gradient-to-r from-[#7b2cbf] to-[#d0bcff] transition-all duration-700 shadow-sm"
              style={{
                left: `${buyerLeft}%`,
                width: `${buyerWidth}%`,
              }}
            />
            {/* Pointer for current counter offer */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-md z-10"
              style={{ left: `${currentOfferPercent}%` }}
              title={`Текущее предложение: ${state.currentOffer} ₽/м²`}
            />
          </div>
        </div>

        {/* 3. Bar: Зона пересечения (ZOPA Overlap) */}
        <div className="space-y-1 pt-1 border-t border-[#49454f]/20">
          <div className="flex justify-between text-[11px]">
            <span className="text-[#cac4d0] flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  state.isOverlap ? "bg-[#52b788] animate-pulse" : "bg-[#6c757d]"
                }`}
              />
              Зона согласия (ZOPA):
            </span>
            <span
              className={`font-mono font-bold ${
                state.isOverlap ? "text-[#52b788]" : "text-[#8e8994]"
              }`}
            >
              {state.isOverlap && state.overlapMin && state.overlapMax
                ? `[${state.overlapMin} – ${state.overlapMax} ₽/м²]`
                : "Пересечение отсутствует"}
            </span>
          </div>
          <div className="relative w-full h-3.5 rounded-full bg-[#2b2930] overflow-hidden border border-[#49454f]/30">
            {state.isOverlap ? (
              <div
                className="absolute h-full rounded-full bg-gradient-to-r from-[#2d6a4f] via-[#52b788] to-[#74c69d] transition-all duration-700 shadow-md animate-pulse"
                style={{
                  left: `${overlapLeft}%`,
                  width: `${overlapWidth}%`,
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-[#6c757d] italic">
                Разрыв позиций: требуется взаимный размен
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Analytical Commentary */}
      <div className="p-2.5 rounded-xl bg-[#2b2930]/70 border border-[#49454f]/30 text-[11px] leading-relaxed text-[#cac4d0]">
        <span className="font-semibold text-[#e6e0e9]">Динамика: </span>
        {state.changeReason}
      </div>
    </div>
  );
};
