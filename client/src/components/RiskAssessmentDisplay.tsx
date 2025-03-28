import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RiskAssessmentProps {
  riskAssessment: {
    approved: boolean;
    riskScore: number;
    riskCategory: 'low' | 'medium' | 'high' | 'very_high';
    maxLoanAmount?: number;
    suggestedInterestRate?: number;
    approvalConditions?: string[];
    rejectionReasons?: string[];
  };
}

const RiskAssessmentDisplay = ({ riskAssessment }: RiskAssessmentProps) => {
  const {
    approved,
    riskScore,
    riskCategory,
    maxLoanAmount,
    suggestedInterestRate,
    approvalConditions,
    rejectionReasons,
  } = riskAssessment;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get color based on risk category
  const getRiskColor = () => {
    switch (riskCategory) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-orange-600";
      case "very_high":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Get background color based on risk category
  const getRiskBgColor = () => {
    switch (riskCategory) {
      case "low":
        return "bg-green-50 border-green-200";
      case "medium":
        return "bg-yellow-50 border-yellow-200";
      case "high":
        return "bg-orange-50 border-orange-200";
      case "very_high":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  // Get progress color based on risk score
  const getProgressColor = () => {
    if (riskScore >= 80) return "bg-green-500";
    if (riskScore >= 65) return "bg-yellow-500";
    if (riskScore >= 50) return "bg-orange-500";
    return "bg-red-500";
  };
  
  // No longer needed as we use the progress color directly

  // Get risk icon
  const getRiskIcon = () => {
    switch (riskCategory) {
      case "low":
        return <ShieldCheck className="h-8 w-8 text-green-500" />;
      case "medium":
        return <Info className="h-8 w-8 text-yellow-500" />;
      case "high":
        return <AlertTriangle className="h-8 w-8 text-orange-500" />;
      case "very_high":
        return <ShieldAlert className="h-8 w-8 text-red-500" />;
      default:
        return <AlertCircle className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Card className={`w-full border ${getRiskBgColor()} shadow-md`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl mb-1">AI Risk Assessment</CardTitle>
            <CardDescription>
              Powered by advanced machine learning algorithms
            </CardDescription>
          </div>
          <div>
            {approved ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approved
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 px-3 py-1">
                <AlertCircle className="h-4 w-4 mr-1" /> Rejected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Risk Score</span>
            <span className={`text-sm font-bold ${getRiskColor()}`}>{riskScore} / 100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={getProgressColor()}
              style={{ width: `${riskScore}%`, height: '100%', borderRadius: '0.25rem' }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 pt-1">
            <span>High Risk</span>
            <span>Low Risk</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 p-4 rounded-lg border bg-white">
          {getRiskIcon()}
          <div>
            <h4 className="font-semibold">Risk Category</h4>
            <p className={`text-sm ${getRiskColor()} capitalize font-medium`}>
              {riskCategory.replace('_', ' ')}
            </p>
          </div>
        </div>

        {approved && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maxLoanAmount && (
                <div className="p-4 rounded-lg border bg-white">
                  <h4 className="text-sm text-gray-500 mb-1">Maximum Loan Amount</h4>
                  <p className="font-bold text-lg">{formatCurrency(maxLoanAmount)}</p>
                </div>
              )}
              {suggestedInterestRate && (
                <div className="p-4 rounded-lg border bg-white">
                  <h4 className="text-sm text-gray-500 mb-1">Suggested Interest Rate</h4>
                  <p className="font-bold text-lg">{suggestedInterestRate}% p.a.</p>
                </div>
              )}
            </div>

            {approvalConditions && approvalConditions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Approval Conditions</h4>
                <ul className="space-y-1 list-disc list-inside text-sm">
                  {approvalConditions.map((condition, index) => (
                    <li key={index} className="text-gray-700">{condition}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {!approved && rejectionReasons && rejectionReasons.length > 0 && (
          <div className="space-y-2 p-4 rounded-lg bg-red-50 border border-red-200">
            <h4 className="font-medium text-red-800">Rejection Reasons</h4>
            <ul className="space-y-2 list-disc list-inside text-sm">
              {rejectionReasons.map((reason, index) => (
                <li key={index} className="text-red-700">{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-gray-500">
        <p>Our AI system evaluates multiple factors including credit history, income, portfolio value, and employment stability.</p>
      </CardFooter>
    </Card>
  );
};

export default RiskAssessmentDisplay;