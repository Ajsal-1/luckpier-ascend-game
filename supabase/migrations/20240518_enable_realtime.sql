
-- Enable Realtime for the rounds table to support multiplayer synchronization
ALTER TABLE public.rounds REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;

-- Enable Realtime for player_bets table to show player activity
ALTER TABLE public.player_bets REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_bets;
