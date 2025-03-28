/**
 * This module provides AI-powered emotional spending analysis.
 * It helps users understand how their emotional state affects their financial decisions
 * and identifies patterns in spending behavior related to mood.
 */

import { 
  MoodEntry, 
  FinancialDecision, 
  SpendingInsight,
  InsertSpendingInsight
} from "@shared/schema";
import { storage } from "../storage";

// Supported mood types
export const MOOD_TYPES = [
  "happy",
  "sad",
  "stressed",
  "anxious",
  "excited",
  "neutral"
];

// Decision types
export const DECISION_TYPES = [
  "loan_application",
  "investment",
  "repayment",
  "withdrawal"
];

// Insight types
export const INSIGHT_TYPES = [
  "pattern",
  "recommendation",
  "warning"
];

// Severity levels
export const SEVERITY_LEVELS = [
  "low",
  "medium",
  "high"
];

interface EmotionalTrigger {
  trigger: string;
  moodType: string;
  strength: number; // 1-10
  description: string;
}

/**
 * Analyze spending behavior based on mood entries and financial decisions
 * to identify emotional triggers and patterns
 * 
 * @param userId The user ID to analyze
 * @returns Array of spending insights
 */
export async function analyzeSpendingBehavior(userId: number): Promise<SpendingInsight[]> {
  // Get all mood entries for the user
  const moodEntries = await storage.getMoodEntriesByUserId(userId);
  
  // Get all financial decisions for the user
  const financialDecisions = await storage.getFinancialDecisionsByUserId(userId);
  
  // Group decisions by mood
  const decisionsByMood = groupDecisionsByMood(moodEntries, financialDecisions);
  
  // Identify patterns and create insights
  const insights: SpendingInsight[] = [];
  
  // Calculate average spending by mood
  const spendingByMood = calculateSpendingByMood(decisionsByMood);
  
  // Identify highest spending mood
  const highestSpendingMood = findHighestSpendingMood(spendingByMood);
  if (highestSpendingMood) {
    const insight: InsertSpendingInsight = {
      userId,
      insightType: "pattern",
      description: `You tend to spend more when you're feeling ${highestSpendingMood.mood}. On average, you spend ₹${highestSpendingMood.average.toFixed(2)} during these times.`,
      relatedMoods: [highestSpendingMood.mood],
      severity: highestSpendingMood.severity
    };
    
    // Add insight to storage and insights array
    const createdInsight = await storage.createSpendingInsight(insight);
    insights.push(createdInsight);
  }
  
  // Identify emotional triggers
  const emotionalTriggers = identifyEmotionalTriggers(decisionsByMood);
  for (const trigger of emotionalTriggers) {
    const insight: InsertSpendingInsight = {
      userId,
      insightType: trigger.strength > 7 ? "warning" : "recommendation",
      description: trigger.description,
      relatedMoods: [trigger.moodType],
      severity: trigger.strength > 7 ? "high" : (trigger.strength > 4 ? "medium" : "low")
    };
    
    // Add insight to storage and insights array
    const createdInsight = await storage.createSpendingInsight(insight);
    insights.push(createdInsight);
  }
  
  return insights;
}

/**
 * Group financial decisions by the mood they were made in
 */
function groupDecisionsByMood(
  moodEntries: MoodEntry[], 
  financialDecisions: FinancialDecision[]
): Record<string, FinancialDecision[]> {
  const decisionsByMood: Record<string, FinancialDecision[]> = {};
  
  // Initialize mood groups
  for (const mood of MOOD_TYPES) {
    decisionsByMood[mood] = [];
  }
  
  // Group decisions with explicit mood connections
  for (const decision of financialDecisions) {
    if (decision.moodId) {
      const moodEntry = moodEntries.find(entry => entry.id === decision.moodId);
      if (moodEntry) {
        decisionsByMood[moodEntry.mood].push(decision);
      }
    }
  }
  
  // Group decisions by date match (same day) for decisions without explicit mood
  for (const decision of financialDecisions) {
    if (!decision.moodId) {
      const decisionDate = typeof decision.decisionDate === 'string'
        ? new Date(decision.decisionDate) 
        : decision.decisionDate;
      
      // Find mood entries from the same day
      const sameDay = moodEntries.filter(entry => {
        const entryDate = typeof entry.entryDate === 'string'
          ? new Date(entry.entryDate)
          : entry.entryDate;
        
        return entryDate.toDateString() === decisionDate.toDateString();
      });
      
      if (sameDay.length > 0) {
        // Use the strongest mood from that day
        const strongestMood = sameDay.reduce((prev, current) => 
          (prev.intensity > current.intensity) ? prev : current
        );
        
        decisionsByMood[strongestMood.mood].push(decision);
      } else {
        // No mood entry for this day, categorize as neutral
        decisionsByMood["neutral"].push(decision);
      }
    }
  }
  
  return decisionsByMood;
}

