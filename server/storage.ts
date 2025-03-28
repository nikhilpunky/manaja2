import { 
  User, InsertUser, 
  KycVerification, InsertKycVerification,
  LoanType, InsertLoanType,
  LoanApplication, InsertLoanApplication,
  Loan, InsertLoan,
  Repayment, InsertRepayment,
  MoodEntry, InsertMoodEntry,
  FinancialDecision, InsertFinancialDecision,
  SpendingInsight, InsertSpendingInsight
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // KYC operations
  getKycByUserId(userId: number): Promise<KycVerification | undefined>;
  createKyc(kyc: InsertKycVerification): Promise<KycVerification>;
  updateKyc(id: number, data: Partial<KycVerification>): Promise<KycVerification>;
  
  // Loan Type operations
  getLoanTypes(): Promise<LoanType[]>;
  getLoanType(id: number): Promise<LoanType | undefined>;
  
  // Loan Application operations
  createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication>;
  getLoanApplication(id: number): Promise<LoanApplication | undefined>;
  getLoanApplicationsByUserId(userId: number): Promise<LoanApplication[]>;
  updateLoanApplication(id: number, data: Partial<LoanApplication>): Promise<LoanApplication>;
  
  // Loan operations
  createLoan(loan: InsertLoan): Promise<Loan>;
  getLoan(id: number): Promise<Loan | undefined>;
  getLoansByUserId(userId: number): Promise<Loan[]>;
  updateLoan(id: number, data: Partial<Loan>): Promise<Loan>;
  
  // Repayment operations
  createRepayment(repayment: InsertRepayment): Promise<Repayment>;
  getRepayment(id: number): Promise<Repayment | undefined>;
  getRepaymentsByLoanId(loanId: number): Promise<Repayment[]>;
  getRepaymentsByUserId(userId: number): Promise<Repayment[]>;
  updateRepayment(id: number, data: Partial<Repayment>): Promise<Repayment>;
  
  // Mood Entry operations
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntry(id: number): Promise<MoodEntry | undefined>;
  getMoodEntriesByUserId(userId: number): Promise<MoodEntry[]>;
  getMoodEntriesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<MoodEntry[]>;
  updateMoodEntry(id: number, data: Partial<MoodEntry>): Promise<MoodEntry>;
  
  // Financial Decision operations
  createFinancialDecision(decision: InsertFinancialDecision): Promise<FinancialDecision>;
  getFinancialDecision(id: number): Promise<FinancialDecision | undefined>;
  getFinancialDecisionsByUserId(userId: number): Promise<FinancialDecision[]>;
  getFinancialDecisionsByMoodId(moodId: number): Promise<FinancialDecision[]>;
  updateFinancialDecision(id: number, data: Partial<FinancialDecision>): Promise<FinancialDecision>;
  
  // Spending Insight operations
  createSpendingInsight(insight: InsertSpendingInsight): Promise<SpendingInsight>;
  getSpendingInsight(id: number): Promise<SpendingInsight | undefined>;
  getSpendingInsightsByUserId(userId: number): Promise<SpendingInsight[]>;
  updateSpendingInsight(id: number, data: Partial<SpendingInsight>): Promise<SpendingInsight>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private kycs: Map<number, KycVerification>;
  private loanTypes: Map<number, LoanType>;
  private loanApplications: Map<number, LoanApplication>;
  private loans: Map<number, Loan>;
  private repayments: Map<number, Repayment>;
  private moodEntries: Map<number, MoodEntry>;
  private financialDecisions: Map<number, FinancialDecision>;
  private spendingInsights: Map<number, SpendingInsight>;
  
  private userId: number;
  private kycId: number;
  private loanTypeId: number;
  private applicationId: number;
  private loanId: number;
  private repaymentId: number;
  private moodEntryId: number;
  private financialDecisionId: number;
  private spendingInsightId: number;

  constructor() {
    this.users = new Map();
    this.kycs = new Map();
    this.loanTypes = new Map();
    this.loanApplications = new Map();
    this.loans = new Map();
    this.repayments = new Map();
    this.moodEntries = new Map();
    this.financialDecisions = new Map();
    this.spendingInsights = new Map();
    
    this.userId = 1;
    this.kycId = 1;
    this.loanTypeId = 1;
    this.applicationId = 1;
    this.loanId = 1;
    this.repaymentId = 1;
    this.moodEntryId = 1;
    this.financialDecisionId = 1;
    this.spendingInsightId = 1;
    
    // Initialize with sample loan types
    this.initializeLoanTypes();
  }
  
  private initializeLoanTypes() {
    const shortTermMFLoan: LoanType = {
      id: this.loanTypeId++,
      name: "Short-Term Mutual Fund Loan",
      description: "Quick loans against your mutual fund investments with flexible repayment options.",
      interestRate: 8.99,
      minAmount: 20000,
      maxAmount: 500000,
      minTenure: 3,
      maxTenure: 12,
      createdAt: new Date()
    };
    
    const mediumTermMFLoan: LoanType = {
      id: this.loanTypeId++,
      name: "Medium-Term Mutual Fund Loan",
      description: "Leverage your mutual fund portfolio for medium-term financial needs with competitive rates.",
      interestRate: 9.49,
      minAmount: 100000,
      maxAmount: 1000000,
      minTenure: 12,
      maxTenure: 36,
      createdAt: new Date()
    };
    
    const longTermMFLoan: LoanType = {
      id: this.loanTypeId++,
      name: "Long-Term Mutual Fund Loan",
      description: "Strategic financing against your long-term mutual fund investments with favorable terms.",
      interestRate: 9.99,
      minAmount: 200000,
      maxAmount: 2000000,
      minTenure: 36,
      maxTenure: 60,
      createdAt: new Date()
    };
    
    this.loanTypes.set(shortTermMFLoan.id, shortTermMFLoan);
    this.loanTypes.set(mediumTermMFLoan.id, mediumTermMFLoan);
    this.loanTypes.set(longTermMFLoan.id, longTermMFLoan);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isVerified: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  // KYC operations
  async getKycByUserId(userId: number): Promise<KycVerification | undefined> {
    return Array.from(this.kycs.values()).find(
      (kyc) => kyc.userId === userId
    );
  }
  
  async createKyc(kyc: InsertKycVerification): Promise<KycVerification> {
    const id = this.kycId++;
    const newKyc: KycVerification = {
      ...kyc,
      id,
      aadhaarVerified: false,
      panVerified: false,
      bankVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.kycs.set(id, newKyc);
    return newKyc;
  }
  
  async updateKyc(id: number, data: Partial<KycVerification>): Promise<KycVerification> {
    const kyc = this.kycs.get(id);
    if (!kyc) {
      throw new Error(`KYC with id ${id} not found`);
    }
    
    const updatedKyc = { ...kyc, ...data, updatedAt: new Date() };
    this.kycs.set(id, updatedKyc);
    return updatedKyc;
  }
  
  // Loan Type operations
  async getLoanTypes(): Promise<LoanType[]> {
    return Array.from(this.loanTypes.values());
  }
  
  async getLoanType(id: number): Promise<LoanType | undefined> {
    return this.loanTypes.get(id);
  }
  
  // Loan Application operations
  async createLoanApplication(application: InsertLoanApplication): Promise<LoanApplication> {
    const id = this.applicationId++;
    const applicationId = `LA-${Math.floor(Math.random() * 90000) + 10000}`;
    
    const newApplication: LoanApplication = {
      ...application,
      id,
      applicationId,
      status: "pending",
      creditScore: null,
      interestRate: null,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.loanApplications.set(id, newApplication);
    return newApplication;
  }
  
  async getLoanApplication(id: number): Promise<LoanApplication | undefined> {
    return this.loanApplications.get(id);
  }
  
  async getLoanApplicationsByUserId(userId: number): Promise<LoanApplication[]> {
    return Array.from(this.loanApplications.values()).filter(
      (application) => application.userId === userId
    );
  }
  
  async updateLoanApplication(id: number, data: Partial<LoanApplication>): Promise<LoanApplication> {
    const application = this.loanApplications.get(id);
    if (!application) {
      throw new Error(`Loan application with id ${id} not found`);
    }
    
    const updatedApplication = { ...application, ...data, updatedAt: new Date() };
    this.loanApplications.set(id, updatedApplication);
    return updatedApplication;
  }
  
  // Loan operations
  async createLoan(loan: InsertLoan): Promise<Loan> {
    const id = this.loanId++;
    const loanId = `LOAN-${Math.floor(Math.random() * 900000) + 100000}`;
    
    const newLoan: Loan = {
      ...loan,
      id,
      loanId,
      status: "active",
      createdAt: new Date()
    };
    
    this.loans.set(id, newLoan);
    return newLoan;
  }
  
  async getLoan(id: number): Promise<Loan | undefined> {
    return this.loans.get(id);
  }
  
  async getLoansByUserId(userId: number): Promise<Loan[]> {
    return Array.from(this.loans.values()).filter(
      (loan) => loan.userId === userId
    );
  }
  
  async updateLoan(id: number, data: Partial<Loan>): Promise<Loan> {
    const loan = this.loans.get(id);
    if (!loan) {
      throw new Error(`Loan with id ${id} not found`);
    }
    
    const updatedLoan = { ...loan, ...data };
    this.loans.set(id, updatedLoan);
    return updatedLoan;
  }
  
  // Repayment operations
  async createRepayment(repayment: InsertRepayment): Promise<Repayment> {
    const id = this.repaymentId++;
    
    const newRepayment: Repayment = {
      ...repayment,
      id,
      paidDate: null,
      status: "pending",
      transactionId: null,
      createdAt: new Date()
    };
    
    this.repayments.set(id, newRepayment);
    return newRepayment;
  }
  
  async getRepayment(id: number): Promise<Repayment | undefined> {
    return this.repayments.get(id);
  }
  
  async getRepaymentsByLoanId(loanId: number): Promise<Repayment[]> {
    return Array.from(this.repayments.values()).filter(
      (repayment) => repayment.loanId === loanId
    );
  }
  
  async getRepaymentsByUserId(userId: number): Promise<Repayment[]> {
    return Array.from(this.repayments.values()).filter(
      (repayment) => repayment.userId === userId
    );
  }
  
  async updateRepayment(id: number, data: Partial<Repayment>): Promise<Repayment> {
    const repayment = this.repayments.get(id);
    if (!repayment) {
      throw new Error(`Repayment with id ${id} not found`);
    }
    
    const updatedRepayment = { ...repayment, ...data };
    this.repayments.set(id, updatedRepayment);
    return updatedRepayment;
  }
  
  // Mood Entry operations
  async createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry> {
    const id = this.moodEntryId++;
    
    const newMoodEntry: MoodEntry = {
      ...entry,
      id,
      createdAt: new Date()
    };
    
    this.moodEntries.set(id, newMoodEntry);
    return newMoodEntry;
  }
  
  async getMoodEntry(id: number): Promise<MoodEntry | undefined> {
    return this.moodEntries.get(id);
  }
  
  async getMoodEntriesByUserId(userId: number): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values()).filter(
      (entry) => entry.userId === userId
    );
  }
  
  async getMoodEntriesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<MoodEntry[]> {
    return Array.from(this.moodEntries.values()).filter(
      (entry) => {
        const entryDate = typeof entry.entryDate === 'string' 
          ? new Date(entry.entryDate) 
          : entry.entryDate;
        
        return entry.userId === userId && 
          entryDate >= startDate && 
          entryDate <= endDate;
      }
    );
  }
  
  async updateMoodEntry(id: number, data: Partial<MoodEntry>): Promise<MoodEntry> {
    const entry = this.moodEntries.get(id);
    if (!entry) {
      throw new Error(`Mood entry with id ${id} not found`);
    }
    
    const updatedEntry = { ...entry, ...data };
    this.moodEntries.set(id, updatedEntry);
    return updatedEntry;
  }
  
  // Financial Decision operations
  async createFinancialDecision(decision: InsertFinancialDecision): Promise<FinancialDecision> {
    const id = this.financialDecisionId++;
    
    const newDecision: FinancialDecision = {
      ...decision,
      id,
      impulsivityScore: null,
      createdAt: new Date()
    };
    
    this.financialDecisions.set(id, newDecision);
    return newDecision;
  }
  
  async getFinancialDecision(id: number): Promise<FinancialDecision | undefined> {
    return this.financialDecisions.get(id);
  }
  
  async getFinancialDecisionsByUserId(userId: number): Promise<FinancialDecision[]> {
    return Array.from(this.financialDecisions.values()).filter(
      (decision) => decision.userId === userId
    );
  }
  
  async getFinancialDecisionsByMoodId(moodId: number): Promise<FinancialDecision[]> {
    return Array.from(this.financialDecisions.values()).filter(
      (decision) => decision.moodId === moodId
    );
  }
  
  async updateFinancialDecision(id: number, data: Partial<FinancialDecision>): Promise<FinancialDecision> {
    const decision = this.financialDecisions.get(id);
    if (!decision) {
      throw new Error(`Financial decision with id ${id} not found`);
    }
    
    const updatedDecision = { ...decision, ...data };
    this.financialDecisions.set(id, updatedDecision);
    return updatedDecision;
  }
  
  // Spending Insight operations
  async createSpendingInsight(insight: InsertSpendingInsight): Promise<SpendingInsight> {
    const id = this.spendingInsightId++;
    
    const newInsight: SpendingInsight = {
      ...insight,
      id,
      isAcknowledged: false,
      createdAt: new Date()
    };
    
    this.spendingInsights.set(id, newInsight);
    return newInsight;
  }
  
  async getSpendingInsight(id: number): Promise<SpendingInsight | undefined> {
    return this.spendingInsights.get(id);
  }
  
  async getSpendingInsightsByUserId(userId: number): Promise<SpendingInsight[]> {
    return Array.from(this.spendingInsights.values()).filter(
      (insight) => insight.userId === userId
    );
  }
  
  async updateSpendingInsight(id: number, data: Partial<SpendingInsight>): Promise<SpendingInsight> {
    const insight = this.spendingInsights.get(id);
    if (!insight) {
      throw new Error(`Spending insight with id ${id} not found`);
    }
    
    const updatedInsight = { ...insight, ...data };
    this.spendingInsights.set(id, updatedInsight);
    return updatedInsight;
  }
}

export const storage = new MemStorage();
