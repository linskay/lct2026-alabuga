import { BarsAnimationState } from "../types";

/**
 * Radical Robot Mike animation mapping & resolver
 * Model: Radical Robots Mike (@TACKO3D)
 * 42 Animations including Idle, Aggro, Wave, Chomp, Jump, Punch, Death, Hit, etc.
 */

export const MIKE_ANIMATIONS = {
  idle: "SK_ZMikeAnim_ZMIKE_Idle",
  idleAggro: "SK_ZMikeAnim_ZMIKE_IdleAggro",
  idleBreaker: "SK_ZMikeAnim_ZMIKE_IdleBreaker",
  blinking: "SK_ZMikeAnim_ZMIKE_Blinking",
  waveLoop: "SK_ZMikeAnim_ZMIKE_WaveLoop",
  waveStart: "SK_ZMikeAnim_ZMIKE_WaveStart",
  waveComplete: "SK_ZMikeAnim_ZMIKE_WaveComplete",
  exitWave: "SK_ZMikeAnim_ZMIKE_ExitWave",
  warn: "SK_ZMikeAnim_ZMIKE_IdleAggro",
  chomp: "SK_ZMikeAnim_ZMIKE_Chomp",
  hit: "SK_ZMikeAnim_ZMIKE_HitRegisterFront",
  death: "SK_ZMikeAnim_ZMIKE_HitRegisterFront_Death",
  punch: "SK_ZMikeAnim_ZMIKE_PunchR",
  punchL: "SK_ZMikeAnim_ZMIKE_PunchL",
  uppercut: "SK_ZMikeAnim_ZMIKE_UppercutR",
  win: "SK_ZMikeAnim_ZMIKE_Jump",
  jump: "SK_ZMikeAnim_ZMIKE_Jump",
  jumpApex: "SK_ZMikeAnim_ZMIKE_JumpApex",
  walk: "SK_ZMikeAnim_ZMIKE_Walk",
  run: "SK_ZMikeAnim_ZMIKE_Run",
};

export interface AnimationMeta {
  name: string;
  label: string;
  emoji: string;
  type: "positive" | "warning" | "danger" | "neutral" | "info";
}

/**
 * Resolves appropriate animation name based on application state and model's available animations.
 * Supports Radical Robot Mike, standard RobotExpressive, and any custom GLB.
 */
export function resolveRobotAnimation(
  state: BarsAnimationState | string,
  availableAnimations: string[] = []
): string {
  const normState = (state || "idle").toLowerCase().trim();

  // If available animations list is not yet loaded, default to Mike presets
  if (!availableAnimations || availableAnimations.length === 0) {
    if (normState === "talk" || normState === "wave" || normState === "speaking") return MIKE_ANIMATIONS.waveLoop;
    if (normState === "warn" || normState === "no" || normState === "danger") return MIKE_ANIMATIONS.idleAggro;
    if (normState === "win" || normState === "thumbsup" || normState === "dance" || normState === "triumph") return MIKE_ANIMATIONS.win;
    if (normState === "attack" || normState === "punch") return MIKE_ANIMATIONS.punch;
    if (normState === "bluff" || normState === "chomp") return MIKE_ANIMATIONS.chomp;
    if (normState === "compromise" || normState === "nod" || normState === "agree") return MIKE_ANIMATIONS.waveComplete;
    if (normState === "death" || normState === "fail") return MIKE_ANIMATIONS.death;
    if (normState === "hit" || normState === "flinch" || normState === "shock") return MIKE_ANIMATIONS.hit;
    if (normState === "thinking" || normState === "listening" || normState === "typing" || normState === "blinking") return MIKE_ANIMATIONS.blinking;
    return MIKE_ANIMATIONS.idle;
  }

  // Check if model has Radical Robot Mike animations
  const isMike = availableAnimations.some((a) => a.startsWith("SK_ZMike"));

  if (isMike) {
    switch (normState) {
      case "talk":
      case "wave":
      case "speaking":
      case "reply":
        return (
          findMatch(availableAnimations, ["WaveLoop", "WaveComplete", "WaveStart", "Idle"]) ||
          MIKE_ANIMATIONS.waveLoop
        );

      case "compromise":
      case "agree":
      case "nod":
      case "yes":
        return (
          findMatch(availableAnimations, ["WaveComplete", "ExitWave", "Jump", "Idle"]) ||
          MIKE_ANIMATIONS.waveComplete
        );

      case "warn":
      case "no":
      case "danger":
      case "stress":
      case "compromised":
        return (
          findMatch(availableAnimations, ["IdleAggro", "Chomp", "HitRegisterFront", "Idle"]) ||
          MIKE_ANIMATIONS.idleAggro
        );

      case "attack":
      case "press":
      case "punch":
        return (
          findMatch(availableAnimations, ["PunchR", "PunchL", "UppercutR", "IdleAggro"]) ||
          MIKE_ANIMATIONS.punch
        );

      case "bluff":
      case "chomp":
      case "threat":
        return (
          findMatch(availableAnimations, ["Chomp", "IdleAggro", "PunchR"]) ||
          MIKE_ANIMATIONS.chomp
        );

      case "win":
      case "thumbsup":
      case "victory":
      case "success":
      case "dance":
      case "triumph":
      case "jump":
        return (
          findMatch(availableAnimations, ["Jump", "WaveComplete", "ExitWave", "Idle"]) ||
          MIKE_ANIMATIONS.jump
        );

      case "death":
      case "fail":
      case "deadlock":
      case "broken":
        return (
          findMatch(availableAnimations, ["HitRegisterFront_Death", "HitRegisterBack", "HitRegisterFront"]) ||
          MIKE_ANIMATIONS.death
        );

      case "hit":
      case "flinch":
      case "shock":
      case "defended":
        return (
          findMatch(availableAnimations, ["HitRegisterFront", "HitRegisterBack", "HitRegisterL", "HitRegisterR"]) ||
          MIKE_ANIMATIONS.hit
        );

      case "thinking":
      case "listening":
      case "typing":
      case "blinking":
      case "loading":
        return (
          findMatch(availableAnimations, ["Blinking", "IdleBreaker", "Idle"]) ||
          MIKE_ANIMATIONS.blinking
        );

      case "fidget":
      case "idlebreaker":
        return (
          findMatch(availableAnimations, ["IdleBreaker", "Blinking", "Idle"]) ||
          MIKE_ANIMATIONS.idleBreaker
        );

      case "walk":
        return (
          findMatch(availableAnimations, ["Walk", "Run"]) ||
          MIKE_ANIMATIONS.walk
        );

      case "idle":
      default:
        return (
          findMatch(availableAnimations, ["Idle", "IdleBreaker", "Blinking"]) ||
          MIKE_ANIMATIONS.idle
        );
    }
  }

  // Fallback for legacy RobotExpressive or generic model
  switch (normState) {
    case "talk":
    case "wave":
    case "speaking":
    case "reply":
      return findMatch(availableAnimations, ["Wave", "Idle"]) || "Wave";

    case "compromise":
    case "agree":
    case "nod":
    case "yes":
      return findMatch(availableAnimations, ["Yes", "ThumbsUp", "Idle"]) || "Yes";

    case "warn":
    case "no":
    case "danger":
    case "stress":
      return findMatch(availableAnimations, ["No", "Death", "Idle"]) || "No";

    case "attack":
    case "punch":
    case "bluff":
      return findMatch(availableAnimations, ["Punch", "No", "Idle"]) || "Punch";

    case "win":
    case "thumbsup":
    case "victory":
    case "success":
      return findMatch(availableAnimations, ["ThumbsUp", "Dance", "Jump", "Idle"]) || "ThumbsUp";

    case "dance":
    case "triumph":
    case "jump":
      return findMatch(availableAnimations, ["Dance", "Jump", "ThumbsUp"]) || "Dance";

    case "death":
    case "fail":
    case "deadlock":
      return findMatch(availableAnimations, ["Death", "No"]) || "Death";

    case "thinking":
    case "listening":
    case "typing":
    case "blinking":
    case "loading":
      return findMatch(availableAnimations, ["Standing", "Idle"]) || "Standing";

    case "idle":
    default:
      return findMatch(availableAnimations, ["Idle", "Standing"]) || availableAnimations[0] || "Idle";
  }
}