/**
 * Calculate average spending amount by mood
 */
function calculateSpendingByMood(
  decisionsByMood: Record<string, FinancialDecision[]>
): Array<{ mood: string, average: number, count: number, severity: "low" | "medium" | "high" }> {
  const result: Array<{ 
    mood: string, 
    average: number, 
    count: number,
    severity: "low" | "medium" | "high"
  }> = [];
  
  for (const mood of MOOD_TYPES) {
    const decisions = decisionsByMood[mood];
    if (decisions.length > 0) {
      const totalAmount = decisions.reduce((sum, decision) => {
        // Only count certain decision types for spending analysis
        if (["loan_application", "withdrawal"].includes(decision.decisionType)) {
          return sum + Number(decision.amount);
        }
        return sum;
      }, 0);
      
      const average = totalAmount / decisions.length;
      let severity: "low" | "medium" | "high" = "low";
      
      // Determine severity based on emotional charge of mood and spending
      if (mood === "anxious" || mood === "stressed") {
        severity = average > 10000 ? "high" : (average > 5000 ? "medium" : "low");
      } else if (mood === "excited") {
        severity = average > 15000 ? "high" : (average > 7500 ? "medium" : "low");
      } else if (mood === "sad") {
        severity = average > 8000 ? "high" : (average > 4000 ? "medium" : "low");
      }
      
      result.push({ 
        mood, 
        average, 
        count: decisions.length,
        severity
      });
    }
  }
  
  return result;
}

/**
 * Find the mood associated with highest spending
 */
function findHighestSpendingMood(
  spendingByMood: Array<{ mood: string, average: number, count: number, severity: "low" | "medium" | "high" }>
) {
  if (spendingByMood.length === 0) return null;
  
  // Only consider moods with at least 2 decisions for statistical significance
  const significantMoods = spendingByMood.filter(item => item.count >= 2);
  if (significantMoods.length === 0) return null;
  
  // Sort by average amount in descending order
  return significantMoods.sort((a, b) => b.average - a.average)[0];
}

/**
 * Identify emotional triggers for spending
 */
function identifyEmotionalTriggers(
  decisionsByMood: Record<string, FinancialDecision[]>
): EmotionalTrigger[] {
  const triggers: EmotionalTrigger[] = [];
  
  // Look for stress-induced loan applications
  const stressedDecisions = decisionsByMood["stressed"] || [];
  const stressLoanCount = stressedDecisions.filter(d => d.decisionType === "loan_application").length;
  if (stressLoanCount >= 2) {
    triggers.push({
      trigger: "stress_loans",
      moodType: "stressed",
      strength: Math.min(stressLoanCount * 2, 10),
      description: `You tend to apply for loans when you're feeling stressed. Consider waiting 24 hours before making financial decisions when stressed.`
    });
  }
  
  // Look for impulse decisions when excited
  const excitedDecisions = decisionsByMood["excited"] || [];
  const excitedWithdrawals = excitedDecisions.filter(d => d.decisionType === "withdrawal");
  if (excitedWithdrawals.length >= 2) {
    const totalAmount = excitedWithdrawals.reduce((sum, d) => sum + Number(d.amount), 0);
    const averageAmount = totalAmount / excitedWithdrawals.length;
    
    if (averageAmount > 5000) {
      triggers.push({
        trigger: "excitement_spending",
        moodType: "excited",
        strength: Math.min(8, 4 + excitedWithdrawals.length),
        description: `When excited, you tend to make larger withdrawals (average: ₹${averageAmount.toFixed(2)}). Try implementing a 24-hour cooling-off period for large financial decisions.`
      });
    }
  }
  
  // Look for comfort spending when sad
  const sadDecisions = decisionsByMood["sad"] || [];
  const sadWithdrawals = sadDecisions.filter(d => d.decisionType === "withdrawal");
  if (sadWithdrawals.length >= 2) {
    triggers.push({
      trigger: "comfort_spending",
      moodType: "sad",
      strength: Math.min(sadWithdrawals.length * 1.5, 10),
      description: `You may be turning to "retail therapy" when feeling down. Consider creating a small "feel-good" budget to limit emotional spending when sad.`
    });
  }
  
  return triggers;
}

