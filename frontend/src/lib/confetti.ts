import confetti from "canvas-confetti";

/**
 * Triggers a confetti animation originating from the center of the given element.
 * The confetti will burst outward and fall down the screen.
 * 
 * @param element - The HTML element (typically a button) to originate confetti from
 */
export function triggerConfetti(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.right) / 2 / window.innerWidth;
  const y = (rect.top + rect.bottom) / 2 / window.innerHeight;

  confetti({
    particleCount: 75,
    spread: 55,
    origin: { x, y },
    colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"],
    gravity: 0.8,
    ticks: 200,
    decay: 0.9,
  });
}

/**
 * Celebrate a major milestone with larger, more dramatic confetti.
 */
export function celebrateMilestone(element?: HTMLElement): void {
  const origin = element
    ? (() => {
        const rect = element.getBoundingClientRect();
        return {
          x: (rect.left + rect.right) / 2 / window.innerWidth,
          y: (rect.top + rect.bottom) / 2 / window.innerHeight,
        };
      })()
    : { x: 0.5, y: 0.5 };

  // Multiple bursts for dramatic effect
  confetti({
    particleCount: 150,
    spread: 70,
    origin,
    colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"],
    gravity: 0.8,
    ticks: 300,
    decay: 0.9,
  });

  // Second burst after a short delay
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 60,
      origin,
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4"],
      gravity: 0.7,
      ticks: 250,
      decay: 0.85,
    });
  }, 200);
}

/**
 * Celebrate an achievement unlock with achievement-specific confetti.
 */
export function celebrateAchievement(element?: HTMLElement): void {
  const origin = element
    ? (() => {
        const rect = element.getBoundingClientRect();
        return {
          x: (rect.left + rect.right) / 2 / window.innerWidth,
          y: (rect.top + rect.bottom) / 2 / window.innerHeight,
        };
      })()
    : { x: 0.5, y: 0.5 };

  // Gold and rainbow colors for achievements
  confetti({
    particleCount: 120,
    spread: 65,
    origin,
    colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1", "#9B59B6", "#E74C3C"],
    gravity: 0.75,
    ticks: 250,
    decay: 0.9,
  });
}

/**
 * Celebrate a streak milestone with fire-themed confetti.
 */
export function celebrateStreak(element?: HTMLElement): void {
  const origin = element
    ? (() => {
        const rect = element.getBoundingClientRect();
        return {
          x: (rect.left + rect.right) / 2 / window.innerWidth,
          y: (rect.top + rect.bottom) / 2 / window.innerHeight,
        };
      })()
    : { x: 0.5, y: 0.5 };

  // Fire colors (orange, red, yellow)
  confetti({
    particleCount: 100,
    spread: 60,
    origin,
    colors: ["#FF6B35", "#F7931E", "#FFD700", "#FF4500", "#FF6347"],
    gravity: 0.7,
    ticks: 250,
    decay: 0.85,
  });

  // Additional burst for streak celebration
  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 50,
      origin,
      colors: ["#FF6B35", "#F7931E", "#FFD700"],
      gravity: 0.6,
      ticks: 200,
      decay: 0.8,
    });
  }, 150);
}
