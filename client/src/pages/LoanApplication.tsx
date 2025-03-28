import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import LoanApplicationForm from "@/components/LoanApplicationForm";
import KycForm from "@/components/KycForm";
import RiskAssessmentDisplay from "@/components/RiskAssessmentDisplay";
import { CheckCircle, AlertCircle, LucideLoader } from "lucide-react";

const LoanApplication = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [kycData, setKycData] = useState<any>(null);
  const [loanData, setLoanData] = useState<any>(null);
  const [loanApplicationId, setLoanApplicationId] = useState<string | null>(null);
  const [resultDialogType, setResultDialogType] = useState<'success' | 'rejected' | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [mutualFundFolios, setMutualFundFolios] = useState<string[]>(['MF123456', 'MF789012']);

  const submitLoanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/loans/apply", data);
      return res.json();
    },
    onSuccess: (data) => {
      // Store application ID and risk assessment data
      if (data.loanApplication) {
        setLoanApplicationId(data.loanApplication.id);
      } else if (data.id) {
        setLoanApplicationId(data.id);
      }
      
      // Store risk assessment data if available
      if (data.riskAssessment) {
        setRiskAssessment(data.riskAssessment);
        setResultDialogType(data.riskAssessment.approved ? 'success' : 'rejected');
      } else {
        setResultDialogType('success');
      }
      
      setShowSuccessDialog(true);
      
      toast({
        title: data.riskAssessment && !data.riskAssessment.approved 
          ? "Loan application rejected" 
          : "Loan application successful",
        description: data.message || "Your application has been processed.",
        variant: data.riskAssessment && !data.riskAssessment.approved ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Loan application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleKycSubmit = (data: any) => {
    setKycData(data);
    
    // Extract mutual fund folio numbers if provided
    if (data.mutualFundFolios && Array.isArray(data.mutualFundFolios)) {
      setMutualFundFolios(data.mutualFundFolios);
    }
    
    setStep(2);
  };

  const handleLoanSubmit = async (data: any) => {
    setLoanData(data);
    
    // Submit KYC, loan data, and mutual fund folios
    const applicationData = {
      kyc: kycData,
      loan: data,
      folioNumbers: mutualFundFolios
    };
    
    await submitLoanMutation.mutateAsync(applicationData);
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const renderDialogContent = () => {
    if (resultDialogType === 'success') {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-6 w-6" />
              Application Approved
            </DialogTitle>
            <DialogDescription>
              Your loan application has been approved. The funds will be disbursed to your bank account shortly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <p className="text-sm text-gray-600 mb-2">Application ID:</p>
            <p className="font-medium">{loanApplicationId || "LA-10234567"}</p>
          </div>
          
          {riskAssessment && <RiskAssessmentDisplay riskAssessment={riskAssessment} />}
          
          <DialogFooter>
            <Button onClick={goToDashboard}>
              Go to Dashboard
            </Button>
          </DialogFooter>
        </>
      );
    } else if (resultDialogType === 'rejected') {
      return (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-6 w-6" />
              Application Rejected
            </DialogTitle>
            <DialogDescription>
              We're sorry, but your loan application has been rejected. Please review the risk assessment details below.
            </DialogDescription>
          </DialogHeader>
          
          {riskAssessment && <RiskAssessmentDisplay riskAssessment={riskAssessment} />}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              Try Again
            </Button>
            <Button onClick={goToDashboard}>
              Go to Dashboard
            </Button>
          </DialogFooter>
        </>
      );
    }
    
    return null;
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Loan Application</CardTitle>
            <CardDescription>
              Complete the following steps to apply for a loan against your mutual funds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <Progress value={step === 1 ? 50 : 100} className="h-2" />
              <div className="flex justify-between mt-2 text-sm">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs mr-2">
                    1
                  </div>
                  <span className="font-medium">KYC & Mutual Funds Verification</span>
                </div>
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs mr-2 ${
                    step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    2
                  </div>
                  <span className={step >= 2 ? "font-medium" : "text-gray-500"}>
                    Loan Details
                  </span>
                </div>
              </div>
            </div>

            {step === 1 && <KycForm onComplete={handleKycSubmit} />}
            
            {step === 2 && (
              <>
                <LoanApplicationForm onSubmit={handleLoanSubmit} />
                
                {submitLoanMutation.isPending && (
                  <div className="flex flex-col items-center justify-center mt-6 p-6 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="animate-spin text-blue-600 mb-4">
                      <svg className="w-10 h-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Processing Your Application</h3>
                    <p className="text-sm text-blue-600 text-center">
                      Our AI is analyzing your mutual fund portfolio and assessing risk factors. This will only take a moment...
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-lg">
            {renderDialogContent()}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LoanApplication;