/**
 * Calculate impulsivity score for a financial decision based on the user's mood
 * 
 * @param decision The financial decision
 * @param moodEntry The associated mood entry
 * @returns Impulsivity score (1-100)
 */
export function calculateImpulsivityScore(
  decision: FinancialDecision, 
  moodEntry: MoodEntry
): number {
  // Base impulsivity factors
  const intensityFactor = moodEntry.intensity * 5; // 5-50 points
  
  // Mood-specific factors
  let moodFactor = 0;
  switch (moodEntry.mood) {
    case "excited":
      moodFactor = 25; // High emotional charge
      break;
    case "stressed":
    case "anxious":
      moodFactor = 20; // Negative but activating
      break;
    case "sad":
      moodFactor = 15; // Negative but less activating
      break;
    case "happy":
      moodFactor = 10; // Positive but still emotional
      break;
    case "neutral":
      moodFactor = 0; // Minimal emotional charge
      break;
    default:
      moodFactor = 5;
  }
  
  // Decision type factors (some decisions are inherently more impulsive)
  let decisionFactor = 0;
  switch (decision.decisionType) {
    case "withdrawal":
      decisionFactor = 20; // Direct spending is more impulsive
      break;
    case "loan_application":
      decisionFactor = 15; // Borrowing is moderately impulsive
      break;
    case "investment":
      decisionFactor = 5; // Investing is less impulsive
      break;
    case "repayment":
      decisionFactor = 0; // Repaying is generally not impulsive
      break;
    default:
      decisionFactor = 10;
  }
  
  // Calculate final score
  let impulsivityScore = intensityFactor + moodFactor + decisionFactor;
  
  // Ensure score is within 1-100 range
  impulsivityScore = Math.max(1, Math.min(100, impulsivityScore));
  
  return impulsivityScore;
}

/**
 * Analyze a new financial decision and mood entry to generate real-time insights
 * 
 * @param decision The new financial decision
 * @param moodEntry The associated mood entry
 * @returns A spending insight if significant, null otherwise
 */
export async function analyzeFinancialDecision(
  decision: FinancialDecision,
  moodEntry: MoodEntry
): Promise<SpendingInsight | null> {
  // Calculate impulsivity score
  const impulsivityScore = calculateImpulsivityScore(decision, moodEntry);
  
  // Update decision with impulsivity score
  await storage.updateFinancialDecision(decision.id, { impulsivityScore });
  
  // Generate insight based on impulsivity score
  if (impulsivityScore > 70) {
    // This is a highly impulsive decision
    const insight: InsertSpendingInsight = {
      userId: decision.userId,
      insightType: "warning",
      description: `This ${decision.decisionType.replace('_', ' ')} appears to be highly impulsive. You might want to reconsider or implement a cooling-off period before finalizing your decision.`,
      relatedMoods: [moodEntry.mood],
      severity: "high"
    };
    
    return await storage.createSpendingInsight(insight);
  } else if (impulsivityScore > 50) {
    // This is a moderately impulsive decision
    const insight: InsertSpendingInsight = {
      userId: decision.userId,
      insightType: "recommendation",
      description: `Your emotional state may be influencing this ${decision.decisionType.replace('_', ' ')}. Consider waiting a day before finalizing.`,
      relatedMoods: [moodEntry.mood],
      severity: "medium"
    };
    
    return await storage.createSpendingInsight(insight);
  }
  
  return null;
}