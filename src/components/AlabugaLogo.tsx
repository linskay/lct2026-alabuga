import React from "react";

interface AlabugaLogoProps {
  className?: string;
  size?: number | string;
  fill?: string;
  opacity?: number;
  glow?: boolean;
}

/**
 * Фирменный логотип ОЭЗ «Алабуга» (6 массивных сегментов свода арки + центральный ромб)
 * Полностью сплошные полигоны с аккуратными технологическими зазорами (согласно брендбуку и фото).
 */
export const AlabugaLogo: React.FC<AlabugaLogoProps> = ({
  className = "",
  size = 40,
  fill = "currentColor",
  opacity = 1,
  glow = false,
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`${className} ${glow ? "drop-shadow-[0_0_16px_rgba(0,240,255,0.45)]" : ""}`}
      style={{ opacity }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Центральный нижний ромб (Solid Diamond) */}
      <polygon
        points="100,124 126,150 100,176 74,150"
        fill={fill}
      />

      {/* 2. Левое полукружие арки (3 сегмента) */}
      {/* 2.1 Верхний левый сегмент (Top-Left) */}
      <path
        d="M 98.5,17.5 
           Q 81,28 66,43.5 
           L 71.5,91 
           Q 85.5,78 98.5,67.5 
           Z"
        fill={fill}
      />

      {/* 2.2 Средний левый сегмент (Mid-Left) */}
      <path
        d="M 63.5,45.8 
           Q 50,60 38,77 
           L 47,123.5 
           Q 59,107 68.8,93.2 
           Z"
        fill={fill}
      />

      {/* 2.3 Нижний левый сегмент (Bottom-Left) */}
      <path
        d="M 35.8,79.5 
           Q 25,97 16,116 
           L 27.5,158 
           Q 37,141 45,125.5 
           Z"
        fill={fill}
      />

      {/* 3. Правое полукружие арки (3 сегмента - зеркально) */}
      {/* 3.1 Верхний правый сегмент (Top-Right) */}
      <path
        d="M 101.5,17.5 
           Q 119,28 134,43.5 
           L 128.5,91 
           Q 114.5,78 101.5,67.5 
           Z"
        fill={fill}
      />

      {/* 3.2 Средний правый сегмент (Mid-Right) */}
      <path
        d="M 136.5,45.8 
           Q 150,60 162,77 
           L 153,123.5 
           Q 141,107 131.2,93.2 
           Z"
        fill={fill}
      />

      {/* 3.3 Нижний правый сегмент (Bottom-Right) */}
      <path
        d="M 164.2,79.5 
           Q 175,97 184,116 
           L 172.5,158 
           Q 163,141 155,125.5 
           Z"
        fill={fill}
      />
    </svg>
  );
};

/**
 * Полупрозрачная подложка-водяной знак логотипа ОЭЗ «Алабуга» для главного экрана
 */
export const AlabugaWatermark: React.FC<{
  className?: string;
  size?: number | string;
}> = ({ className = "", size = "min(70vh, 520px)" }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Мягкое радиальное свечение в тон логотипа */}
      <div className="absolute w-[440px] h-[440px] rounded-full bg-gradient-to-b from-cyan-500/10 via-purple-600/10 to-transparent blur-3xl" />
      
      {/* Массивный сплошной логотип с градиентной маской прозрачности (10-18% opacity) */}
      <AlabugaLogo
        size={size}
        fill="#FFFFFF"
        opacity={0.09}
        className="transform -translate-y-2 sm:-translate-y-4 scale-105 transition-all duration-700 hover:scale-110 drop-shadow-[0_0_50px_rgba(0,240,255,0.12)]"
      />
    </div>
  );
};

/**
 * Интерактивная кнопка возврата на главный экран с фирменным значком ОЭЗ «Алабуга»
 */
export const AlabugaHomeButton: React.FC<{
  onClick: () => void;
  title?: string;
  className?: string;
}> = ({
  onClick,
  title = "Вернуться на Главный экран",
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 active:bg-slate-950 border border-white/10 hover:border-cyan-400/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(0,240,255,0.25)] ${className}`}
    >
      <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-400/30 group-hover:border-cyan-400 transition-colors">
        <AlabugaLogo
          size={16}
          fill="#00F0FF"
          className="transition-transform duration-200 group-hover:scale-110"
        />
      </div>
      <span className="hidden sm:inline text-xs font-semibold tracking-wider text-slate-200 group-hover:text-white uppercase font-mono">
        Главная
      </span>
    </button>
  );
};