function findMatch(available: string[], candidates: string[]): string | null {
  for (const cand of candidates) {
    const found = available.find((a) => a.toLowerCase().includes(cand.toLowerCase()));
    if (found) return found;
  }
  return null;
}

/**
 * Returns human-readable label and visual styling for any robot emotion or gesture state.
 */
export function getEmotionMetadata(state: string): AnimationMeta {
  const norm = (state || "").toLowerCase().trim();

  switch (norm) {
    case "attack":
    case "punch":
      return {
        name: "attack",
        label: "Несогласие / Прессинг",
        emoji: "😠",
        type: "danger",
      };
    case "bluff":
    case "chomp":
      return {
        name: "bluff",
        label: "Блеф / Проверка границ",
        emoji: "⚠️",
        type: "warning",
      };
    case "compromise":
    case "agree":
    case "nod":
      return {
        name: "compromise",
        label: "Сближение / Компромисс",
        emoji: "🤝",
        type: "positive",
      };
    case "win":
    case "victory":
    case "dance":
    case "triumph":
      return {
        name: "win",
        label: "Триумф / Сделка закрыта",
        emoji: "🎉",
        type: "positive",
      };
    case "death":
    case "fail":
      return {
        name: "death",
        label: "Срыв переговоров",
        emoji: "💥",
        type: "danger",
      };
    case "hit":
    case "flinch":
    case "shock":
      return {
        name: "hit",
        label: "Блеф парирован фактами!",
        emoji: "⚡",
        type: "warning",
      };
    case "thinking":
    case "loading":
      return {
        name: "thinking",
        label: "Обдумывает ваши условия...",
        emoji: "🧠",
        type: "info",
      };
    case "listening":
    case "typing":
      return {
        name: "listening",
        label: "Слушает аргумент...",
        emoji: "👂",
        type: "info",
      };
    case "talk":
    case "wave":
    case "speaking":
      return {
        name: "talk",
        label: "Озвучивает встречные условия",
        emoji: "💬",
        type: "info",
      };
    case "warn":
    case "no":
      return {
        name: "warn",
        label: "Отказ / Защита позиции",
        emoji: "✋",
        type: "warning",
      };
    case "idle":
    default:
      return {
        name: "idle",
        label: "В прямом эфире • Внимание",
        emoji: "👁️",
        type: "neutral",
      };
  }
}
