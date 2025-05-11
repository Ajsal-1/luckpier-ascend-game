
import React from 'react';
import { Loader2, CheckCircle, AlertCircle, History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DepositHistoryProps {
  pendingDeposits: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

const DepositHistory: React.FC<DepositHistoryProps> = ({ pendingDeposits, isLoading, onRefresh }) => {
  
  // Format status for display
  const formatStatus = (status: string) => {
    switch(status) {
      case 'pending':
        return (
          <div className="flex items-center text-amber-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            <span>Pending</span>
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex items-center text-emerald-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            <span>Confirmed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            <span>{status}</span>
          </div>
        );
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Card className="bg-[rgba(19,28,41,0.85)] backdrop-blur-lg border-blue-500/20 shadow-xl h-fit relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.1),transparent_70%)]"></div>
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-blue-500/30 flex items-center justify-center">
              <History className="h-3 w-3 text-blue-300" />
            </div>
            <CardTitle className="text-xl font-bold text-white">Recent Deposits</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-blue-500/20" 
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            ) : (
              <History className="h-4 w-4 text-blue-400 hover:text-blue-300" />
            )}
          </Button>
        </div>
        <CardDescription className="text-gray-400 mt-1">
          Your deposit history
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4 relative z-10">
        {pendingDeposits.length > 0 ? (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-900 scrollbar-track-transparent">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-xs text-blue-300 font-medium">Amount</TableHead>
                  <TableHead className="text-xs text-blue-300 font-medium">Status</TableHead>
                  <TableHead className="text-xs text-blue-300 font-medium">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDeposits.map((deposit) => (
                  <TableRow key={deposit.id} className="border-gray-800/50 hover:bg-blue-900/10">
                    <TableCell className="text-sm font-medium text-white">${deposit.amount}</TableCell>
                    <TableCell className="text-xs">{formatStatus(deposit.status)}</TableCell>
                    <TableCell className="text-xs text-gray-400">{formatDate(deposit.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 px-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-900/30 mb-4">
              <History className="h-6 w-6 text-blue-300 opacity-70" />
            </div>
            <p className="text-gray-300 mb-1 font-medium">No deposit history</p>
            <p className="text-xs text-gray-400">Your recent deposits will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DepositHistory;
