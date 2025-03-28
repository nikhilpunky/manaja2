/**
 * This module provides AI-based risk assessment for loan applications.
 * It evaluates multiple factors to determine loan eligibility, interest rates,
 * and maximum loan amounts.
 * 
 * In a production environment, this would integrate with ML models and
 * external data providers for more sophisticated risk assessment.
 */

import { User, KycVerification, LoanApplication } from '../../shared/schema';
import { fetchCreditReport } from './creditScore';

// Risk score thresholds
const RISK_SCORE_THRESHOLDS = {
  LOW: 80,
  MEDIUM: 65,
  HIGH: 50,
};

// Define factor weights for risk calculation
const RISK_FACTOR_WEIGHTS = {
  CREDIT_SCORE: 0.35,
  INCOME: 0.25,
  LOAN_TO_VALUE: 0.20,
  EMPLOYMENT_STABILITY: 0.10,
  REPAYMENT_HISTORY: 0.10,
};

// Define penalties for risk factors
const RISK_PENALTIES = {
  EXISTING_LOANS: 10,
  LOW_INCOME: 15,
  HIGH_LOAN_AMOUNT: 20,
  POOR_CREDIT_HISTORY: 25,
};

export interface MutualFundDetails {
  folioNumber: string;
  fundName: string;
  fundType: string;
  nav: number;
  units: number;
  currentValue: number;
  investmentDate: Date;
}

export interface RiskAssessmentInput {
  user: User;
  kyc?: KycVerification;
  loanApplication: LoanApplication;
  creditScore: number;
  mutualFundDetails: MutualFundDetails[];
  existingLoans: boolean;
  employmentType: string;
  employmentDuration: number; // in months
}

export interface RiskAssessmentOutput {
  approved: boolean;
  riskScore: number;
  riskCategory: 'low' | 'medium' | 'high' | 'very_high';
  maxLoanAmount: number;
  suggestedInterestRate: number;
  maxTenure: number;
  rejectionReasons?: string[];
  approvalConditions?: string[];
}

/**
 * Calculate total value of mutual fund portfolio
 */
function calculatePortfolioValue(mutualFunds: MutualFundDetails[]): number {
  return mutualFunds.reduce((total, fund) => total + fund.currentValue, 0);
}

/**
 * Calculate loan-to-value ratio (LTV)
 * This is a key metric in determining risk for loans against mutual funds
 */
function calculateLTV(loanAmount: number, portfolioValue: number): number {
  return (loanAmount / portfolioValue) * 100;
}

/**
 * Determine risk category based on calculated risk score
 */
function getRiskCategory(riskScore: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (riskScore >= RISK_SCORE_THRESHOLDS.LOW) return 'low';
  if (riskScore >= RISK_SCORE_THRESHOLDS.MEDIUM) return 'medium';
  if (riskScore >= RISK_SCORE_THRESHOLDS.HIGH) return 'high';
  return 'very_high';
}

/**
 * Determine maximum loan amount based on portfolio value and risk assessment
 */
function determineMaxLoanAmount(
  portfolioValue: number, 
  riskCategory: 'low' | 'medium' | 'high' | 'very_high'
): number {
  // Define LTV caps based on risk category
  const ltvCaps = {
    low: 0.80, // 80% of portfolio value
    medium: 0.70, // 70% of portfolio value
    high: 0.60, // 60% of portfolio value
    very_high: 0.50, // 50% of portfolio value
  };

  return Math.round(portfolioValue * ltvCaps[riskCategory]);
}

/**
 * Determine suggested interest rate based on risk category
 */
function determineSuggestedInterestRate(
  riskCategory: 'low' | 'medium' | 'high' | 'very_high'
): number {
  // Define base interest rates by risk category
  const baseRates = {
    low: 8.99,
    medium: 10.49,
    high: 11.99,
    very_high: 13.99,
  };

  return baseRates[riskCategory];
}

/**
 * Determine maximum loan tenure based on risk category
 */
function determineMaxTenure(
  riskCategory: 'low' | 'medium' | 'high' | 'very_high'
): number {
  // Define max tenures (in months) by risk category
  const maxTenures = {
    low: 60,
    medium: 48,
    high: 36,
    very_high: 24,
  };

  return maxTenures[riskCategory];
}

/**
 * Calculate income adequacy score based on income and loan amount
 */
