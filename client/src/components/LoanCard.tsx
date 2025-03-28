import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface LoanCardProps {
  title: string;
  description: string;
  features: string[];
  interestRate: string;
  maxAmount: string;
  tenure: string;
  accentColor: "primary" | "secondary" | "accent";
}

const LoanCard: React.FC<LoanCardProps> = ({
  title,
  description,
  features,
  interestRate,
  maxAmount,
  tenure,
  accentColor,
}) => {
  const colorMap = {
    primary: {
      light: "bg-blue-400",
      main: "text-blue-600",
      hover: "hover:bg-blue-600 hover:text-white",
      border: "border-blue-600",
    },
    secondary: {
      light: "bg-green-400",
      main: "text-green-600",
      hover: "hover:bg-green-600 hover:text-white",
      border: "border-green-600",
    },
    accent: {
      light: "bg-orange-400",
      main: "text-orange-600",
      hover: "hover:bg-orange-600 hover:text-white",
      border: "border-orange-600",
    },
  };

  const colors = colorMap[accentColor];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all">
      <div className={`${colors.light} h-2`}></div>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center">
            <CheckCircle className={`${colors.main} mr-2 h-4 w-4`} />
            <span className="text-sm">Interest rate from {interestRate}</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className={`${colors.main} mr-2 h-4 w-4`} />
            <span className="text-sm">Loan amount up to {maxAmount}</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className={`${colors.main} mr-2 h-4 w-4`} />
            <span className="text-sm">Tenure up to {tenure}</span>
          </div>
        </div>
        <Link href="/apply">
          <Button 
            variant="outline" 
            className={`w-full ${colors.main} ${colors.border} ${colors.hover}`}
          >
            Apply Now
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LoanCard;
