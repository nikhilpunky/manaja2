import { pgTable, text, serial, integer, boolean, timestamp, json, numeric, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  mobile: text("mobile"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const kycVerifications = pgTable("kyc_verifications", {
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

export const loanTypes = pgTable("loan_types", {
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

export const loanApplications = pgTable("loan_applications", {
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

export const loans = pgTable("loans", {
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

export const repayments = pgTable("repayments", {
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

export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mood: text("mood").notNull(), // happy, sad, stressed, anxious, excited, neutral
  intensity: integer("intensity").notNull(), // 1-10 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  entryDate: date("entry_date").notNull()
});

export const financialDecisions = pgTable("financial_decisions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  decisionType: text("decision_type").notNull(), // loan_application, investment, repayment, withdrawal
  amount: numeric("amount").notNull(),
  description: text("description").notNull(),
  moodId: integer("mood_id").references(() => moodEntries.id),
  emotionalTrigger: text("emotional_trigger"),
  impulsivityScore: integer("impulsivity_score"), // AI-calculated score 1-100
  createdAt: timestamp("created_at").defaultNow(),
  decisionDate: date("decision_date").notNull()
});

export const spendingInsights = pgTable("spending_insights", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  insightType: text("insight_type").notNull(), // pattern, recommendation, warning
  description: text("description").notNull(),
  relatedMoods: json("related_moods"), // array of moods associated with this insight
  createdAt: timestamp("created_at").defaultNow(),
  severity: text("severity").notNull(), // low, medium, high
  isAcknowledged: boolean("is_acknowledged").default(false)
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  mobile: true,
});

export const insertKycSchema = createInsertSchema(kycVerifications).pick({
  userId: true,
  aadhaar: true,
  pan: true,
  bankDetails: true,
});

export const insertLoanApplicationSchema = createInsertSchema(loanApplications).pick({
  userId: true,
  loanTypeId: true,
  amount: true,
  tenure: true,
  purpose: true,
  annualIncome: true,
  employmentType: true,
  hasExistingLoans: true,
});

export const insertLoanSchema = createInsertSchema(loans).pick({
  userId: true,
  applicationId: true,
  principalAmount: true,
  interestRate: true,
  tenure: true,
  startDate: true,
  endDate: true,
  emiAmount: true,
  totalInterest: true,
  totalAmount: true,
});

export const insertRepaymentSchema = createInsertSchema(repayments).pick({
  loanId: true,
  userId: true,
  amount: true,
  dueDate: true,
  principal: true,
  interest: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).pick({
  userId: true,
  mood: true,
  intensity: true,
  notes: true,
  entryDate: true,
});

export const insertFinancialDecisionSchema = createInsertSchema(financialDecisions).pick({
  userId: true,
  decisionType: true,
  amount: true,
  description: true,
  moodId: true,
  emotionalTrigger: true,
  decisionDate: true,
});

export const insertSpendingInsightSchema = createInsertSchema(spendingInsights).pick({
  userId: true,
  insightType: true,
  description: true,
  relatedMoods: true,
  severity: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycSchema>;

export type LoanType = typeof loanTypes.$inferSelect;
export type InsertLoanType = z.infer<typeof insertLoanSchema>;

export type LoanApplication = typeof loanApplications.$inferSelect;
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;

export type Repayment = typeof repayments.$inferSelect;
export type InsertRepayment = z.infer<typeof insertRepaymentSchema>;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;

export type FinancialDecision = typeof financialDecisions.$inferSelect;
export type InsertFinancialDecision = z.infer<typeof insertFinancialDecisionSchema>;

export type SpendingInsight = typeof spendingInsights.$inferSelect;
export type InsertSpendingInsight = z.infer<typeof insertSpendingInsightSchema>;