function calculateIncomeAdequacyScore(annualIncome: number, loanAmount: number): number {
  // Annual income should ideally be at least 3 times the loan amount for a good score
  const incomeToLoanRatio = annualIncome / loanAmount;
  
  if (incomeToLoanRatio >= 3) return 100;
  if (incomeToLoanRatio >= 2) return 80;
  if (incomeToLoanRatio >= 1.5) return 60;
  if (incomeToLoanRatio >= 1) return 40;
  return 20;
}

/**
 * Calculate employment stability score based on employment type and duration
 */
function calculateEmploymentStabilityScore(employmentType: string, employmentDuration: number): number {
  // Base score by employment type
  let baseScore = 0;
  switch (employmentType.toLowerCase()) {
    case 'salaried':
      baseScore = 90;
      break;
    case 'self-employed-professional':
      baseScore = 80;
      break;
    case 'self-employed-business':
      baseScore = 75;
      break;
    case 'retired':
      baseScore = 70;
      break;
    default:
      baseScore = 60;
  }

  // Adjust for employment duration
  if (employmentDuration >= 60) return Math.min(baseScore + 10, 100); // 5+ years
  if (employmentDuration >= 36) return baseScore; // 3+ years
  if (employmentDuration >= 24) return baseScore - 10; // 2+ years
  if (employmentDuration >= 12) return baseScore - 20; // 1+ year
  return baseScore - 30; // < 1 year
}

/**
 * Evaluate the risk of a loan application using AI-based assessment
 * 
 * @param input All relevant information for risk assessment
 * @returns A comprehensive risk assessment output
 */
export async function evaluateRisk(input: RiskAssessmentInput): Promise<RiskAssessmentOutput> {
  const {
    user,
    kyc,
    loanApplication,
    creditScore,
    mutualFundDetails,
    existingLoans,
    employmentType,
    employmentDuration,
  } = input;

  // Calculate portfolio value and loan-to-value ratio
  const portfolioValue = calculatePortfolioValue(mutualFundDetails);
  const ltv = calculateLTV(Number(loanApplication.amount), portfolioValue);
  
  // Calculate income adequacy
  const incomeAdequacyScore = calculateIncomeAdequacyScore(Number(loanApplication.annualIncome), Number(loanApplication.amount));
  
  // Calculate employment stability
  const employmentStabilityScore = calculateEmploymentStabilityScore(employmentType, employmentDuration);
  
  // Normalize credit score to 0-100 scale (assuming credit score is 300-900)
  const normalizedCreditScore = Math.min(Math.max(((creditScore - 300) / 600) * 100, 0), 100);
  
  // Calculate LTV score (lower LTV is better)
  const ltvScore = Math.max(100 - ltv, 0);
  
  // Calculate base risk score using weighted factors
  let riskScore = 
    normalizedCreditScore * RISK_FACTOR_WEIGHTS.CREDIT_SCORE +
    incomeAdequacyScore * RISK_FACTOR_WEIGHTS.INCOME +
    ltvScore * RISK_FACTOR_WEIGHTS.LOAN_TO_VALUE +
    employmentStabilityScore * RISK_FACTOR_WEIGHTS.EMPLOYMENT_STABILITY;
  
  // Apply penalties for risk factors
  if (existingLoans) {
    riskScore -= RISK_PENALTIES.EXISTING_LOANS;
  }
  
  if (incomeAdequacyScore < 50) {
    riskScore -= RISK_PENALTIES.LOW_INCOME;
  }
  
  if (ltv > 70) {
    riskScore -= RISK_PENALTIES.HIGH_LOAN_AMOUNT;
  }
  
  if (normalizedCreditScore < 50) {
    riskScore -= RISK_PENALTIES.POOR_CREDIT_HISTORY;
  }
  
  // Ensure risk score is between 0 and 100
  riskScore = Math.min(Math.max(riskScore, 0), 100);
  
  // Determine risk category
  const riskCategory = getRiskCategory(riskScore);
  
  // Determine if application should be approved
  const approved = riskScore >= RISK_SCORE_THRESHOLDS.HIGH;
  
  // Determine maximum loan amount
  const maxLoanAmount = determineMaxLoanAmount(portfolioValue, riskCategory);
  
  // Determine suggested interest rate
  const suggestedInterestRate = determineSuggestedInterestRate(riskCategory);
  
  // Determine maximum tenure
  const maxTenure = determineMaxTenure(riskCategory);
  
  // Build rejection reasons if not approved
  const rejectionReasons: string[] = [];
  if (!approved) {
    if (normalizedCreditScore < 50) {
      rejectionReasons.push('Poor credit history');
    }
    
    if (incomeAdequacyScore < 50) {
      rejectionReasons.push('Insufficient income for requested loan amount');
    }
    
    if (ltv > 75) {
      rejectionReasons.push('Requested loan amount too high relative to portfolio value');
    }
    
    if (employmentStabilityScore < 50) {
      rejectionReasons.push('Insufficient employment stability');
    }
  }
  
  // Build approval conditions if approved but with medium or high risk
  const approvalConditions: string[] = [];
  if (approved && (riskCategory === 'medium' || riskCategory === 'high')) {
    if (ltv > 60) {
      approvalConditions.push('Additional mutual fund units to be pledged as collateral');
    }
    
    if (riskCategory === 'high') {
      approvalConditions.push('6-month bank statements required for verification');
      approvalConditions.push('Additional guarantor may be required');
    }
  }
  
  return {
    approved,
    riskScore,
    riskCategory,
    maxLoanAmount,
    suggestedInterestRate,
    maxTenure,
    rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
    approvalConditions: approvalConditions.length > 0 ? approvalConditions : undefined,
  };
}

