/**
 * This module handles credit score calculation based on various factors
 * such as income, employment type, existing loans, etc.
 * 
 * In a real implementation, this would integrate with CIBIL/CRIF APIs
 * to fetch actual credit scores and reports.
 */

interface CreditScoreInput {
  annualIncome: number;
  employmentType: string;
  hasExistingLoans: boolean;
  loanAmount: number;
  tenure: number;
}

/**
 * Calculates a credit score based on various factors
 * 
 * @param input Various factors to consider for credit scoring
 * @returns A credit score between 300 and 900
 */
export async function calculateCreditScore(input: CreditScoreInput): Promise<number> {
  // In a real implementation, this would call the CIBIL/CRIF API
  // For demo purposes, we'll calculate a synthetic score
  
  let baseScore = 650; // Starting point
  
  // 1. Income Assessment (max +150 points)
  // Higher income increases score
  if (input.annualIncome >= 1500000) { // 15+ lakhs
    baseScore += 150;
  } else if (input.annualIncome >= 1000000) { // 10+ lakhs
    baseScore += 120;
  } else if (input.annualIncome >= 700000) { // 7+ lakhs
    baseScore += 90;
  } else if (input.annualIncome >= 500000) { // 5+ lakhs
    baseScore += 60;
  } else if (input.annualIncome >= 300000) { // 3+ lakhs
    baseScore += 30;
  }
  
  // 2. Employment Type (max +100 points)
  // Stable employment increases score
  switch (input.employmentType) {
    case 'salaried':
      baseScore += 100;
      break;
    case 'self-employed':
      baseScore += 70;
      break;
    case 'business-owner':
      baseScore += 60;
      break;
    case 'unemployed':
      baseScore -= 50; // Penalize unemployment
      break;
    default:
      baseScore += 0;
  }
  
  // 3. Existing Loans (max -50 points)
  // Having existing loans slightly decreases score
  if (input.hasExistingLoans) {
    baseScore -= 50;
  }
  
  // 4. Loan Amount to Income Ratio (max -100 points)
  // Higher ratio decreases score
  const loanToIncomeRatio = input.loanAmount / input.annualIncome;
  if (loanToIncomeRatio > 1) { // Loan amount > annual income
    baseScore -= 100;
  } else if (loanToIncomeRatio > 0.7) {
    baseScore -= 70;
  } else if (loanToIncomeRatio > 0.5) {
    baseScore -= 40;
  } else if (loanToIncomeRatio > 0.3) {
    baseScore -= 20;
  }
  
  // 5. Tenure Assessment (max +50 points)
  // Longer tenures can be better for credit score
  if (input.tenure >= 48) { // 4+ years
    baseScore += 50;
  } else if (input.tenure >= 36) { // 3+ years
    baseScore += 40;
  } else if (input.tenure >= 24) { // 2+ years
    baseScore += 30;
  } else if (input.tenure >= 12) { // 1+ year
    baseScore += 20;
  }
  
  // Ensure score stays within valid range (300-900)
  const finalScore = Math.max(300, Math.min(900, baseScore));
  
  console.log(`[Credit Score] Calculated score: ${finalScore} for income: ${input.annualIncome}, employment: ${input.employmentType}`);
  
  return finalScore;
}

/**
 * Fetches a CIBIL or CRIF credit report for a user
 * 
 * This would be implemented in a production system by integrating
 * with the respective credit bureau APIs
 * 
 * @param pan PAN number of the user
 * @param aadhaar Aadhaar number of the user
 * @returns Credit report data
 */
export async function fetchCreditReport(pan: string, aadhaar: string): Promise<any> {
  // In a real implementation, this would call the CIBIL/CRIF API
  // For the MVP, we'll simulate a credit report
  
  console.log(`[Credit Report] Fetching credit report for PAN: ${pan}, Aadhaar: ${aadhaar.substring(0, 4)}XXXX${aadhaar.substring(8)}`);
  
  // Sample implementation that would be replaced with actual API call
  /*
  const apiKey = process.env.CIBIL_API_KEY || process.env.CRIF_API_KEY;
  const response = await fetch('https://api.cibil.com/v2/credit-report', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      pan: pan,
      aadhaar: aadhaar
    })
  });
  
  return await response.json();
  */
  
  // Simulated credit report for MVP
  return {
    score: 750,
    scoreRange: {
      min: 300,
      max: 900
    },
    reportId: `CR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    reportDate: new Date().toISOString(),
    accountSummary: {
      totalAccounts: 2,
      activeAccounts: 1,
      closedAccounts: 1,
      overdue: 0
    },
    loanAccounts: [
      {
        type: "Personal Loan",
        lender: "Example Bank",
        accountNumber: "XXXX1234",
        status: "Active",
        sanctionAmount: 300000,
        currentBalance: 150000,
        openDate: "2021-05-15",
        lastPaymentDate: "2023-05-01",
        overdueAmount: 0
      },
      {
        type: "Credit Card",
        lender: "Example Card",
        accountNumber: "XXXX5678",
        status: "Closed",
        sanctionAmount: 100000,
        currentBalance: 0,
        openDate: "2019-08-20",
        closureDate: "2022-10-15",
        overdueAmount: 0
      }
    ],
    inquiries: [
      {
        date: "2023-04-10",
        institution: "New Loan Provider"
      }
    ]
  };
}
