var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/utils/riskAssessment.ts
var riskAssessment_exports = {};
__export(riskAssessment_exports, {
  calculateMaxEligibleLoanAmount: () => calculateMaxEligibleLoanAmount,
  evaluateRisk: () => evaluateRisk,
  verifyMutualFunds: () => verifyMutualFunds
});
function calculatePortfolioValue(mutualFunds) {
  return mutualFunds.reduce((total, fund) => total + fund.currentValue, 0);
}
function calculateLTV(loanAmount, portfolioValue) {
  return loanAmount / portfolioValue * 100;
}
function getRiskCategory(riskScore) {
  if (riskScore >= RISK_SCORE_THRESHOLDS.LOW) return "low";
  if (riskScore >= RISK_SCORE_THRESHOLDS.MEDIUM) return "medium";
  if (riskScore >= RISK_SCORE_THRESHOLDS.HIGH) return "high";
  return "very_high";
}
function determineMaxLoanAmount(portfolioValue, riskCategory) {
  const ltvCaps = {
    low: 0.8,
    // 80% of portfolio value
    medium: 0.7,
    // 70% of portfolio value
    high: 0.6,
    // 60% of portfolio value
    very_high: 0.5
    // 50% of portfolio value
  };
  return Math.round(portfolioValue * ltvCaps[riskCategory]);
}
function determineSuggestedInterestRate(riskCategory) {
  const baseRates = {
    low: 8.99,
    medium: 10.49,
    high: 11.99,
    very_high: 13.99
  };
  return baseRates[riskCategory];
}
function determineMaxTenure(riskCategory) {
  const maxTenures = {
    low: 60,
    medium: 48,
    high: 36,
    very_high: 24
  };
  return maxTenures[riskCategory];
}
function calculateIncomeAdequacyScore(annualIncome, loanAmount) {
  const incomeToLoanRatio = annualIncome / loanAmount;
  if (incomeToLoanRatio >= 3) return 100;
  if (incomeToLoanRatio >= 2) return 80;
  if (incomeToLoanRatio >= 1.5) return 60;
  if (incomeToLoanRatio >= 1) return 40;
  return 20;
}
function calculateEmploymentStabilityScore(employmentType, employmentDuration) {
  let baseScore = 0;
  switch (employmentType.toLowerCase()) {
    case "salaried":
      baseScore = 90;
      break;
    case "self-employed-professional":
      baseScore = 80;
      break;
    case "self-employed-business":
      baseScore = 75;
      break;
    case "retired":
      baseScore = 70;
      break;
    default:
      baseScore = 60;
  }
  if (employmentDuration >= 60) return Math.min(baseScore + 10, 100);
  if (employmentDuration >= 36) return baseScore;
  if (employmentDuration >= 24) return baseScore - 10;
  if (employmentDuration >= 12) return baseScore - 20;
  return baseScore - 30;
}
async function evaluateRisk(input) {
  const {
    user,
    kyc,
    loanApplication,
    creditScore,
    mutualFundDetails,
    existingLoans,
    employmentType,
    employmentDuration
  } = input;
  const portfolioValue = calculatePortfolioValue(mutualFundDetails);
  const ltv = calculateLTV(Number(loanApplication.amount), portfolioValue);
  const incomeAdequacyScore = calculateIncomeAdequacyScore(Number(loanApplication.annualIncome), Number(loanApplication.amount));
  const employmentStabilityScore = calculateEmploymentStabilityScore(employmentType, employmentDuration);
  const normalizedCreditScore = Math.min(Math.max((creditScore - 300) / 600 * 100, 0), 100);
  const ltvScore = Math.max(100 - ltv, 0);
  let riskScore = normalizedCreditScore * RISK_FACTOR_WEIGHTS.CREDIT_SCORE + incomeAdequacyScore * RISK_FACTOR_WEIGHTS.INCOME + ltvScore * RISK_FACTOR_WEIGHTS.LOAN_TO_VALUE + employmentStabilityScore * RISK_FACTOR_WEIGHTS.EMPLOYMENT_STABILITY;
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
  riskScore = Math.min(Math.max(riskScore, 0), 100);
  const riskCategory = getRiskCategory(riskScore);
  const approved = riskScore >= RISK_SCORE_THRESHOLDS.HIGH;
  const maxLoanAmount = determineMaxLoanAmount(portfolioValue, riskCategory);
  const suggestedInterestRate = determineSuggestedInterestRate(riskCategory);
  const maxTenure = determineMaxTenure(riskCategory);
  const rejectionReasons = [];
  if (!approved) {
    if (normalizedCreditScore < 50) {
      rejectionReasons.push("Poor credit history");
    }
    if (incomeAdequacyScore < 50) {
      rejectionReasons.push("Insufficient income for requested loan amount");
    }
    if (ltv > 75) {
      rejectionReasons.push("Requested loan amount too high relative to portfolio value");
    }
    if (employmentStabilityScore < 50) {
      rejectionReasons.push("Insufficient employment stability");
    }
  }
  const approvalConditions = [];
  if (approved && (riskCategory === "medium" || riskCategory === "high")) {
    if (ltv > 60) {
      approvalConditions.push("Additional mutual fund units to be pledged as collateral");
    }
    if (riskCategory === "high") {
      approvalConditions.push("6-month bank statements required for verification");
      approvalConditions.push("Additional guarantor may be required");
    }
  }
  return {
    approved,
    riskScore,
    riskCategory,
    maxLoanAmount,
    suggestedInterestRate,
    maxTenure,
    rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : void 0,
    approvalConditions: approvalConditions.length > 0 ? approvalConditions : void 0
  };
}
async function verifyMutualFunds(pan, folioNumbers) {
  return folioNumbers.map((folioNumber, index) => {
    const isSIP = index % 2 === 0;
    const fundTypes = ["Equity", "Debt", "Hybrid", "Index", "Liquid"];
    const fundNames = [
      "HDFC Top 100 Fund",
      "SBI Bluechip Fund",
      "Axis Long Term Equity Fund",
      "ICICI Prudential Liquid Fund",
      "Kotak Standard Multicap Fund"
    ];
    return {
      folioNumber,
      fundName: fundNames[index % fundNames.length],
      fundType: fundTypes[index % fundTypes.length],
      nav: 250 + index * 50,
      units: 100 + index * 20,
      currentValue: (250 + index * 50) * (100 + index * 20),
      investmentDate: new Date(Date.now() - (index + 1) * 180 * 24 * 60 * 60 * 1e3)
      // random dates in the past
    };
  });
}
function calculateMaxEligibleLoanAmount(mutualFunds, creditScore) {
  const portfolioValue = calculatePortfolioValue(mutualFunds);
  let baseLTV = 0.6;
  if (creditScore >= 750) {
    baseLTV = 0.8;
  } else if (creditScore >= 650) {
    baseLTV = 0.7;
  } else if (creditScore < 600) {
    baseLTV = 0.5;
  }
  let adjustedLTV = baseLTV;
  const equityRatio = mutualFunds.filter((fund) => fund.fundType.toLowerCase().includes("equity")).reduce(
    (sum, fund) => sum + fund.currentValue,
    0
  ) / portfolioValue;
  if (equityRatio > 0.7) {
    adjustedLTV += 0.05;
  }
  adjustedLTV = Math.min(adjustedLTV, 0.8);
  return Math.round(portfolioValue * adjustedLTV);
}
var RISK_SCORE_THRESHOLDS, RISK_FACTOR_WEIGHTS, RISK_PENALTIES;
var init_riskAssessment = __esm({
  "server/utils/riskAssessment.ts"() {
    "use strict";
    RISK_SCORE_THRESHOLDS = {
      LOW: 80,
      MEDIUM: 65,
      HIGH: 50
    };
    RISK_FACTOR_WEIGHTS = {
      CREDIT_SCORE: 0.35,
      INCOME: 0.25,
      LOAN_TO_VALUE: 0.2,
      EMPLOYMENT_STABILITY: 0.1,
      REPAYMENT_HISTORY: 0.1
    };
    RISK_PENALTIES = {
      EXISTING_LOANS: 10,
      LOW_INCOME: 15,
      HIGH_LOAN_AMOUNT: 20,
      POOR_CREDIT_HISTORY: 25
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  kycs;
  loanTypes;
  loanApplications;
  loans;
  repayments;
  moodEntries;
  financialDecisions;
  spendingInsights;
  userId;
  kycId;
  loanTypeId;
  applicationId;
  loanId;
  repaymentId;
  moodEntryId;
  financialDecisionId;
  spendingInsightId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.kycs = /* @__PURE__ */ new Map();
    this.loanTypes = /* @__PURE__ */ new Map();
    this.loanApplications = /* @__PURE__ */ new Map();
    this.loans = /* @__PURE__ */ new Map();
    this.repayments = /* @__PURE__ */ new Map();
    this.moodEntries = /* @__PURE__ */ new Map();
    this.financialDecisions = /* @__PURE__ */ new Map();
    this.spendingInsights = /* @__PURE__ */ new Map();
    this.userId = 1;
    this.kycId = 1;
    this.loanTypeId = 1;
    this.applicationId = 1;
    this.loanId = 1;
    this.repaymentId = 1;
    this.moodEntryId = 1;
    this.financialDecisionId = 1;
    this.spendingInsightId = 1;
    this.initializeLoanTypes();
  }
  initializeLoanTypes() {
    const shortTermMFLoan = {
      id: this.loanTypeId++,
      name: "Short-Term Mutual Fund Loan",
      description: "Quick loans against your mutual fund investments with flexible repayment options.",
      interestRate: 8.99,
      minAmount: 2e4,
      maxAmount: 5e5,
      minTenure: 3,
      maxTenure: 12,
      createdAt: /* @__PURE__ */ new Date()
    };
    const mediumTermMFLoan = {
      id: this.loanTypeId++,
      name: "Medium-Term Mutual Fund Loan",
      description: "Leverage your mutual fund portfolio for medium-term financial needs with competitive rates.",
      interestRate: 9.49,
      minAmount: 1e5,
      maxAmount: 1e6,
      minTenure: 12,
      maxTenure: 36,
      createdAt: /* @__PURE__ */ new Date()
    };
    const longTermMFLoan = {
      id: this.loanTypeId++,
      name: "Long-Term Mutual Fund Loan",
      description: "Strategic financing against your long-term mutual fund investments with favorable terms.",
      interestRate: 9.99,
      minAmount: 2e5,
      maxAmount: 2e6,
      minTenure: 36,
      maxTenure: 60,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.loanTypes.set(shortTermMFLoan.id, shortTermMFLoan);
    this.loanTypes.set(mediumTermMFLoan.id, mediumTermMFLoan);
    this.loanTypes.set(longTermMFLoan.id, longTermMFLoan);
  }
  // User operations
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async createUser(insertUser) {
    const id = this.userId++;
    const user = {
      ...insertUser,
      id,
      isVerified: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  // KYC operations
  async getKycByUserId(userId) {
    return Array.from(this.kycs.values()).find(
      (kyc) => kyc.userId === userId
    );
  }
  async createKyc(kyc) {
    const id = this.kycId++;
    const newKyc = {
      ...kyc,
      id,
      aadhaarVerified: false,
      panVerified: false,
      bankVerified: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.kycs.set(id, newKyc);
    return newKyc;
  }
  async updateKyc(id, data) {
    const kyc = this.kycs.get(id);
    if (!kyc) {
      throw new Error(`KYC with id ${id} not found`);
    }
    const updatedKyc = { ...kyc, ...data, updatedAt: /* @__PURE__ */ new Date() };
    this.kycs.set(id, updatedKyc);
    return updatedKyc;
  }
  // Loan Type operations
  async getLoanTypes() {
    return Array.from(this.loanTypes.values());
  }
  async getLoanType(id) {
    return this.loanTypes.get(id);
  }
  // Loan Application operations
  async createLoanApplication(application) {
    const id = this.applicationId++;
    const applicationId = `LA-${Math.floor(Math.random() * 9e4) + 1e4}`;
    const newApplication = {
      ...application,
      id,
      applicationId,
      status: "pending",
      creditScore: null,
      interestRate: null,
      rejectionReason: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.loanApplications.set(id, newApplication);
    return newApplication;
  }
  async getLoanApplication(id) {
    return this.loanApplications.get(id);
  }
  async getLoanApplicationsByUserId(userId) {
    return Array.from(this.loanApplications.values()).filter(
      (application) => application.userId === userId
    );
  }
  async updateLoanApplication(id, data) {
    const application = this.loanApplications.get(id);
    if (!application) {
      throw new Error(`Loan application with id ${id} not found`);
    }
    const updatedApplication = { ...application, ...data, updatedAt: /* @__PURE__ */ new Date() };
    this.loanApplications.set(id, updatedApplication);
    return updatedApplication;
  }
  // Loan operations
  async createLoan(loan) {
    const id = this.loanId++;
    const loanId = `LOAN-${Math.floor(Math.random() * 9e5) + 1e5}`;
    const newLoan = {
      ...loan,
      id,
      loanId,
      status: "active",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.loans.set(id, newLoan);
    return newLoan;
  }
  async getLoan(id) {
    return this.loans.get(id);
  }
  async getLoansByUserId(userId) {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.userId === userId
    );
  }
  async updateLoan(id, data) {
    const loan = this.loans.get(id);
    if (!loan) {
      throw new Error(`Loan with id ${id} not found`);
    }
    const updatedLoan = { ...loan, ...data };
    this.loans.set(id, updatedLoan);
    return updatedLoan;
  }
  // Repayment operations
  async createRepayment(repayment) {
    const id = this.repaymentId++;
    const newRepayment = {
      ...repayment,
      id,
      paidDate: null,
      status: "pending",
      transactionId: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.repayments.set(id, newRepayment);
    return newRepayment;
  }
  async getRepayment(id) {
    return this.repayments.get(id);
  }
  async getRepaymentsByLoanId(loanId) {
    return Array.from(this.repayments.values()).filter(
      (repayment) => repayment.loanId === loanId
    );
  }
  async getRepaymentsByUserId(userId) {
    return Array.from(this.repayments.values()).filter(
      (repayment) => repayment.userId === userId
    );
  }
  async updateRepayment(id, data) {
    const repayment = this.repayments.get(id);
    if (!repayment) {
      throw new Error(`Repayment with id ${id} not found`);
    }
    const updatedRepayment = { ...repayment, ...data };
    this.repayments.set(id, updatedRepayment);
    return updatedRepayment;
  }
  // Mood Entry operations
  async createMoodEntry(entry) {
    const id = this.moodEntryId++;
    const newMoodEntry = {
      ...entry,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.moodEntries.set(id, newMoodEntry);
    return newMoodEntry;
  }
  async getMoodEntry(id) {
    return this.moodEntries.get(id);
  }
  async getMoodEntriesByUserId(userId) {
    return Array.from(this.moodEntries.values()).filter(
      (entry) => entry.userId === userId
    );
  }
  async getMoodEntriesByDateRange(userId, startDate, endDate) {
    return Array.from(this.moodEntries.values()).filter(
      (entry) => {
        const entryDate = typeof entry.entryDate === "string" ? new Date(entry.entryDate) : entry.entryDate;
        return entry.userId === userId && entryDate >= startDate && entryDate <= endDate;
      }
    );
  }
  async updateMoodEntry(id, data) {
    const entry = this.moodEntries.get(id);
    if (!entry) {
      throw new Error(`Mood entry with id ${id} not found`);
    }
    const updatedEntry = { ...entry, ...data };
    this.moodEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  // Financial Decision operations
  async createFinancialDecision(decision) {
    const id = this.financialDecisionId++;
    const newDecision = {
      ...decision,
      id,
      impulsivityScore: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.financialDecisions.set(id, newDecision);
    return newDecision;
  }
  async getFinancialDecision(id) {
    return this.financialDecisions.get(id);
  }
  async getFinancialDecisionsByUserId(userId) {
    return Array.from(this.financialDecisions.values()).filter(
      (decision) => decision.userId === userId
    );
  }
  async getFinancialDecisionsByMoodId(moodId) {
    return Array.from(this.financialDecisions.values()).filter(
      (decision) => decision.moodId === moodId
    );
  }
  async updateFinancialDecision(id, data) {
    const decision = this.financialDecisions.get(id);
    if (!decision) {
      throw new Error(`Financial decision with id ${id} not found`);
    }
    const updatedDecision = { ...decision, ...data };
    this.financialDecisions.set(id, updatedDecision);
    return updatedDecision;
  }
  // Spending Insight operations
  async createSpendingInsight(insight) {
    const id = this.spendingInsightId++;
    const newInsight = {
      ...insight,
      id,
      isAcknowledged: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.spendingInsights.set(id, newInsight);
    return newInsight;
  }
  async getSpendingInsight(id) {
    return this.spendingInsights.get(id);
  }
  async getSpendingInsightsByUserId(userId) {
    return Array.from(this.spendingInsights.values()).filter(
      (insight) => insight.userId === userId
    );
  }
  async updateSpendingInsight(id, data) {
    const insight = this.spendingInsights.get(id);
    if (!insight) {
      throw new Error(`Spending insight with id ${id} not found`);
    }
    const updatedInsight = { ...insight, ...data };
    this.spendingInsights.set(id, updatedInsight);
    return updatedInsight;
  }
};
var storage = new MemStorage();

// server/utils/auth.ts
import { createHash } from "crypto";
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "pledgenfetch_secret_key";
var JWT_EXPIRY = "24h";
function generateJWT(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
async function verifyJWT(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded);
    });
  });
}
async function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}
async function comparePassword(password, hashedPassword) {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}

// server/utils/ekyc.ts
async function verifyAadhaar(aadhaar) {
  const apiKey = process.env.EKYC_API_KEY || "demo_api_key";
  try {
    if (!/^\d{12}$/.test(aadhaar)) {
      return {
        verified: false,
        message: "Invalid Aadhaar format. Must be 12 digits."
      };
    }
    console.log(`[eKYC] Verifying Aadhaar: ${aadhaar.substring(0, 4)}XXXX${aadhaar.substring(8)}`);
    const isVerified = aadhaar !== "111111111111";
    return {
      verified: isVerified,
      message: isVerified ? "Aadhaar verified successfully" : "Aadhaar verification failed. Please check your details."
    };
  } catch (error) {
    console.error("[eKYC] Aadhaar verification error:", error);
    return {
      verified: false,
      message: "Verification service error. Please try again later."
    };
  }
}
async function verifyPan(pan) {
  const apiKey = process.env.EKYC_API_KEY || "demo_api_key";
  try {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      return {
        verified: false,
        message: "Invalid PAN format. Must be in format ABCDE1234F."
      };
    }
    console.log(`[eKYC] Verifying PAN: ${pan}`);
    const isVerified = pan !== "AAAAA0000A";
    return {
      verified: isVerified,
      message: isVerified ? "PAN verified successfully" : "PAN verification failed. Please check your details."
    };
  } catch (error) {
    console.error("[eKYC] PAN verification error:", error);
    return {
      verified: false,
      message: "Verification service error. Please try again later."
    };
  }
}
async function verifyBankAccount(accountNumber, ifsc) {
  const apiKey = process.env.BANK_API_KEY || "demo_api_key";
  try {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      return {
        verified: false,
        message: "Invalid IFSC format. Please check and try again."
      };
    }
    console.log(`[eKYC] Verifying Bank Account: XXXX${accountNumber.substring(accountNumber.length - 4)} with IFSC: ${ifsc}`);
    const isVerified = ifsc !== "DEMO0000000";
    return {
      verified: isVerified,
      message: isVerified ? "Bank account verified successfully" : "Bank account verification failed. Please check your details."
    };
  } catch (error) {
    console.error("[eKYC] Bank account verification error:", error);
    return {
      verified: false,
      message: "Verification service error. Please try again later."
    };
  }
}

// server/utils/creditScore.ts
async function calculateCreditScore(input) {
  let baseScore = 650;
  if (input.annualIncome >= 15e5) {
    baseScore += 150;
  } else if (input.annualIncome >= 1e6) {
    baseScore += 120;
  } else if (input.annualIncome >= 7e5) {
    baseScore += 90;
  } else if (input.annualIncome >= 5e5) {
    baseScore += 60;
  } else if (input.annualIncome >= 3e5) {
    baseScore += 30;
  }
  switch (input.employmentType) {
    case "salaried":
      baseScore += 100;
      break;
    case "self-employed":
      baseScore += 70;
      break;
    case "business-owner":
      baseScore += 60;
      break;
    case "unemployed":
      baseScore -= 50;
      break;
    default:
      baseScore += 0;
  }
  if (input.hasExistingLoans) {
    baseScore -= 50;
  }
  const loanToIncomeRatio = input.loanAmount / input.annualIncome;
  if (loanToIncomeRatio > 1) {
    baseScore -= 100;
  } else if (loanToIncomeRatio > 0.7) {
    baseScore -= 70;
  } else if (loanToIncomeRatio > 0.5) {
    baseScore -= 40;
  } else if (loanToIncomeRatio > 0.3) {
    baseScore -= 20;
  }
  if (input.tenure >= 48) {
    baseScore += 50;
  } else if (input.tenure >= 36) {
    baseScore += 40;
  } else if (input.tenure >= 24) {
    baseScore += 30;
  } else if (input.tenure >= 12) {
    baseScore += 20;
  }
  const finalScore = Math.max(300, Math.min(900, baseScore));
  console.log(`[Credit Score] Calculated score: ${finalScore} for income: ${input.annualIncome}, employment: ${input.employmentType}`);
  return finalScore;
}

// server/utils/payment.ts
async function disburseLoan(loanId, amount, bankDetails) {
  console.log(`[Payment] Disbursing loan ${loanId}: \u20B9${amount} to account XXXX${bankDetails.accountNumber.slice(-4)}, IFSC: ${bankDetails.ifsc}`);
  try {
    const loan = await storage.getLoan(loanId);
    if (loan) {
      await storage.updateLoan(loanId, {
        status: "active"
        // loan is now active after disbursement
      });
    }
  } catch (error) {
    console.error(`[Payment] Error updating loan status after disbursement: ${error}`);
  }
}
async function createRepaymentSchedule(loan, userId) {
  const { id: loanId, principalAmount, interestRate, tenure, emiAmount, startDate } = loan;
  const monthlyInterestRate = interestRate / 100 / 12;
  let remainingPrincipal = Number(principalAmount);
  const dueDate = new Date(startDate);
  dueDate.setMonth(dueDate.getMonth() + 1);
  for (let i = 0; i < tenure; i++) {
    const interestForThisMonth = remainingPrincipal * monthlyInterestRate;
    const principalForThisMonth = Number(emiAmount) - interestForThisMonth;
    await storage.createRepayment({
      loanId,
      userId,
      amount: Number(emiAmount),
      dueDate: new Date(dueDate),
      // Clone the date to avoid reference issues
      principal: principalForThisMonth,
      interest: interestForThisMonth
    });
    remainingPrincipal -= principalForThisMonth;
    dueDate.setMonth(dueDate.getMonth() + 1);
  }
  console.log(`[Payment] Created repayment schedule for loan ${loanId} with ${tenure} EMIs of \u20B9${emiAmount}`);
}

// server/utils/emotionalSpending.ts
var MOOD_TYPES = [
  "happy",
  "sad",
  "stressed",
  "anxious",
  "excited",
  "neutral"
];
var DECISION_TYPES = [
  "loan_application",
  "investment",
  "repayment",
  "withdrawal"
];
async function analyzeSpendingBehavior(userId) {
  const moodEntries2 = await storage.getMoodEntriesByUserId(userId);
  const financialDecisions2 = await storage.getFinancialDecisionsByUserId(userId);
  const decisionsByMood = groupDecisionsByMood(moodEntries2, financialDecisions2);
  const insights = [];
  const spendingByMood = calculateSpendingByMood(decisionsByMood);
  const highestSpendingMood = findHighestSpendingMood(spendingByMood);
  if (highestSpendingMood) {
    const insight = {
      userId,
      insightType: "pattern",
      description: `You tend to spend more when you're feeling ${highestSpendingMood.mood}. On average, you spend \u20B9${highestSpendingMood.average.toFixed(2)} during these times.`,
      relatedMoods: [highestSpendingMood.mood],
      severity: highestSpendingMood.severity
    };
    const createdInsight = await storage.createSpendingInsight(insight);
    insights.push(createdInsight);
  }
  const emotionalTriggers = identifyEmotionalTriggers(decisionsByMood);
  for (const trigger of emotionalTriggers) {
    const insight = {
      userId,
      insightType: trigger.strength > 7 ? "warning" : "recommendation",
      description: trigger.description,
      relatedMoods: [trigger.moodType],
      severity: trigger.strength > 7 ? "high" : trigger.strength > 4 ? "medium" : "low"
    };
    const createdInsight = await storage.createSpendingInsight(insight);
    insights.push(createdInsight);
  }
  return insights;
}
function groupDecisionsByMood(moodEntries2, financialDecisions2) {
  const decisionsByMood = {};
  for (const mood of MOOD_TYPES) {
    decisionsByMood[mood] = [];
  }
  for (const decision of financialDecisions2) {
    if (decision.moodId) {
      const moodEntry = moodEntries2.find((entry) => entry.id === decision.moodId);
      if (moodEntry) {
        decisionsByMood[moodEntry.mood].push(decision);
      }
    }
  }
  for (const decision of financialDecisions2) {
    if (!decision.moodId) {
      const decisionDate = typeof decision.decisionDate === "string" ? new Date(decision.decisionDate) : decision.decisionDate;
      const sameDay = moodEntries2.filter((entry) => {
        const entryDate = typeof entry.entryDate === "string" ? new Date(entry.entryDate) : entry.entryDate;
        return entryDate.toDateString() === decisionDate.toDateString();
      });
      if (sameDay.length > 0) {
        const strongestMood = sameDay.reduce(
          (prev, current) => prev.intensity > current.intensity ? prev : current
        );
        decisionsByMood[strongestMood.mood].push(decision);
      } else {
        decisionsByMood["neutral"].push(decision);
      }
    }
  }
  return decisionsByMood;
}
function calculateSpendingByMood(decisionsByMood) {
  const result = [];
  for (const mood of MOOD_TYPES) {
    const decisions = decisionsByMood[mood];
    if (decisions.length > 0) {
      const totalAmount = decisions.reduce((sum, decision) => {
        if (["loan_application", "withdrawal"].includes(decision.decisionType)) {
          return sum + Number(decision.amount);
        }
        return sum;
      }, 0);
      const average = totalAmount / decisions.length;
      let severity = "low";
      if (mood === "anxious" || mood === "stressed") {
        severity = average > 1e4 ? "high" : average > 5e3 ? "medium" : "low";
      } else if (mood === "excited") {
        severity = average > 15e3 ? "high" : average > 7500 ? "medium" : "low";
      } else if (mood === "sad") {
        severity = average > 8e3 ? "high" : average > 4e3 ? "medium" : "low";
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
function findHighestSpendingMood(spendingByMood) {
  if (spendingByMood.length === 0) return null;
  const significantMoods = spendingByMood.filter((item) => item.count >= 2);
  if (significantMoods.length === 0) return null;
  return significantMoods.sort((a, b) => b.average - a.average)[0];
}
function identifyEmotionalTriggers(decisionsByMood) {
  const triggers = [];
  const stressedDecisions = decisionsByMood["stressed"] || [];
  const stressLoanCount = stressedDecisions.filter((d) => d.decisionType === "loan_application").length;
  if (stressLoanCount >= 2) {
    triggers.push({
      trigger: "stress_loans",
      moodType: "stressed",
      strength: Math.min(stressLoanCount * 2, 10),
      description: `You tend to apply for loans when you're feeling stressed. Consider waiting 24 hours before making financial decisions when stressed.`
    });
  }
  const excitedDecisions = decisionsByMood["excited"] || [];
  const excitedWithdrawals = excitedDecisions.filter((d) => d.decisionType === "withdrawal");
  if (excitedWithdrawals.length >= 2) {
    const totalAmount = excitedWithdrawals.reduce((sum, d) => sum + Number(d.amount), 0);
    const averageAmount = totalAmount / excitedWithdrawals.length;
    if (averageAmount > 5e3) {
      triggers.push({
        trigger: "excitement_spending",
        moodType: "excited",
        strength: Math.min(8, 4 + excitedWithdrawals.length),
        description: `When excited, you tend to make larger withdrawals (average: \u20B9${averageAmount.toFixed(2)}). Try implementing a 24-hour cooling-off period for large financial decisions.`
      });
    }
  }
  const sadDecisions = decisionsByMood["sad"] || [];
  const sadWithdrawals = sadDecisions.filter((d) => d.decisionType === "withdrawal");
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
function calculateImpulsivityScore(decision, moodEntry) {
  const intensityFactor = moodEntry.intensity * 5;
  let moodFactor = 0;
  switch (moodEntry.mood) {
    case "excited":
      moodFactor = 25;
      break;
    case "stressed":
    case "anxious":
      moodFactor = 20;
      break;
    case "sad":
      moodFactor = 15;
      break;
    case "happy":
      moodFactor = 10;
      break;
    case "neutral":
      moodFactor = 0;
      break;
    default:
      moodFactor = 5;
  }
  let decisionFactor = 0;
  switch (decision.decisionType) {
    case "withdrawal":
      decisionFactor = 20;
      break;
    case "loan_application":
      decisionFactor = 15;
      break;
    case "investment":
      decisionFactor = 5;
      break;
    case "repayment":
      decisionFactor = 0;
      break;
    default:
      decisionFactor = 10;
  }
  let impulsivityScore = intensityFactor + moodFactor + decisionFactor;
  impulsivityScore = Math.max(1, Math.min(100, impulsivityScore));
  return impulsivityScore;
}
async function analyzeFinancialDecision(decision, moodEntry) {
  const impulsivityScore = calculateImpulsivityScore(decision, moodEntry);
  await storage.updateFinancialDecision(decision.id, { impulsivityScore });
  if (impulsivityScore > 70) {
    const insight = {
      userId: decision.userId,
      insightType: "warning",
      description: `This ${decision.decisionType.replace("_", " ")} appears to be highly impulsive. You might want to reconsider or implement a cooling-off period before finalizing your decision.`,
      relatedMoods: [moodEntry.mood],
      severity: "high"
    };
    return await storage.createSpendingInsight(insight);
  } else if (impulsivityScore > 50) {
    const insight = {
      userId: decision.userId,
      insightType: "recommendation",
      description: `Your emotional state may be influencing this ${decision.decisionType.replace("_", " ")}. Consider waiting a day before finalizing.`,
      relatedMoods: [moodEntry.mood],
      severity: "medium"
    };
    return await storage.createSpendingInsight(insight);
  }
  return null;
}

// server/routes.ts
import { z } from "zod";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, json, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  mobile: text("mobile"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var kycVerifications = pgTable("kyc_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  aadhaar: text("aadhaar").notNull(),
  pan: text("pan").notNull(),
  bankDetails: json("bank_details").notNull(),
  aadhaarVerified: boolean("aadhaar_verified").default(false),
  panVerified: boolean("pan_verified").default(false),
  bankVerified: boolean("bank_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var loanTypes = pgTable("loan_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  minAmount: integer("min_amount").notNull(),
  maxAmount: integer("max_amount").notNull(),
  minTenure: integer("min_tenure").notNull(),
  maxTenure: integer("max_tenure").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var loanApplications = pgTable("loan_applications", {
  id: serial("id").primaryKey(),
  applicationId: text("application_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  loanTypeId: integer("loan_type_id").references(() => loanTypes.id).notNull(),
  amount: numeric("amount").notNull(),
  tenure: integer("tenure").notNull(),
  purpose: text("purpose").notNull(),
  annualIncome: numeric("annual_income").notNull(),
  employmentType: text("employment_type").notNull(),
  hasExistingLoans: boolean("has_existing_loans").notNull(),
  status: text("status").notNull().default("pending"),
  creditScore: integer("credit_score"),
  interestRate: numeric("interest_rate"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  loanId: text("loan_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  applicationId: integer("application_id").references(() => loanApplications.id).notNull(),
  principalAmount: numeric("principal_amount").notNull(),
  interestRate: numeric("interest_rate").notNull(),
  tenure: integer("tenure").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  emiAmount: numeric("emi_amount").notNull(),
  totalInterest: numeric("total_interest").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow()
});
var repayments = pgTable("repayments", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").references(() => loans.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: numeric("amount").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  principal: numeric("principal").notNull(),
  interest: numeric("interest").notNull(),
  status: text("status").notNull().default("pending"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow()
});
var moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mood: text("mood").notNull(),
  // happy, sad, stressed, anxious, excited, neutral
  intensity: integer("intensity").notNull(),
  // 1-10 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  entryDate: date("entry_date").notNull()
});
var financialDecisions = pgTable("financial_decisions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  decisionType: text("decision_type").notNull(),
  // loan_application, investment, repayment, withdrawal
  amount: numeric("amount").notNull(),
  description: text("description").notNull(),
  moodId: integer("mood_id").references(() => moodEntries.id),
  emotionalTrigger: text("emotional_trigger"),
  impulsivityScore: integer("impulsivity_score"),
  // AI-calculated score 1-100
  createdAt: timestamp("created_at").defaultNow(),
  decisionDate: date("decision_date").notNull()
});
var spendingInsights = pgTable("spending_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  insightType: text("insight_type").notNull(),
  // pattern, recommendation, warning
  description: text("description").notNull(),
  relatedMoods: json("related_moods"),
  // array of moods associated with this insight
  createdAt: timestamp("created_at").defaultNow(),
  severity: text("severity").notNull(),
  // low, medium, high
  isAcknowledged: boolean("is_acknowledged").default(false)
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  mobile: true
});
var insertKycSchema = createInsertSchema(kycVerifications).pick({
  userId: true,
  aadhaar: true,
  pan: true,
  bankDetails: true
});
var insertLoanApplicationSchema = createInsertSchema(loanApplications).pick({
  userId: true,
  loanTypeId: true,
  amount: true,
  tenure: true,
  purpose: true,
  annualIncome: true,
  employmentType: true,
  hasExistingLoans: true
});
var insertLoanSchema = createInsertSchema(loans).pick({
  userId: true,
  applicationId: true,
  principalAmount: true,
  interestRate: true,
  tenure: true,
  startDate: true,
  endDate: true,
  emiAmount: true,
  totalInterest: true,
  totalAmount: true
});
var insertRepaymentSchema = createInsertSchema(repayments).pick({
  loanId: true,
  userId: true,
  amount: true,
  dueDate: true,
  principal: true,
  interest: true
});
var insertMoodEntrySchema = createInsertSchema(moodEntries).pick({
  userId: true,
  mood: true,
  intensity: true,
  notes: true,
  entryDate: true
});
var insertFinancialDecisionSchema = createInsertSchema(financialDecisions).pick({
  userId: true,
  decisionType: true,
  amount: true,
  description: true,
  moodId: true,
  emotionalTrigger: true,
  decisionDate: true
});
var insertSpendingInsightSchema = createInsertSchema(spendingInsights).pick({
  userId: true,
  insightType: true,
  description: true,
  relatedMoods: true,
  severity: true
});

// server/routes.ts
async function registerRoutes(app2) {
  const authenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const token = authHeader.split(" ")[1];
      const decoded = await verifyJWT(token);
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(401).json({ message: "Invalid authentication" });
      }
      req.body.authUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      };
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, mobile, password } = req.body;
      const validatedData = {
        username: email,
        // Use email as username
        name,
        email,
        mobile,
        password
      };
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      const token = generateJWT(user);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = generateJWT(user);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1e3
        // 24 hours
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    try {
      res.clearCookie("token");
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const { id } = req.body.authUser;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/ekyc/verify-aadhaar", authenticate, async (req, res) => {
    try {
      const { aadhaar } = req.body;
      const userId = req.body.authUser.id;
      const aadhaarSchema = z.string().regex(/^\d{12}$/, {
        message: "Aadhaar number must be 12 digits"
      });
      try {
        aadhaarSchema.parse(aadhaar);
      } catch (error) {
        return res.status(400).json({ message: "Invalid Aadhaar number format" });
      }
      const verificationResult = await verifyAadhaar(aadhaar);
      let kycRecord = await storage.getKycByUserId(userId);
      if (kycRecord) {
        kycRecord = await storage.updateKyc(kycRecord.id, {
          aadhaar,
          aadhaarVerified: verificationResult.verified
        });
      } else {
        kycRecord = await storage.createKyc({
          userId,
          aadhaar,
          pan: "",
          // Will be filled later
          bankDetails: { accountNumber: "", ifsc: "" },
          // Will be filled later
          aadhaarVerified: verificationResult.verified,
          panVerified: false,
          bankVerified: false
        });
      }
      res.status(200).json({
        verified: verificationResult.verified,
        message: verificationResult.message
      });
    } catch (error) {
      console.error("Aadhaar verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/ekyc/verify-pan", authenticate, async (req, res) => {
    try {
      const { pan } = req.body;
      const userId = req.body.authUser.id;
      const panSchema = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
        message: "PAN must be in the format ABCDE1234F"
      });
      try {
        panSchema.parse(pan);
      } catch (error) {
        return res.status(400).json({ message: "Invalid PAN format" });
      }
      const verificationResult = await verifyPan(pan);
      let kycRecord = await storage.getKycByUserId(userId);
      if (kycRecord) {
        kycRecord = await storage.updateKyc(kycRecord.id, {
          pan,
          panVerified: verificationResult.verified
        });
      } else {
        kycRecord = await storage.createKyc({
          userId,
          aadhaar: "",
          // Will be filled later
          pan,
          bankDetails: { accountNumber: "", ifsc: "" },
          // Will be filled later
          aadhaarVerified: false,
          panVerified: verificationResult.verified,
          bankVerified: false
        });
      }
      res.status(200).json({
        verified: verificationResult.verified,
        message: verificationResult.message
      });
    } catch (error) {
      console.error("PAN verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/ekyc/verify-bank", authenticate, async (req, res) => {
    try {
      const { accountNumber, ifsc } = req.body;
      const userId = req.body.authUser.id;
      const bankSchema = z.object({
        accountNumber: z.string().min(9).max(18),
        ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      });
      try {
        bankSchema.parse({ accountNumber, ifsc });
      } catch (error) {
        return res.status(400).json({ message: "Invalid bank details format" });
      }
      const verificationResult = await verifyBankAccount(accountNumber, ifsc);
      let kycRecord = await storage.getKycByUserId(userId);
      if (kycRecord) {
        kycRecord = await storage.updateKyc(kycRecord.id, {
          bankDetails: { accountNumber, ifsc },
          bankVerified: verificationResult.verified
        });
      } else {
        kycRecord = await storage.createKyc({
          userId,
          aadhaar: "",
          // Will be filled later
          pan: "",
          // Will be filled later
          bankDetails: { accountNumber, ifsc },
          aadhaarVerified: false,
          panVerified: false,
          bankVerified: verificationResult.verified
        });
      }
      res.status(200).json({
        verified: verificationResult.verified,
        message: verificationResult.message
      });
    } catch (error) {
      console.error("Bank verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/loans/apply", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const { loan, kyc, folioNumbers } = req.body;
      const loanSchema = z.object({
        loanType: z.string(),
        amount: z.string().or(z.number()),
        tenure: z.string().or(z.number()),
        purpose: z.string(),
        annualIncome: z.string().or(z.number()),
        employment: z.string(),
        employmentDuration: z.string().or(z.number()).optional(),
        hasExistingLoans: z.string().or(z.boolean())
      });
      try {
        loanSchema.parse(loan);
      } catch (error) {
        return res.status(400).json({ message: "Invalid loan application data" });
      }
      const kycRecord = await storage.getKycByUserId(userId);
      if (!kycRecord || !kycRecord.aadhaarVerified || !kycRecord.panVerified || !kycRecord.bankVerified) {
        return res.status(400).json({ message: "KYC verification is incomplete" });
      }
      let loanTypeId;
      switch (loan.loanType) {
        case "short_term_mf":
          loanTypeId = 1;
          break;
        case "medium_term_mf":
          loanTypeId = 2;
          break;
        case "long_term_mf":
          loanTypeId = 3;
          break;
        default:
          loanTypeId = 1;
      }
      const loanType = await storage.getLoanType(loanTypeId);
      if (!loanType) {
        return res.status(400).json({ message: "Invalid loan type" });
      }
      const amount = typeof loan.amount === "string" ? parseFloat(loan.amount) : loan.amount;
      const tenure = typeof loan.tenure === "string" ? parseInt(loan.tenure) : loan.tenure;
      const annualIncome = typeof loan.annualIncome === "string" ? parseFloat(loan.annualIncome) : loan.annualIncome;
      const hasExistingLoans = loan.hasExistingLoans === "yes" || loan.hasExistingLoans === true;
      const employmentDuration = loan.employmentDuration ? typeof loan.employmentDuration === "string" ? parseInt(loan.employmentDuration) : loan.employmentDuration : 24;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const loanApplication = await storage.createLoanApplication({
        userId,
        loanTypeId,
        amount,
        tenure,
        purpose: loan.purpose,
        annualIncome,
        employmentType: loan.employment,
        hasExistingLoans
      });
      const {
        evaluateRisk: evaluateRisk2,
        verifyMutualFunds: verifyMutualFunds2
      } = await Promise.resolve().then(() => (init_riskAssessment(), riskAssessment_exports));
      const mutualFundFolios = folioNumbers || ["MF123456", "MF789012", "MF345678"];
      const mutualFundDetails = await verifyMutualFunds2(kycRecord.pan, mutualFundFolios);
      const creditScore = await calculateCreditScore({
        annualIncome,
        employmentType: loan.employment,
        hasExistingLoans,
        loanAmount: amount,
        tenure
      });
      const riskAssessment = await evaluateRisk2({
        user,
        kyc: kycRecord,
        loanApplication,
        creditScore,
        mutualFundDetails,
        existingLoans: hasExistingLoans,
        employmentType: loan.employment,
        employmentDuration
      });
      let status = riskAssessment.approved ? "approved" : "rejected";
      let interestRate = riskAssessment.suggestedInterestRate;
      let rejectionReason = riskAssessment.rejectionReasons ? riskAssessment.rejectionReasons.join("; ") : null;
      const updatedApplication = await storage.updateLoanApplication(
        loanApplication.id,
        {
          creditScore,
          status,
          interestRate,
          rejectionReason,
          // Store additional risk assessment data in metadata
          metadata: JSON.stringify({
            riskScore: riskAssessment.riskScore,
            riskCategory: riskAssessment.riskCategory,
            maxLoanAmount: riskAssessment.maxLoanAmount,
            approvalConditions: riskAssessment.approvalConditions,
            mutualFundPortfolioValue: mutualFundDetails.reduce((sum, fund) => sum + fund.currentValue, 0)
          })
        }
      );
      if (status === "approved") {
        const startDate = /* @__PURE__ */ new Date();
        const endDate = /* @__PURE__ */ new Date();
        endDate.setMonth(endDate.getMonth() + tenure);
        const principal = amount;
        const ratePerMonth = interestRate / 100 / 12;
        const emiAmount = principal * ratePerMonth * Math.pow(1 + ratePerMonth, tenure) / (Math.pow(1 + ratePerMonth, tenure) - 1);
        const totalAmount = emiAmount * tenure;
        const totalInterest = totalAmount - principal;
        const loan2 = await storage.createLoan({
          userId,
          applicationId: loanApplication.id,
          principalAmount: principal,
          interestRate,
          tenure,
          startDate,
          endDate,
          emiAmount,
          totalInterest,
          totalAmount
        });
        await createRepaymentSchedule(loan2, userId);
        await disburseLoan(loan2.id, principal, kycRecord.bankDetails);
        res.status(201).json({
          loanApplication: updatedApplication,
          riskAssessment: {
            approved: riskAssessment.approved,
            riskScore: riskAssessment.riskScore,
            riskCategory: riskAssessment.riskCategory,
            maxLoanAmount: riskAssessment.maxLoanAmount,
            suggestedInterestRate: riskAssessment.suggestedInterestRate,
            approvalConditions: riskAssessment.approvalConditions
          },
          loan: {
            id: loan2.id,
            amount: loan2.principalAmount,
            interestRate: loan2.interestRate,
            emiAmount: loan2.emiAmount,
            startDate: loan2.startDate,
            endDate: loan2.endDate
          },
          message: "Your loan has been approved!"
        });
      } else {
        res.status(201).json({
          loanApplication: updatedApplication,
          riskAssessment: {
            approved: riskAssessment.approved,
            riskScore: riskAssessment.riskScore,
            riskCategory: riskAssessment.riskCategory,
            rejectionReasons: riskAssessment.rejectionReasons
          },
          message: "Your loan application was rejected.",
          reasons: riskAssessment.rejectionReasons
        });
      }
    } catch (error) {
      console.error("Loan application error:", error);
      res.status(500).json({
        message: "Error applying for loan",
        error: error.message
      });
    }
  });
  app2.get("/api/loans", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const applications = await storage.getLoanApplicationsByUserId(userId);
      const loans2 = await storage.getLoansByUserId(userId);
      const loanData = [];
      for (const application of applications) {
        if (application.status !== "approved") {
          const loanType = await storage.getLoanType(application.loanTypeId);
          loanData.push({
            id: application.id,
            applicationId: application.applicationId,
            type: loanType?.name || "Unknown",
            amount: application.amount,
            tenure: application.tenure,
            interestRate: application.interestRate || loanType?.interestRate,
            status: application.status,
            createdAt: application.createdAt,
            disbursementDate: null,
            nextPaymentDate: null,
            nextPaymentAmount: null
          });
        }
      }
      for (const loan of loans2) {
        const application = applications.find((a) => a.id === loan.applicationId);
        const loanType = application ? await storage.getLoanType(application.loanTypeId) : null;
        const repayments2 = await storage.getRepaymentsByLoanId(loan.id);
        const nextPayment = repayments2.filter((r) => r.status === "pending").sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
        loanData.push({
          id: loan.id,
          loanId: loan.loanId,
          applicationId: application?.applicationId,
          type: loanType?.name || "Unknown",
          amount: loan.principalAmount,
          tenure: loan.tenure,
          interestRate: loan.interestRate,
          status: loan.status,
          disbursementDate: loan.createdAt,
          nextPaymentDate: nextPayment?.dueDate || null,
          nextPaymentAmount: nextPayment?.amount || null,
          progress: {
            totalAmount: loan.totalAmount,
            paidAmount: repayments2.filter((r) => r.status === "paid").reduce((sum, r) => sum + Number(r.amount), 0),
            emiAmount: loan.emiAmount
          }
        });
      }
      res.status(200).json(loanData);
    } catch (error) {
      console.error("Get loans error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/payments", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const repayments2 = await storage.getRepaymentsByUserId(userId);
      const payments = await Promise.all(repayments2.map(async (repayment) => {
        const loan = await storage.getLoan(repayment.loanId);
        return {
          id: repayment.id,
          loanId: loan?.loanId,
          dueDate: repayment.dueDate,
          paidDate: repayment.paidDate,
          amount: repayment.amount,
          principal: repayment.principal,
          interest: repayment.interest,
          status: repayment.status,
          transactionId: repayment.transactionId
        };
      }));
      res.status(200).json(payments);
    } catch (error) {
      console.error("Get payments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/mood-types", authenticate, async (req, res) => {
    try {
      res.status(200).json({
        moods: MOOD_TYPES,
        decisionTypes: DECISION_TYPES
      });
    } catch (error) {
      console.error("Get mood types error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/mood", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const { mood, intensity, notes, entryDate } = req.body;
      const moodSchema = insertMoodEntrySchema.extend({
        mood: z.enum(MOOD_TYPES),
        intensity: z.number().min(1).max(10)
      });
      let validatedData;
      try {
        validatedData = moodSchema.parse({
          userId,
          mood,
          intensity: typeof intensity === "string" ? parseInt(intensity) : intensity,
          notes: notes || null,
          entryDate: entryDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        });
      } catch (error) {
        return res.status(400).json({ message: "Invalid mood entry data", error });
      }
      const moodEntry = await storage.createMoodEntry(validatedData);
      res.status(201).json(moodEntry);
    } catch (error) {
      console.error("Add mood entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/mood", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const { startDate, endDate } = req.query;
      let moodEntries2;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        moodEntries2 = await storage.getMoodEntriesByDateRange(userId, start, end);
      } else {
        moodEntries2 = await storage.getMoodEntriesByUserId(userId);
      }
      res.status(200).json({
        moodEntries: moodEntries2
      });
    } catch (error) {
      console.error("Get mood entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/financial-decision", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const {
        decisionType,
        amount,
        description,
        moodId,
        currentMood,
        currentMoodIntensity,
        emotionalTrigger,
        decisionDate
      } = req.body;
      const decisionSchema = insertFinancialDecisionSchema.extend({
        decisionType: z.enum(DECISION_TYPES),
        amount: z.number().positive()
      });
      let moodEntry = null;
      if (!moodId && currentMood && currentMoodIntensity) {
        moodEntry = await storage.createMoodEntry({
          userId,
          mood: currentMood,
          intensity: typeof currentMoodIntensity === "string" ? parseInt(currentMoodIntensity) : currentMoodIntensity,
          notes: `Auto-generated for financial decision: ${description}`,
          entryDate: decisionDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        });
      }
      let validatedData;
      try {
        validatedData = decisionSchema.parse({
          userId,
          decisionType,
          amount: (typeof amount === "string" ? parseFloat(amount) : amount).toString(),
          description,
          moodId: moodEntry ? moodEntry.id : moodId || null,
          emotionalTrigger: emotionalTrigger || null,
          decisionDate: decisionDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        });
      } catch (error) {
        return res.status(400).json({ message: "Invalid financial decision data", error });
      }
      const decision = await storage.createFinancialDecision(validatedData);
      let insight = null;
      if (moodEntry || moodId) {
        const moodEntryToUse = moodEntry || await storage.getMoodEntry(moodId);
        if (moodEntryToUse) {
          const impulsivityScore = calculateImpulsivityScore(decision, moodEntryToUse);
          await storage.updateFinancialDecision(decision.id, { impulsivityScore });
          insight = await analyzeFinancialDecision(decision, moodEntryToUse);
        }
      }
      res.status(201).json({
        decision,
        moodEntry,
        insight
      });
    } catch (error) {
      console.error("Add financial decision error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/financial-decisions", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const { moodId } = req.query;
      let decisions;
      if (moodId) {
        const moodIdNum = parseInt(moodId);
        if (isNaN(moodIdNum)) {
          return res.status(400).json({ message: "Invalid mood ID" });
        }
        decisions = await storage.getFinancialDecisionsByMoodId(moodIdNum);
        decisions = decisions.filter((d) => d.userId === userId);
      } else {
        decisions = await storage.getFinancialDecisionsByUserId(userId);
      }
      res.status(200).json({
        decisions
      });
    } catch (error) {
      console.error("Get financial decisions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.post("/api/analyze-spending", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const existingInsights = await storage.getSpendingInsightsByUserId(userId);
      const newInsights = await analyzeSpendingBehavior(userId);
      res.status(200).json({
        insights: [...existingInsights, ...newInsights],
        newInsightsCount: newInsights.length
      });
    } catch (error) {
      console.error("Analyze spending error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/spending-insights", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const insights = await storage.getSpendingInsightsByUserId(userId);
      insights.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        const dateA = a.createdAt ? new Date(a.createdAt) : /* @__PURE__ */ new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : /* @__PURE__ */ new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      res.status(200).json({
        insights
      });
    } catch (error) {
      console.error("Get spending insights error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.patch("/api/spending-insights/:id/acknowledge", authenticate, async (req, res) => {
    try {
      const userId = req.body.authUser.id;
      const insightId = parseInt(req.params.id);
      if (isNaN(insightId)) {
        return res.status(400).json({ message: "Invalid insight ID" });
      }
      const insight = await storage.getSpendingInsight(insightId);
      if (!insight) {
        return res.status(404).json({ message: "Insight not found" });
      }
      if (insight.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this insight" });
      }
      const updatedInsight = await storage.updateSpendingInsight(insightId, {
        isAcknowledged: true
      });
      res.status(200).json(updatedInsight);
    } catch (error) {
      console.error("Acknowledge insight error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
