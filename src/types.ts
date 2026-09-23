export type ActorRole = "USER" | "OPPONENT" | "BARS";

export type BarsAnimationState = "idle" | "talk" | "warn" | "win";

export type DifficultyLevel = "Новичок ОЭЗ" | "Прожжённый закупщик" | "Гендиректор Алабуги";

export interface NegotiationMetrics {
  trust: number;       // 0..100
  tension: number;     // 0..100
  deal_readiness: number; // 0..100
}

export interface Message {
  id: string;
  actor: ActorRole;
  text: string;
  timestamp: number;
  stepIndex: number;
  snapshotMetrics: NegotiationMetrics;
  tacticalNote?: string;
  barsAnimation?: BarsAnimationState;
  emotion?: "attack" | "compromise" | "bluff" | "neutral";
  emotionLabel?: string;
  emotionEmoji?: string;
  contextHints?: string[];
}

export interface BatnaConfig {
  minPricePerSqm: number;
  maxGracePeriodMonths: number;
  taxHolidayYears: number;
  minJobCreation: number;
  minCapexMillionRub: number;
  redLines: string[];
}

export interface AdminScenarioConfig {
  id: string;
  title: string;
  sphere: "B2B / Инвесторы ОЭЗ" | "Закупки и тендеры" | "HR / Наем топов" | "Внутренний спор";
  opponentRole: string;
  opponentName: string;
  opponentCompany: string;
  opponentPersonality: string;
  personalityTone: "Агрессивный / Прессинг" | "Скрытный манипулятор" | "Бюрократ / Регламент" | "Эмоциональный / Шантаж";
  hiddenGoal: string;
  opponentBatna: string;
  toughnessLevel: number; // 0..100
  bluffTendency: number;  // 0..100
  difficulty: DifficultyLevel;
  zoneCluster: string;
  initialContext: string;
  initialOpponentUtterance?: string;
  initialBarsAdvice?: string;
  targetKpis: string[];
  batna: BatnaConfig;
}

export interface NegotiationSessionSnapshot {
  step: number;
  messages: Message[];
  metrics: NegotiationMetrics;
  lastBarsFeedback: string;
  lastBarsAnimation: BarsAnimationState;
  agenda?: NegotiationAgenda;
  timestamp: number;
}

export interface GeminiResponse {
  opponent_reply: string;
  bars_feedback: string;
  bars_animation: BarsAnimationState;
  metrics: NegotiationMetrics;
  metrics_delta?: {
    trust: number;
    tension: number;
    deal_readiness: number;
  };
  is_batna_violated?: boolean;
  dynamic_hints?: string[];
  context_hints?: string[];
  agenda_status?: Array<{
    topic: string;
    status: "agreed" | "negotiating" | "rejected" | AgendaItemStatus;
  }>;
  is_deal_closed: boolean;
  is_deal_failed: boolean;
  agenda?: NegotiationAgenda;
  manipulation_type?: "none" | "bluff" | "authority_press" | "hurry_trap";
  hidden_need_revealed?: boolean;
  active_counter_offer?: number;
}

export type AgendaItemStatus = "agreed" | "in_progress" | "disputed";

export interface AgendaItem {
  id: "rate" | "grace_period" | "power_capex";
  title: string;
  status: AgendaItemStatus;
  detail: string;
}

export interface NegotiationAgenda {
  rate: AgendaItem;
  grace_period: AgendaItem;
  power_capex: AgendaItem;
}

export interface DebriefingAnalytics {
  finalOutcome: "WON" | "FAILED" | "IN_PROGRESS";
  totalSteps: number;
  timeTravelUsedCount: number;
  trustProgression: number[];
  tensionProgression: number[];
  readinessProgression: number[];
  batnaScore: number; // 0..100%
  stressManagementScore: number; // 0..100%
  overallRating: "S" | "A" | "B" | "C" | "F";
  barsExecutiveSummary: string;
  keyStrengths: string[];
  areasForGrowth: string[];
  hurriedWarning?: string;
  manipulationsHandledCount: number;
  hiddenNeedsDiscovered: boolean;
  mutualTradeOffsEnforced: boolean;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        autoplay?: boolean;
        "animation-name"?: string;
        "camera-controls"?: boolean;
        "disable-zoom"?: boolean;
        "auto-rotate"?: boolean;
        "rotation-per-second"?: string;
        "shadow-intensity"?: string;
        "exposure"?: string;
        "camera-orbit"?: string;
        "camera-target"?: string;
        "field-of-view"?: string;
        "interaction-prompt"?: string;
        style?: React.CSSProperties & { [key: string]: any };
      };
    }
  }
}
