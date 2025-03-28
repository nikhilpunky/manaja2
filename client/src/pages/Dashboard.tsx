import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Clock,
  CreditCard,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import RepaymentSchedule from "@/components/RepaymentSchedule";

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: loans, isLoading: isLoadingLoans } = useQuery({
    queryKey: ["/api/loans"],
    onError: (error) => {
      console.error("Failed to fetch loans:", error);
    },
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/payments"],
    onError: (error) => {
      console.error("Failed to fetch payments:", error);
    },
  });

  const getRepaymentStatus = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            <span>Paid</span>
          </div>
        );
      case "due":
        return (
          <div className="flex items-center text-amber-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>Due</span>
          </div>
        );
      case "overdue":
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Overdue</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-1" />
            <span>Upcoming</span>
          </div>
        );
    }
  };

  const getLoanStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Approved
          </div>
        );
      case "pending":
        return (
          <div className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
            Pending
          </div>
        );
      case "rejected":
        return (
          <div className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Rejected
          </div>
        );
      default:
        return (
          <div className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            Processing
          </div>
        );
    }
  };

  const mockSchedule = [
    {
      id: 1,
      dueDate: "10 May 2023",
      amount: 10000,
      principal: 8500,
      interest: 1500,
      balance: 91500,
      status: "paid" as const,
    },
    {
      id: 2,
      dueDate: "10 June 2023",
      amount: 10000,
      principal: 8650,
      interest: 1350,
      balance: 82850,
      status: "paid" as const,
    },
    {
      id: 3,
      dueDate: "10 July 2023",
      amount: 10000,
      principal: 8800,
      interest: 1200,
      balance: 74050,
      status: "due" as const,
    },
    {
      id: 4,
      dueDate: "10 August 2023",
      amount: 10000,
      principal: 8950,
      interest: 1050,
      balance: 65100,
      status: "upcoming" as const,
    },
    {
      id: 5,
      dueDate: "10 September 2023",
      amount: 10000,
      principal: 9100,
      interest: 900,
      balance: 56000,
      status: "upcoming" as const,
    },
  ];

  const mockLoans = [
    {
      id: 1,
      type: "Short-Term MF Loan",
      amount: 100000,
      term: 12,
      interestRate: 8.99,
      status: "approved",
      disbursementDate: "15 April 2023",
      nextPaymentDate: "10 July 2023",
      nextPaymentAmount: 10000,
      collateralValue: 250000,
      fundType: "Equity Funds",
    },
    {
      id: 2,
      type: "Medium-Term MF Loan",
      amount: 500000,
      term: 36,
      interestRate: 9.49,
      status: "pending",
      disbursementDate: null,
      nextPaymentDate: null,
      nextPaymentAmount: null,
      collateralValue: 1200000,
      fundType: "Hybrid Funds",
    },
  ];

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name || "User"}
          </h1>
          <p className="text-gray-600 mt-1">Manage your mutual fund loans and payments</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link href="/apply">
            <Button>
              Apply for New Loan <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingLoans ? <Skeleton className="h-8 w-16" /> : "1"}
            </div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingLoans ? <Skeleton className="h-8 w-16" /> : "2"}
            </div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingPayments ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                "₹10,000"
              )}
            </div>
            <p className="text-xs text-muted-foreground">Due on 10 July 2023</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans">My Loans</TabsTrigger>
          <TabsTrigger value="repayments">Repayment Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Summary</CardTitle>
              <CardDescription>
                Overview of your current loans and repayments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-medium">Active Loans</h3>
              {isLoadingLoans ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {mockLoans
                    .filter((loan) => loan.status === "approved")
                    .map((loan) => (
                      <div
                        key={loan.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{loan.type}</h4>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(loan.amount)} • {loan.term} months •{" "}
                            {loan.interestRate}% p.a.
                          </div>
                        </div>
                        <div className="mt-2 md:mt-0 flex flex-col md:items-end">
                          <div className="text-sm">
                            Next payment: {formatCurrency(loan.nextPaymentAmount)}
                          </div>
                          <div className="text-xs text-gray-600">
                            Due on {loan.nextPaymentDate}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <Separator className="my-4" />

              <h3 className="text-lg font-medium">Upcoming Payments</h3>
              {isLoadingPayments ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {mockSchedule
                    .filter((item) => item.status === "due" || item.status === "upcoming")
                    .slice(0, 2)
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">EMI #{payment.id}</div>
                          <div className="text-sm text-gray-600">
                            Due on {payment.dueDate}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div>{formatCurrency(payment.amount)}</div>
                          <div>{getRepaymentStatus(payment.status)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Loans</CardTitle>
              <CardDescription>Details of all your loans</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLoans ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {mockLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{loan.type}</h3>
                          <p className="text-sm text-gray-600">
                            {loan.term} months at {loan.interestRate}% p.a.
                          </p>
                        </div>
                        <div>
                          {getLoanStatusBadge(loan.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Loan Amount</p>
                          <p className="font-medium">{formatCurrency(loan.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Disbursement Date</p>
                          <p className="font-medium">{loan.disbursementDate || "Pending"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Next Payment</p>
                          <p className="font-medium">{formatCurrency(loan.nextPaymentAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="font-medium">{loan.nextPaymentDate || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Mutual Fund Type</p>
                          <p className="font-medium">{loan.fundType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Collateral Value</p>
                          <p className="font-medium">{formatCurrency(loan.collateralValue)}</p>
                        </div>
                      </div>
                      
                      {loan.status === "approved" && (
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repayments">
          <RepaymentSchedule 
            schedule={mockSchedule}
            loanAmount={100000}
            interestRate={10.99}
            term={12}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