/**
 * Verify mutual fund ownership and details via NSDL or other providers
 * 
 * @param pan PAN number of the user
 * @param folioNumbers Array of mutual fund folio numbers to verify
 * @returns Array of verified mutual fund details
 */
export async function verifyMutualFunds(pan: string, folioNumbers: string[]): Promise<MutualFundDetails[]> {
  // In a real implementation, this would call NSDL API or other mutual fund
  // repository APIs to verify the ownership and fetch details
  
  // For this MVP, return mock data
  return folioNumbers.map((folioNumber, index) => {
    const isSIP = index % 2 === 0;
    const fundTypes = ['Equity', 'Debt', 'Hybrid', 'Index', 'Liquid'];
    const fundNames = [
      'HDFC Top 100 Fund',
      'SBI Bluechip Fund',
      'Axis Long Term Equity Fund',
      'ICICI Prudential Liquid Fund',
      'Kotak Standard Multicap Fund'
    ];
    
    return {
      folioNumber,
      fundName: fundNames[index % fundNames.length],
      fundType: fundTypes[index % fundTypes.length],
      nav: 250 + (index * 50),
      units: 100 + (index * 20),
      currentValue: (250 + (index * 50)) * (100 + (index * 20)),
      investmentDate: new Date(Date.now() - (index + 1) * 180 * 24 * 60 * 60 * 1000) // random dates in the past
    };
  });
}

/**
 * Calculate maximum eligible loan amount based on user's mutual fund portfolio
 * 
 * @param mutualFunds Array of mutual fund details
 * @param creditScore User's credit score
 * @returns Maximum eligible loan amount
 */
export function calculateMaxEligibleLoanAmount(
  mutualFunds: MutualFundDetails[],
  creditScore: number
): number {
  const portfolioValue = calculatePortfolioValue(mutualFunds);
  
  // Base LTV ratio based on credit score
  let baseLTV = 0.6; // 60% for average scores
  
  if (creditScore >= 750) {
    baseLTV = 0.8; // 80% for excellent scores
  } else if (creditScore >= 650) {
    baseLTV = 0.7; // 70% for good scores
  } else if (creditScore < 600) {
    baseLTV = 0.5; // 50% for poor scores
  }
  
  // Adjust LTV based on fund types (equity funds generally get higher LTV)
  let adjustedLTV = baseLTV;
  const equityRatio = mutualFunds.filter(fund => 
    fund.fundType.toLowerCase().includes('equity')).reduce(
      (sum, fund) => sum + fund.currentValue, 0) / portfolioValue;
  
  // Boost LTV slightly if portfolio has more equity funds (which are usually more liquid)
  if (equityRatio > 0.7) {
    adjustedLTV += 0.05; // Add 5% to LTV if mostly equity funds
  }
  
  // Cap maximum LTV at 80%
  adjustedLTV = Math.min(adjustedLTV, 0.8);
  
  return Math.round(portfolioValue * adjustedLTV);
}