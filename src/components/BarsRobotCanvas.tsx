import React, { useEffect, useRef } from "react";
import { BarsAnimationState } from "../types";

interface BarsRobotCanvasProps {
  animation: BarsAnimationState;
  className?: string;
}

export const BarsRobotCanvas: React.FC<BarsRobotCanvasProps> = ({ animation, className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      time += 0.035;
      const width = canvas.getBoundingClientRect().width;
      const height = canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      // Floating hover motion
      const hoverOffset = Math.sin(time * 1.8) * 8;
      const cy = height / 2 + hoverOffset;

      // Color scheme based on animation state
      let primaryGlow = "rgba(123, 44, 191, 0.4)"; // Alabuga purple
      let visorColor = "#00f0ff"; // Cyan default
      let pupilColor = "#ffffff";
      let statusText = "SCANNING";

      if (animation === "talk") {
        primaryGlow = "rgba(157, 78, 221, 0.6)";
        visorColor = "#00f0ff";
        statusText = "SYNTHESIZING ADVICE";
      } else if (animation === "warn") {
        primaryGlow = "rgba(255, 51, 102, 0.7)";
        visorColor = "#ff3366";
        pupilColor = "#ffb703";
        statusText = "BATNA COMPROMISED!";
      } else if (animation === "win") {
        primaryGlow = "rgba(16, 185, 129, 0.8)";
        visorColor = "#10b981";
        pupilColor = "#00f0ff";
        statusText = "DEAL SECURED";
      }

      // Background ambient cyber aura
      const radialGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 95);
      radialGrad.addColorStop(0, primaryGlow);
      radialGrad.addColorStop(1, "rgba(13, 14, 18, 0)");
      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fill();

      // Holographic targeting ring (orbiting)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * (animation === "warn" ? 2.5 : 0.8));
      ctx.strokeStyle = animation === "warn" ? "rgba(255, 51, 102, 0.4)" : "rgba(123, 44, 191, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([12, 16]);
      ctx.beginPath();
      ctx.arc(0, 0, 78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Outer Head Armor Plates (Dark Titanium Hexagon)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = "#181a24";
      ctx.strokeStyle = animation === "warn" ? "#ff3366" : "#7b2cbf";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-50, -32);
      ctx.lineTo(0, -60);
      ctx.lineTo(50, -32);
      ctx.lineTo(44, 38);
      ctx.lineTo(0, 58);
      ctx.lineTo(-44, 38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Subtle metallic highlight
      const gradHighlight = ctx.createLinearGradient(-40, -50, 40, 50);
      gradHighlight.addColorStop(0, "rgba(255, 255, 255, 0.15)");
      gradHighlight.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
      gradHighlight.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = gradHighlight;
      ctx.fill();

      // Side Audio Sensors / Antenna fins
      ctx.fillStyle = "#252837";
      ctx.strokeStyle = "#383d54";
      ctx.lineWidth = 1.5;
      // Left fin
      ctx.fillRect(-62, -15, 10, 30);
      ctx.strokeRect(-62, -15, 10, 30);
      // Right fin
      ctx.fillRect(52, -15, 10, 30);
      ctx.strokeRect(52, -15, 10, 30);

      // Neon LED accents on fins
      ctx.fillStyle = visorColor;
      ctx.fillRect(-60, -10 + Math.sin(time * 4) * 4, 3, 8);
      ctx.fillRect(57, -10 + Math.cos(time * 4) * 4, 3, 8);

      // Central Visor Recess
      ctx.fillStyle = "#0c0d12";
      ctx.beginPath();
      ctx.roundRect(-36, -14, 72, 28, 6);
      ctx.fill();
      ctx.strokeStyle = "#2b2f42";
      ctx.stroke();

      // Visor Glow Glass
      ctx.save();
      ctx.clip();

      if (animation === "talk") {
        // Equalizer sound waves
        ctx.strokeStyle = visorColor;
        ctx.lineWidth = 2;
        const waveCount = 9;
        const stepX = 64 / waveCount;
        for (let i = 0; i < waveCount; i++) {
          const waveHeight = Math.abs(Math.sin(time * 6 + i * 0.9)) * 18 + 2;
          const px = -32 + i * stepX + stepX / 2;
          ctx.beginPath();
          ctx.moveTo(px, -waveHeight / 2);
          ctx.lineTo(px, waveHeight / 2);
          ctx.stroke();
        }
      } else if (animation === "warn") {
        // Warning hazard pulse
        const warnPulse = (Math.sin(time * 12) + 1) / 2;
        ctx.fillStyle = `rgba(255, 51, 102, ${0.4 + warnPulse * 0.5})`;
        ctx.fillRect(-36, -14, 72, 28);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("! ALERT !", 0, 4);
      } else if (animation === "win") {
        // Triumph pulse
        ctx.fillStyle = "rgba(16, 185, 129, 0.4)";
        ctx.fillRect(-36, -14, 72, 28);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("VICTORY", 0, 4);
      } else {
        // Idle scanning line
        const scanX = Math.sin(time * 2.5) * 24;
        ctx.fillStyle = visorColor;
        ctx.shadowColor = visorColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(scanX, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = pupilColor;
        ctx.beginPath();
        ctx.arc(scanX, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Chin / Vocal grill
      ctx.strokeStyle = "#383d54";
      ctx.lineWidth = 1.5;
      for (let y = 22; y <= 34; y += 4) {
        ctx.beginPath();
        ctx.moveTo(-16 + (y - 22) * 0.5, y);
        ctx.lineTo(16 - (y - 22) * 0.5, y);
        ctx.stroke();
      }

      // Alabuga Logo crest on forehead
      ctx.fillStyle = animation === "warn" ? "#ff3366" : "#7b2cbf";
      ctx.font = "bold 8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Б.А.Р.С.", 0, -42);

      ctx.restore();

      // Status HUD under the robot
      ctx.fillStyle = visorColor;
      ctx.font = "600 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`[${statusText}]`, cx, height - 12);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animation]);

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer transition-transform duration-300 hover:scale-105"
        style={{ minHeight: "190px" }}
      />
    </div>
  );
};
