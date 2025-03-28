import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RepaymentItem {
  id: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  balance: number;
  status: 'paid' | 'due' | 'upcoming';
}

interface RepaymentScheduleProps {
  schedule: RepaymentItem[];
  loanAmount: number;
  interestRate: number;
  term: number;
}

const RepaymentSchedule: React.FC<RepaymentScheduleProps> = ({
  schedule,
  loanAmount,
  interestRate,
  term,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Paid</Badge>;
      case 'due':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Due</Badge>;
      case 'upcoming':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Upcoming</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repayment Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">Principal Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(loanAmount)}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">Interest Rate</p>
            <p className="text-lg font-semibold">{interestRate}% p.a.</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">Term</p>
            <p className="text-lg font-semibold">{term} months</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>EMI No.</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">EMI Amount</TableHead>
              <TableHead className="text-right">Principal</TableHead>
              <TableHead className="text-right">Interest</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.dueDate}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.principal)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.interest)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.balance)}</TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RepaymentSchedule;
