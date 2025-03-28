/**
 * This module handles loan disbursement and repayment functionalities.
 * In a real implementation, it would integrate with payment gateways like
 * Razorpay, Cashfree, etc.
 */

import { Loan } from "@shared/schema";
import { storage } from "../storage";

interface BankDetails {
  accountNumber: string;
  ifsc: string;
}

/**
 * Disburses a loan amount to the borrower's bank account
 * 
 * @param loanId ID of the loan to disburse
 * @param amount Amount to disburse
 * @param bankDetails Bank account details for disbursement
 */
export async function disburseLoan(loanId: number, amount: number, bankDetails: BankDetails): Promise<void> {
  // In a real implementation, this would call the Razorpay/Cashfree API
  // to initiate a payout to the user's bank account
  
  console.log(`[Payment] Disbursing loan ${loanId}: ₹${amount} to account XXXX${bankDetails.accountNumber.slice(-4)}, IFSC: ${bankDetails.ifsc}`);
  
  // Sample implementation that would be replaced with actual API call
  /*
  const apiKey = process.env.PAYMENT_API_KEY;
  const response = await fetch('https://api.razorpay.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      account_number: bankDetails.accountNumber,
      ifsc: bankDetails.ifsc,
      amount: amount * 100, // Amount in paise
      currency: "INR",
      mode: "NEFT",
      purpose: "loan_disbursement",
      reference_id: `LOAN-${loanId}`
    })
  });
  
  const result = await response.json();
  */
  
  // For demo purposes, assume disbursement is successful
  // In a real implementation, we would update the loan status based on the payout API response
  
  // Update loan status to reflect disbursement
  try {
    const loan = await storage.getLoan(loanId);
    if (loan) {
      await storage.updateLoan(loanId, {
        status: "active"  // loan is now active after disbursement
      });
    }
  } catch (error) {
    console.error(`[Payment] Error updating loan status after disbursement: ${error}`);
  }
}

/**
 * Creates a repayment schedule for a loan
 * 
 * @param loan The loan to create repayment schedule for
 * @param userId The ID of the user who took the loan
 */
export async function createRepaymentSchedule(loan: Loan, userId: number): Promise<void> {
  const { id: loanId, principalAmount, interestRate, tenure, emiAmount, startDate } = loan;
  
  // Monthly interest rate
  const monthlyInterestRate = interestRate / 100 / 12;
  
  // Create schedule with reducing principal
  let remainingPrincipal = Number(principalAmount);
  const dueDate = new Date(startDate);
  
  // Move to the next month for first EMI
  dueDate.setMonth(dueDate.getMonth() + 1);
  
  for (let i = 0; i < tenure; i++) {
    // Calculate interest and principal components for this EMI
    const interestForThisMonth = remainingPrincipal * monthlyInterestRate;
    const principalForThisMonth = Number(emiAmount) - interestForThisMonth;
    
    // Create repayment record
    await storage.createRepayment({
      loanId,
      userId,
      amount: Number(emiAmount),
      dueDate: new Date(dueDate), // Clone the date to avoid reference issues
      principal: principalForThisMonth,
      interest: interestForThisMonth
    });
    
    // Update remaining principal for next iteration
    remainingPrincipal -= principalForThisMonth;
    
    // Move to next month
    dueDate.setMonth(dueDate.getMonth() + 1);
  }
  
  console.log(`[Payment] Created repayment schedule for loan ${loanId} with ${tenure} EMIs of ₹${emiAmount}`);
}

/**
 * Process a loan repayment
 * 
 * @param repaymentId ID of the repayment being made
 * @param amount Amount being repaid
 * @param paymentMethod Payment method details (like UPI ID, card details, etc.)
 */
export async function processRepayment(repaymentId: number, amount: number, paymentMethod: any): Promise<boolean> {
  // In a real implementation, this would call the payment gateway API
  // to process the payment
  
  const repayment = await storage.getRepayment(repaymentId);
  if (!repayment) {
    throw new Error(`Repayment not found: ${repaymentId}`);
  }
  
  console.log(`[Payment] Processing repayment ${repaymentId} for loan ${repayment.loanId}: ₹${amount}`);
  
  // Sample implementation that would be replaced with actual API call
  /*
  const apiKey = process.env.PAYMENT_API_KEY;
  const response = await fetch('https://api.razorpay.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      amount: amount * 100, // Amount in paise
      currency: "INR",
      payment_method: paymentMethod,
      reference_id: `REPAY-${repaymentId}`
    })
  });
  
  const result = await response.json();
  const isSuccess = result.status === 'success';
  */
  
  // For demo purposes, assume payment is successful
  const isSuccess = true;
  const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  // Update repayment status based on payment result
  if (isSuccess) {
    await storage.updateRepayment(repaymentId, {
      status: "paid",
      paidDate: new Date(),
      transactionId
    });
  }
  
  return isSuccess;
}
