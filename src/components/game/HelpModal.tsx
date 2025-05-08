
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const HelpModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute top-4 right-4 z-10 bg-background/50 backdrop-blur-sm"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">How to Play Crash Game</DialogTitle>
          <DialogDescription className="text-base">
            A simple guide to understand and play the crash game
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Game Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Game Overview</h3>
            <p className="text-muted-foreground">
              Crash is a multiplier game where you bet before each round starts. 
              The multiplier increases from 1.00x and can crash at any random moment. 
              The goal is to cash out before it crashes to win your bet multiplied by the value at cash out.
            </p>
          </div>
          
          <Separator />
          
          {/* How to Play */}
          <div>
            <h3 className="text-lg font-semibold mb-1">How to Play</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Enter your bet amount in the betting panel.</li>
              <li>Choose whether to use auto cash-out and set your target multiplier.</li>
              <li>Click "Place Bet" to join the round.</li>
              <li>When the game starts, the multiplier will increase from 1.00x.</li>
              <li>Click "Cash Out" manually before the game crashes, or let auto cash-out do it for you.</li>
              <li>If you cash out successfully, you win your bet amount × the multiplier.</li>
              <li>If the game crashes before you cash out, you lose your bet.</li>
            </ol>
          </div>
          
          <Separator />
          
          {/* Auto Cashout */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Auto Cash-Out</h3>
            <p className="text-muted-foreground">
              Set a target multiplier for automatic cash-out. This ensures you don't miss cashing out 
              when the multiplier reaches your target. Toggle auto cash-out off if you prefer to cash out manually.
            </p>
          </div>
          
          <Separator />
          
          {/* Game Odds */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Game Odds</h3>
            <p className="text-muted-foreground">
              The game is provably fair with randomized crash points. 
              Higher multipliers are rarer than lower ones. The house edge is built into the odds.
              Occasionally, the game may crash at 1.00x, immediately ending the round.
            </p>
          </div>
          
          <Separator />
          
          {/* Strategy Tips */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Strategy Tips</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Consider setting a low auto cash-out (like 1.5x) for consistent smaller wins.</li>
              <li>Look at game history to spot patterns, but remember each round is independent.</li>
              <li>Never bet more than you can afford to lose.</li>
              <li>Set a profit target and stop playing when you reach it.</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="default">Got It!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;
