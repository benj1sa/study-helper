/**
 * Motivational message library for positive reinforcement.
 */

const completionMessages = [
  "Great job!",
  "You're on fire!",
  "Keep it up!",
  "Excellent work!",
  "You're crushing it!",
  "Amazing progress!",
  "Well done!",
  "Fantastic!",
  "Outstanding!",
  "You're doing great!",
];

const improvementMessages = [
  "You're getting better!",
  "Progress!",
  "Nice improvement!",
  "You're leveling up!",
  "Getting stronger!",
  "Improvement detected!",
  "You're improving!",
  "Way to go!",
  "Keep improving!",
  "You're making progress!",
];

const streakMessages = [
  "Don't break the chain!",
  "Consistency is key!",
  "You're on a roll!",
  "Keep the streak alive!",
  "Maintaining momentum!",
  "Streak going strong!",
  "You're unstoppable!",
  "Keep it consistent!",
  "Building a habit!",
  "Day by day!",
];

const milestoneMessages = [
  "Halfway there!",
  "Almost done!",
  "You did it!",
  "Milestone reached!",
  "Major progress!",
  "You're making it!",
  "Keep pushing forward!",
  "You're getting there!",
  "Great milestone!",
  "Achievement unlocked!",
];

/**
 * Get a random message from a category.
 */
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get a random completion message.
 */
export function getCompletionMessage(): string {
  return getRandomMessage(completionMessages);
}

/**
 * Get a random improvement message.
 */
export function getImprovementMessage(): string {
  return getRandomMessage(improvementMessages);
}

/**
 * Get a streak message with the streak count.
 */
export function getStreakMessage(streak: number): string {
  const baseMessage = getRandomMessage(streakMessages);
  return `${streak} day streak! ${baseMessage}`;
}

/**
 * Get a random milestone message.
 */
export function getMilestoneMessage(): string {
  return getRandomMessage(milestoneMessages);
}

/**
 * Get a custom milestone message with percentage.
 */
export function getProgressMessage(percentage: number): string {
  if (percentage >= 100) {
    return "Complete! You did it!";
  } else if (percentage >= 75) {
    return "Almost there! You're so close!";
  } else if (percentage >= 50) {
    return "Halfway there! Keep going!";
  } else if (percentage >= 25) {
    return "Making progress! Keep it up!";
  } else {
    return "Getting started! You've got this!";
  }
}
