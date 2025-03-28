import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle } from "lucide-react";

const kycSchema = z.object({
  aadhaar: z.string().regex(/^\d{12}$/, {
    message: "Aadhaar number must be 12 digits",
  }),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: "PAN must be in the format ABCDE1234F",
  }),
  accountNumber: z.string().min(9).max(18, {
    message: "Account number must be between 9 and 18 characters",
  }),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
    message: "IFSC code must be in the format ABCD0123456",
  }),
});

type KycFormValues = z.infer<typeof kycSchema>;

interface KycFormProps {
  onComplete: (data: any) => void;
}

const KycForm: React.FC<KycFormProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState({
    aadhaar: false,
    pan: false,
    bank: false,
  });

  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      aadhaar: "",
      pan: "",
      accountNumber: "",
      ifsc: "",
    },
  });

  const verifyAadhaar = async () => {
    const aadhaar = form.getValues("aadhaar");
    if (!aadhaar || aadhaar.length !== 12) {
      form.setError("aadhaar", { message: "Please enter a valid 12-digit Aadhaar number" });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/ekyc/verify-aadhaar", { aadhaar });
      const data = await response.json();
      
      if (data.verified) {
        setVerificationStatus(prev => ({ ...prev, aadhaar: true }));
        toast({
          title: "Aadhaar Verified",
          description: "Your Aadhaar number has been successfully verified.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify Aadhaar. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const verifyPan = async () => {
    const pan = form.getValues("pan");
    if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      form.setError("pan", { message: "Please enter a valid PAN number" });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/ekyc/verify-pan", { pan });
      const data = await response.json();
      
      if (data.verified) {
        setVerificationStatus(prev => ({ ...prev, pan: true }));
        toast({
          title: "PAN Verified",
          description: "Your PAN number has been successfully verified.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify PAN. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const verifyBankAccount = async () => {
    const accountNumber = form.getValues("accountNumber");
    const ifsc = form.getValues("ifsc");
    
    if (!accountNumber || !ifsc) {
      if (!accountNumber) form.setError("accountNumber", { message: "Account number is required" });
      if (!ifsc) form.setError("ifsc", { message: "IFSC code is required" });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/ekyc/verify-bank", { 
        accountNumber, 
        ifsc 
      });
      const data = await response.json();
      
      if (data.verified) {
        setVerificationStatus(prev => ({ ...prev, bank: true }));
        toast({
          title: "Bank Account Verified",
          description: "Your bank account details have been successfully verified.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify bank account. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: KycFormValues) => {
    if (!verificationStatus.aadhaar || !verificationStatus.pan || !verificationStatus.bank) {
      toast({
        title: "Verification Required",
        description: "Please verify all your details before proceeding.",
        variant: "destructive",
      });
      return;
    }

    onComplete({
      aadhaar: data.aadhaar,
      pan: data.pan,
      bankDetails: {
        accountNumber: data.accountNumber,
        ifsc: data.ifsc,
      },
      verified: true,
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">KYC Verification</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-md font-medium">Identity Verification</h3>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="aadhaar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aadhaar Number</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            placeholder="Enter 12-digit Aadhaar number" 
                            {...field} 
                            disabled={verificationStatus.aadhaar}
                          />
                        </FormControl>
                        {verificationStatus.aadhaar ? (
                          <CheckCircle className="h-5 w-5 text-green-600 self-end mb-2" />
                        ) : (
                          <Button 
                            type="button" 
                            onClick={verifyAadhaar} 
                            variant="outline" 
                            className="self-end"
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="pan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            placeholder="Enter PAN" 
                            {...field} 
                            disabled={verificationStatus.pan}
                          />
                        </FormControl>
                        {verificationStatus.pan ? (
                          <CheckCircle className="h-5 w-5 text-green-600 self-end mb-2" />
                        ) : (
                          <Button 
                            type="button" 
                            onClick={verifyPan} 
                            variant="outline" 
                            className="self-end"
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-medium">Bank Account Verification</h3>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter account number" 
                          {...field} 
                          disabled={verificationStatus.bank}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="ifsc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter IFSC code" 
                          {...field} 
                          disabled={verificationStatus.bank}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              {verificationStatus.bank ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Bank account verified</span>
                </div>
              ) : (
                <Button 
                  type="button" 
                  onClick={verifyBankAccount} 
                  variant="outline"
                >
                  Verify Bank Account
                </Button>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!verificationStatus.aadhaar || !verificationStatus.pan || !verificationStatus.bank}
          >
            Complete KYC
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default KycForm;
