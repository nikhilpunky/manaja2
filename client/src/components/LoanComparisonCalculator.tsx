import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { InfoIcon } from "lucide-react";

const calculatorSchema = z.object({
  loanAmount: z.string().min(1, "Loan amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Please enter a valid amount" }
  ),
  loanTerm: z.number().min(1).max(60),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

const LoanComparisonCalculator = () => {
  const [comparisonData, setComparisonData] = useState<{
    mfLoanEmi: number;
    personalLoanEmi: number;
    mfLoanTotal: number;
    personalLoanTotal: number;
    totalSavings: number;
    savingsPercentage: number;
  } | null>(null);

  // Constants
  const MF_LOAN_RATE = 10.5; // Mutual fund loan interest rate
  const PERSONAL_LOAN_RATE = 16.0; // Personal loan interest rate

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      loanAmount: "100000",
      loanTerm: 12,
    },
  });

  const calculateEMI = (principal: number, rate: number, time: number) => {
    // Convert interest rate from percentage to decimal and calculate monthly rate
    const monthlyRate = rate / 12 / 100;
    
    // Convert time from years to months
    const months = time;
    
    // Calculate EMI using formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, months) 
                / (Math.pow(1 + monthlyRate, months) - 1);
    
    return emi;
  };

  const calculateComparison = (amount: number, term: number) => {
    const mfLoanEmi = calculateEMI(amount, MF_LOAN_RATE, term);
    const personalLoanEmi = calculateEMI(amount, PERSONAL_LOAN_RATE, term);
    
    const mfLoanTotal = mfLoanEmi * term;
    const personalLoanTotal = personalLoanEmi * term;
    
    const totalSavings = personalLoanTotal - mfLoanTotal;
    const savingsPercentage = (totalSavings / personalLoanTotal) * 100;
    
    return {
      mfLoanEmi,
      personalLoanEmi,
      mfLoanTotal,
      personalLoanTotal,
      totalSavings,
      savingsPercentage,
    };
  };

  // Watch for form value changes to update calculations
  const amount = form.watch("loanAmount");
  const term = form.watch("loanTerm");

  useEffect(() => {
    if (amount && term && !isNaN(Number(amount)) && Number(amount) > 0) {
      const comparison = calculateComparison(Number(amount), term);
      setComparisonData(comparison);
    }
  }, [amount, term]);

  const onSubmit = (data: CalculatorFormValues) => {
    const comparison = calculateComparison(Number(data.loanAmount), data.loanTerm);
    setComparisonData(comparison);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="w-full" id="calculator">
      <CardHeader>
        <CardTitle>Loan Comparison Calculator</CardTitle>
        <CardDescription>
          Compare mutual fund loans at {MF_LOAN_RATE}% with personal loans at {PERSONAL_LOAN_RATE}% to see how much you can save.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="loanAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter loan amount"
                      {...field}
                      type="text"
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the amount you wish to borrow
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loanTerm"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Loan Term: {value} month{value > 1 ? "s" : ""}</FormLabel>
                  <FormControl>
                    <Slider
                      defaultValue={[value]}
                      min={1}
                      max={60}
                      step={1}
                      onValueChange={(vals) => onChange(vals[0])}
                      {...fieldProps}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 month</span>
                    <span>60 months</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Calculate Savings</Button>
          </form>
        </Form>

        {comparisonData && (
          <div className="mt-8 space-y-6">
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Mutual Fund Loan at {MF_LOAN_RATE}%</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly EMI:</span>
                  <span className="font-medium">{formatCurrency(comparisonData.mfLoanEmi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Repayment:</span>
                  <span className="font-medium">{formatCurrency(comparisonData.mfLoanTotal)}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-md">
                  <div className="flex items-center text-blue-700">
                    <InfoIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm">Keep your investments intact while getting the funds you need</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Personal Loan at {PERSONAL_LOAN_RATE}%</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly EMI:</span>
                  <span className="font-medium">{formatCurrency(comparisonData.personalLoanEmi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Repayment:</span>
                  <span className="font-medium">{formatCurrency(comparisonData.personalLoanTotal)}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-md border border-green-100 mt-4">
              <h3 className="font-medium text-lg text-green-800 mb-2">Your Savings with Mutual Fund Loan</h3>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Total Savings:</span>
                <span className="font-bold text-green-700">{formatCurrency(comparisonData.totalSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Percentage Saved:</span>
                <span className="font-bold text-green-700">{comparisonData.savingsPercentage.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-gray-500">
        <p>Note: These calculations are for illustrative purposes only. Actual rates may vary based on your profile and market conditions.</p>
      </CardFooter>
    </Card>
  );
};

export default LoanComparisonCalculator;