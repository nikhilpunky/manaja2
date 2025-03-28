import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateJWT, verifyJWT, hashPassword, comparePassword } from "./utils/auth";
import { verifyAadhaar, verifyPan, verifyBankAccount } from "./utils/ekyc";
import { calculateCreditScore } from "./utils/creditScore";
import { disburseLoan, createRepaymentSchedule } from "./utils/payment";
import { 
  analyzeSpendingBehavior, 
  analyzeFinancialDecision, 
  calculateImpulsivityScore, 
  MOOD_TYPES, 
  DECISION_TYPES
} from "./utils/emotionalSpending";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertKycSchema, 
  insertLoanApplicationSchema,
  insertMoodEntrySchema,
  insertFinancialDecisionSchema
} from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticate = async (req: Request, res: Response, next: any) => {
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

      // Attach user info to request
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

  // ========== Authentication Routes ==========
  
  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, mobile, password } = req.body;
      
      // Validate data
      const validatedData = {
        username: email, // Use email as username
        name,
        email,
        mobile,
        password
      };

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      // Generate JWT
      const token = generateJWT(user);

      // Don't return password
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate JWT
      const token = generateJWT(user);

      // Set token in cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Don't return password
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    try {
      // Clear token cookie
      res.clearCookie("token");
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.body.authUser;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ========== eKYC Routes ==========

  // Verify Aadhaar
  app.post("/api/ekyc/verify-aadhaar", authenticate, async (req: Request, res: Response) => {
    try {
      const { aadhaar } = req.body;
      const userId = req.body.authUser.id;

      // Validate Aadhaar
      const aadhaarSchema = z.string().regex(/^\d{12}$/, {
        message: "Aadhaar number must be 12 digits"
      });
      
      try {
        aadhaarSchema.parse(aadhaar);
      } catch (error) {
        return res.status(400).json({ message: "Invalid Aadhaar number format" });
      }

      // Verify Aadhaar using external API
      const verificationResult = await verifyAadhaar(aadhaar);
      
      // Update or create KYC record
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
          pan: "", // Will be filled later
          bankDetails: { accountNumber: "", ifsc: "" }, // Will be filled later
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

  // Verify PAN
  app.post("/api/ekyc/verify-pan", authenticate, async (req: Request, res: Response) => {
    try {
      const { pan } = req.body;
      const userId = req.body.authUser.id;

      // Validate PAN
      const panSchema = z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
        message: "PAN must be in the format ABCDE1234F"
      });
      
      try {
        panSchema.parse(pan);
      } catch (error) {
        return res.status(400).json({ message: "Invalid PAN format" });
      }

      // Verify PAN using external API
      const verificationResult = await verifyPan(pan);
      
      // Update or create KYC record
      let kycRecord = await storage.getKycByUserId(userId);
      
      if (kycRecord) {
        kycRecord = await storage.updateKyc(kycRecord.id, {
          pan,
          panVerified: verificationResult.verified
        });
      } else {
        kycRecord = await storage.createKyc({
          userId,
          aadhaar: "", // Will be filled later
          pan,
          bankDetails: { accountNumber: "", ifsc: "" }, // Will be filled later
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

  // Verify Bank Account
  app.post("/api/ekyc/verify-bank", authenticate, async (req: Request, res: Response) => {
    try {
      const { accountNumber, ifsc } = req.body;
      const userId = req.body.authUser.id;

      // Validate bank details
      const bankSchema = z.object({
        accountNumber: z.string().min(9).max(18),
        ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/)
      });
      
      try {
        bankSchema.parse({ accountNumber, ifsc });
      } catch (error) {
        return res.status(400).json({ message: "Invalid bank details format" });
      }

      // Verify bank account using external API
      const verificationResult = await verifyBankAccount(accountNumber, ifsc);
      
      // Update or create KYC record
      let kycRecord = await storage.getKycByUserId(userId);
      
      if (kycRecord) {
        kycRecord = await storage.updateKyc(kycRecord.id, {
          bankDetails: { accountNumber, ifsc },
          bankVerified: verificationResult.verified
        });
      } else {
        kycRecord = await storage.createKyc({
          userId,
          aadhaar: "", // Will be filled later
          pan: "", // Will be filled later
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

  // ========== Loan Application Routes ==========

  // Apply for loan
  app.post("/api/loans/apply", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      const { loan, kyc, folioNumbers } = req.body;
      
      // Validate loan data
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

      // Check if KYC is completed
      const kycRecord = await storage.getKycByUserId(userId);
      if (!kycRecord || !kycRecord.aadhaarVerified || !kycRecord.panVerified || !kycRecord.bankVerified) {
        return res.status(400).json({ message: "KYC verification is incomplete" });
      }

      // Get loan type
      let loanTypeId;
      switch (loan.loanType) {
        case "short_term_mf":
          loanTypeId = 1; // Short Term Mutual Fund Loan
          break;
        case "medium_term_mf":
          loanTypeId = 2; // Medium Term Mutual Fund Loan
          break;
        case "long_term_mf":
          loanTypeId = 3; // Long Term Mutual Fund Loan
          break;
        default:
          loanTypeId = 1; // Default to Short Term MF Loan
      }

      const loanType = await storage.getLoanType(loanTypeId);
      if (!loanType) {
        return res.status(400).json({ message: "Invalid loan type" });
      }

      // Parse numerical values
      const amount = typeof loan.amount === 'string' ? parseFloat(loan.amount) : loan.amount;
      const tenure = typeof loan.tenure === 'string' ? parseInt(loan.tenure) : loan.tenure;
      const annualIncome = typeof loan.annualIncome === 'string' ? parseFloat(loan.annualIncome) : loan.annualIncome;
      const hasExistingLoans = loan.hasExistingLoans === 'yes' || loan.hasExistingLoans === true;
      const employmentDuration = loan.employmentDuration 
        ? (typeof loan.employmentDuration === 'string' ? parseInt(loan.employmentDuration) : loan.employmentDuration)
        : 24; // Default to 2 years if not provided

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create loan application
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

      // Import AI risk assessment utilities
      const { 
        evaluateRisk, 
        verifyMutualFunds
      } = await import("./utils/riskAssessment");

      // For this MVP, we'll verify mutual funds using the folio numbers from the request
      // In a production app, this would integrate with NSDL or other providers
      const mutualFundFolios = folioNumbers || ['MF123456', 'MF789012', 'MF345678'];
      const mutualFundDetails = await verifyMutualFunds(kycRecord.pan, mutualFundFolios);

      // Calculate credit score (in production, this would call a credit bureau API)
      const creditScore = await calculateCreditScore({
        annualIncome,
        employmentType: loan.employment,
        hasExistingLoans,
        loanAmount: amount,
        tenure
      });

      // Perform AI-based risk assessment
      const riskAssessment = await evaluateRisk({
        user,
        kyc: kycRecord,
        loanApplication,
        creditScore,
        mutualFundDetails,
        existingLoans: hasExistingLoans,
        employmentType: loan.employment,
        employmentDuration
      });

      // Determine status and interest rate based on risk assessment
      let status = riskAssessment.approved ? "approved" : "rejected";
      let interestRate = riskAssessment.suggestedInterestRate;
      let rejectionReason = riskAssessment.rejectionReasons ? 
        riskAssessment.rejectionReasons.join("; ") : 
        null;

      // Update loan application with risk assessment results
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

      // If loan is approved, create loan and repayment schedule
      if (status === "approved") {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + tenure);

        // Calculate EMI
        const principal = amount;
        const ratePerMonth = interestRate / 100 / 12;
        const emiAmount = principal * ratePerMonth * Math.pow(1 + ratePerMonth, tenure) / (Math.pow(1 + ratePerMonth, tenure) - 1);
        const totalAmount = emiAmount * tenure;
        const totalInterest = totalAmount - principal;

        // Create loan record
        const loan = await storage.createLoan({
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

        // Create repayment schedule
        await createRepaymentSchedule(loan, userId);

        // Simulate loan disbursement
        await disburseLoan(loan.id, principal, kycRecord.bankDetails);

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
            id: loan.id,
            amount: loan.principalAmount,
            interestRate: loan.interestRate,
            emiAmount: loan.emiAmount,
            startDate: loan.startDate,
            endDate: loan.endDate
          },
          message: "Your loan has been approved!"
        });
      } else {
        // Return rejection details
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
        error: (error as Error).message 
      });
    }
  });

  // Get user loans
  app.get("/api/loans", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      
      // Get loan applications for user
      const applications = await storage.getLoanApplicationsByUserId(userId);
      
      // Get loans for user
      const loans = await storage.getLoansByUserId(userId);

      // Combine data
      const loanData = [];
      
      // Add pending/rejected applications
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
      
      // Add active loans
      for (const loan of loans) {
        const application = applications.find(a => a.id === loan.applicationId);
        const loanType = application ? await storage.getLoanType(application.loanTypeId) : null;
        
        // Get next payment
        const repayments = await storage.getRepaymentsByLoanId(loan.id);
        const nextPayment = repayments
          .filter(r => r.status === "pending")
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
        
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
            paidAmount: repayments
              .filter(r => r.status === "paid")
              .reduce((sum, r) => sum + Number(r.amount), 0),
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

  // Get user payments
  app.get("/api/payments", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      
      const repayments = await storage.getRepaymentsByUserId(userId);
      
      // Map repayments to response format
      const payments = await Promise.all(repayments.map(async (repayment) => {
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

  // ========== Emotional Spending Insights Routes ==========

  // Get mood types (for dropdown lists, etc.)
  app.get("/api/mood-types", authenticate, async (req: Request, res: Response) => {
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

  // Add mood entry
  app.post("/api/mood", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      const { mood, intensity, notes, entryDate } = req.body;
      
      // Validate data
      const moodSchema = insertMoodEntrySchema.extend({
        mood: z.enum(MOOD_TYPES as [string, ...string[]]),
        intensity: z.number().min(1).max(10),
      });
      
      let validatedData;
      try {
        validatedData = moodSchema.parse({
          userId,
          mood,
          intensity: typeof intensity === 'string' ? parseInt(intensity) : intensity,
          notes: notes || null,
          entryDate: entryDate || new Date().toISOString().split('T')[0]
        });
      } catch (error) {
        return res.status(400).json({ message: "Invalid mood entry data", error });
      }

      // Create mood entry
      const moodEntry = await storage.createMoodEntry(validatedData);
      
      res.status(201).json(moodEntry);
    } catch (error) {
      console.error("Add mood entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get mood entries for user
  app.get("/api/mood", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      const { startDate, endDate } = req.query;
      
      let moodEntries;
      
      if (startDate && endDate) {
        // Convert string dates to Date objects
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        
        moodEntries = await storage.getMoodEntriesByDateRange(userId, start, end);
      } else {
        moodEntries = await storage.getMoodEntriesByUserId(userId);
      }
      
      res.status(200).json({
        moodEntries
      });
    } catch (error) {
      console.error("Get mood entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add financial decision with mood tracking
  app.post("/api/financial-decision", authenticate, async (req: Request, res: Response) => {
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
      
      // Validate data
      const decisionSchema = insertFinancialDecisionSchema.extend({
        decisionType: z.enum(DECISION_TYPES as [string, ...string[]]),
        amount: z.number().positive(),
      });
      
      let moodEntry = null;
      
      // If a current mood is provided but no moodId, create a new mood entry
      if (!moodId && currentMood && currentMoodIntensity) {
        // Create a new mood entry
        moodEntry = await storage.createMoodEntry({
          userId,
          mood: currentMood,
          intensity: typeof currentMoodIntensity === 'string' ? 
            parseInt(currentMoodIntensity) : currentMoodIntensity,
          notes: `Auto-generated for financial decision: ${description}`,
          entryDate: decisionDate || new Date().toISOString().split('T')[0]
        });
      }
      
      // Parse and validate decision data
      let validatedData;
      try {
        validatedData = decisionSchema.parse({
          userId,
          decisionType,
          amount: (typeof amount === 'string' ? parseFloat(amount) : amount).toString(),
          description,
          moodId: moodEntry ? moodEntry.id : (moodId || null),
          emotionalTrigger: emotionalTrigger || null,
          decisionDate: decisionDate || new Date().toISOString().split('T')[0]
        });
      } catch (error) {
        return res.status(400).json({ message: "Invalid financial decision data", error });
      }

      // Create financial decision
      const decision = await storage.createFinancialDecision(validatedData);
      
      // If we have a mood entry, calculate impulsivity and analyze
      let insight = null;
      if (moodEntry || moodId) {
        const moodEntryToUse = moodEntry || await storage.getMoodEntry(moodId);
        
        if (moodEntryToUse) {
          // Calculate impulsivity score
          const impulsivityScore = calculateImpulsivityScore(decision, moodEntryToUse);
          
          // Update decision with impulsivity score
          await storage.updateFinancialDecision(decision.id, { impulsivityScore });
          
          // Analyze decision for potential insights
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

  // Get financial decisions for user
  app.get("/api/financial-decisions", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      const { moodId } = req.query;
      
      let decisions;
      
      if (moodId) {
        const moodIdNum = parseInt(moodId as string);
        if (isNaN(moodIdNum)) {
          return res.status(400).json({ message: "Invalid mood ID" });
        }
        
        decisions = await storage.getFinancialDecisionsByMoodId(moodIdNum);
        // Filter to only this user's decisions (additional security check)
        decisions = decisions.filter(d => d.userId === userId);
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

  // Analyze spending behavior and generate insights
  app.post("/api/analyze-spending", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      
      // Get existing insights
      const existingInsights = await storage.getSpendingInsightsByUserId(userId);
      
      // Run the analysis
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

  // Get spending insights for user
  app.get("/api/spending-insights", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      
      const insights = await storage.getSpendingInsightsByUserId(userId);
      
      // Sort by severity and creation date (newest first)
      insights.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity as keyof typeof severityOrder] - 
                             severityOrder[a.severity as keyof typeof severityOrder];
        
        if (severityDiff !== 0) return severityDiff;
        
        // If same severity, sort by date (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
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

  // Acknowledge an insight
  app.patch("/api/spending-insights/:id/acknowledge", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.body.authUser.id;
      const insightId = parseInt(req.params.id);
      
      if (isNaN(insightId)) {
        return res.status(400).json({ message: "Invalid insight ID" });
      }
      
      // Get the insight
      const insight = await storage.getSpendingInsight(insightId);
      
      if (!insight) {
        return res.status(404).json({ message: "Insight not found" });
      }
      
      // Verify this insight belongs to the user
      if (insight.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to access this insight" });
      }
      
      // Update the insight
      const updatedInsight = await storage.updateSpendingInsight(insightId, {
        isAcknowledged: true
      });
      
      res.status(200).json(updatedInsight);
    } catch (error) {
      console.error("Acknowledge insight error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
