/**
 * Haptic feedback utility supporting Web Vibration API and mobile devices.
 * Gracefully no-ops in environments without vibration support.
 */
export type HapticType = "light" | "medium" | "heavy" | "selection" | "success" | "warning" | "error";

export function triggerHaptic(type: HapticType = "light") {
  if (typeof window === "undefined" || !("navigator" in window) || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case "selection":
      case "light":
        // Crisp subtle tap for tactics and quick action selection
        navigator.vibrate(12);
        break;
      case "medium":
        // Solid action response (e.g., sending counter-argument)
        navigator.vibrate(28);
        break;
      case "heavy":
        // High impact action
        navigator.vibrate(45);
        break;
      case "success":
        // Pulse sequence for deal closed or positive agreement
        navigator.vibrate([15, 40, 30]);
        break;
      case "warning":
        navigator.vibrate([25, 50, 25]);
        break;
      case "error":
        navigator.vibrate([40, 60, 40]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Ignore any browser security restrictions or lack of support
  }
}
