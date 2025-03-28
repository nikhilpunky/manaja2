/**
 * This file contains utilities for eKYC (electronic Know Your Customer) verification.
 * In a real implementation, these functions would call external APIs from providers like:
 * - Digio (for Aadhaar & PAN verification)
 * - Karza (for KYC & bank account validation)
 * - Setu (for Bank Account & Financial APIs)
 * 
 * For this MVP implementation, we'll simulate the API calls with mock responses.
 */

interface VerificationResult {
  verified: boolean;
  message: string;
}

/**
 * Verifies an Aadhaar number by calling an external eKYC API
 * 
 * @param aadhaar The 12-digit Aadhaar number to verify
 * @returns A verification result with status and message
 */
export async function verifyAadhaar(aadhaar: string): Promise<VerificationResult> {
  // In a real implementation, this would call the Digio or Karza API
  // Sample implementation for the MVP
  
  // Check if API key is provided
  const apiKey = process.env.EKYC_API_KEY || "demo_api_key";
  
  try {
    // Validate Aadhaar format (12 digits)
    if (!/^\d{12}$/.test(aadhaar)) {
      return {
        verified: false,
        message: "Invalid Aadhaar format. Must be 12 digits."
      };
    }

    // For demo purposes, successful verification for most Aadhaar numbers
    // In real implementation, this would be the API call
    /*
    const response = await fetch('https://api.digio.in/v3/client/kyc/aadhaar/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ aadhaar_number: aadhaar })
    });
    
    const data = await response.json();
    return {
      verified: data.status === 'success',
      message: data.message || 'Verification completed'
    };
    */
    
    // Simulated verification
    console.log(`[eKYC] Verifying Aadhaar: ${aadhaar.substring(0, 4)}XXXX${aadhaar.substring(8)}`);
    
    // Simulated validation logic 
    // For the purpose of the demo, we'll verify all Aadhaar numbers that aren't "111111111111"
    const isVerified = aadhaar !== "111111111111";
    
    return {
      verified: isVerified,
      message: isVerified 
        ? "Aadhaar verified successfully" 
        : "Aadhaar verification failed. Please check your details."
    };
    
  } catch (error) {
    console.error("[eKYC] Aadhaar verification error:", error);
    return {
      verified: false,
      message: "Verification service error. Please try again later."
    };
  }
}

/**
 * Verifies a PAN number by calling an external eKYC API
 * 
 * @param pan The PAN number to verify (format: ABCDE1234F)
 * @returns A verification result with status and message
 */
export async function verifyPan(pan: string): Promise<VerificationResult> {
  // In a real implementation, this would call the Digio or Karza API
  
  // Check if API key is provided
  const apiKey = process.env.EKYC_API_KEY || "demo_api_key";
  
  try {
    // Validate PAN format (5 letters + 4 digits + 1 letter)
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      return {
        verified: false,
        message: "Invalid PAN format. Must be in format ABCDE1234F."
      };
    }

    // For demo purposes, successful verification for most PAN numbers
    // In real implementation, this would be the API call
    /*
    const response = await fetch('https://api.digio.in/v3/client/kyc/pan/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pan_number: pan })
    });
    
    const data = await response.json();
    return {
      verified: data.status === 'success',
      message: data.message || 'Verification completed'
    };
    */
    
    // Simulated verification
    console.log(`[eKYC] Verifying PAN: ${pan}`);
    
    // Simulated validation logic 
    // For the purpose of the demo, we'll verify all PAN cards that aren't "AAAAA0000A"
    const isVerified = pan !== "AAAAA0000A";
    
    return {
      verified: isVerified,
      message: isVerified 
        ? "PAN verified successfully" 
        : "PAN verification failed. Please check your details."
    };
    
  } catch (error) {
    console.error("[eKYC] PAN verification error:", error);
    return {
      verified: false,
      message: "Verification service error. Please try again later."
    };
  }
}

/**
 * Verifies a bank account by calling an external banking verification API
 * 
 * @param accountNumber The bank account number
 * @param ifsc The IFSC code of the bank
 * @returns A verification result with status and message
 */
export async function verifyBankAccount(accountNumber: string, ifsc: string): Promise<VerificationResult> {
  // In a real implementation, this would call the Setu or Karza API
  
  // Check if API key is provided
  const apiKey = process.env.BANK_API_KEY || "demo_api_key";
  
  try {
    // Validate IFSC format
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      return {
        verified: false,
        message: "Invalid IFSC format. Please check and try again."
      };
    }

    // For demo purposes, successful verification for most accounts
    // In real implementation, this would be the API call
    /*
    const response = await fetch('https://api.setu.co/api/v2/banking/accounts/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        account_number: accountNumber,
        ifsc_code: ifsc
      })
    });
    
    const data = await response.json();
    return {
      verified: data.status === 'success',
      message: data.message || 'Verification completed'
    };
    */
    
    // Simulated verification
    console.log(`[eKYC] Verifying Bank Account: XXXX${accountNumber.substring(accountNumber.length - 4)} with IFSC: ${ifsc}`);
    
    // Simulated validation logic
    // For the purpose of the demo, we'll verify all accounts except if IFSC is "DEMO0000000"
    const isVerified = ifsc !== "DEMO0000000";
    
    return {
      verified: isVerified,
      message: isVerified 
        ? "Bank account verified successfully" 
        : "Bank account verification failed. Please check your details."
    };
    
  } catch (error) {
    console.error("[eKYC] Bank account verification error:", error);
    return {
      verified: false,
      message: "Verification service error. Please try again later."
    };
  }
}
