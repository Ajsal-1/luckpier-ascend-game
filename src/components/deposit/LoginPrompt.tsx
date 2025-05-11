
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const LoginPrompt: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto py-12 px-4 min-h-[80vh] flex items-center justify-center">
      <Card className="bg-gradient-to-br from-[#131c29] to-[#192336] border-blue-500/20 shadow-xl w-full max-w-md">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold text-center">
            Please Sign In
          </CardTitle>
          <CardDescription className="text-center">
            You need to be logged in to make deposits
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600"
            onClick={() => navigate('/wallet')}
          >
            Go to Wallet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPrompt;
