
import React from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DepositInfoSection: React.FC = () => {
  return (
    <Card className="bg-[rgba(19,28,41,0.75)] backdrop-blur-sm border-blue-500/10 shadow-xl mt-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent_70%)]"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <DollarSign className="h-3 w-3 text-blue-300" />
          </div>
          How Deposits Work
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-gray-300 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">1</div>
              <p>Enter the amount you want to deposit and click "Continue to Payment"</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">2</div>
              <p>You'll be redirected to our payment processor where you can complete your payment</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">3</div>
              <p>Once payment is confirmed, your balance will update automatically</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-medium">4</div>
              <p>The process typically takes just a few minutes, but may take longer depending on the payment method</p>
            </div>
          </div>
        </div>
        <div className="mt-6 bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
          <p className="text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
            <span>Need help? Contact our support team at <a href="mailto:support@luckpier.com" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">support@luckpier.com</a></span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DepositInfoSection;
