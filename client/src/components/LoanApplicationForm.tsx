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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

const loanSchema = z.object({
  loanType: z.string().min(1, { message: "Please select a loan type" }),
  amount: z.string().min(1, { message: "Please enter loan amount" }),
  tenure: z.string().min(1, { message: "Please select loan tenure" }),
  purpose: z.string().min(5, { message: "Please describe the purpose of the loan" }),
  annualIncome: z.string().min(1, { message: "Please enter your annual income" }),
  employment: z.string().min(1, { message: "Please select your employment type" }),
  hasExistingLoans: z.string().min(1, { message: "Please select an option" }),
  mfPortfolioValue: z.string().min(1, { message: "Please enter your mutual fund portfolio value" }),
  mfType: z.string().min(1, { message: "Please select mutual fund type" }),
  mfHoldingPeriod: z.string().min(1, { message: "Please select your mutual fund holding period" }),
});

type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanApplicationFormProps {
  onSubmit: (data: LoanFormValues) => void;
}

const LoanApplicationForm: React.FC<LoanApplicationFormProps> = ({ onSubmit }) => {
  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loanType: "",
      amount: "",
      tenure: "",
      purpose: "",
      annualIncome: "",
      employment: "",
      hasExistingLoans: "",
      mfPortfolioValue: "",
      mfType: "",
      mfHoldingPeriod: "",
    },
  });

  const handleSubmit = (data: LoanFormValues) => {
    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">Loan Application</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-md font-medium">Loan Details</h3>
            
            <FormField
              control={form.control}
              name="loanType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="short-term-mf">Short-Term Mutual Fund Loan</SelectItem>
                      <SelectItem value="medium-term-mf">Medium-Term Mutual Fund Loan</SelectItem>
                      <SelectItem value="long-term-mf">Long-Term Mutual Fund Loan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tenure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Tenure (months)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tenure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Loan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe why you need this loan"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-medium">Financial Information</h3>
            
            <FormField
              control={form.control}
              name="annualIncome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter your annual income" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="salaried">Salaried</SelectItem>
                      <SelectItem value="self-employed">Self-Employed</SelectItem>
                      <SelectItem value="business-owner">Business Owner</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasExistingLoans"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Do you have any existing loans?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-md font-medium">Mutual Fund Information</h3>
            
            <FormField
              control={form.control}
              name="mfPortfolioValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mutual Fund Portfolio Value (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter your mutual fund portfolio value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mfType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mutual Fund Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mutual fund type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="equity">Equity Funds</SelectItem>
                      <SelectItem value="debt">Debt Funds</SelectItem>
                      <SelectItem value="hybrid">Hybrid Funds</SelectItem>
                      <SelectItem value="liquid">Liquid Funds</SelectItem>
                      <SelectItem value="index">Index Funds</SelectItem>
                      <SelectItem value="elss">ELSS Funds</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mfHoldingPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mutual Fund Holding Period</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select holding period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="less-than-1-year">Less than 1 year</SelectItem>
                      <SelectItem value="1-3-years">1-3 years</SelectItem>
                      <SelectItem value="3-5-years">3-5 years</SelectItem>
                      <SelectItem value="more-than-5-years">More than 5 years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full">
            Submit Application
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default LoanApplicationForm;
