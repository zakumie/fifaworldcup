import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, ToggleButton, ToggleButtonGroup,
  TextField, Divider, Chip, Alert, CircularProgress,
} from '@mui/material';
import { format } from 'date-fns';
import type { BettingConfigDto, MatchDto } from '../../types';
import { usePlaceBetMutation } from './bettingApi';

interface Props {
  open: boolean;
  config: BettingConfigDto;
  match: MatchDto;
  onClose: () => void;
}

export function PlaceBetDialog({ open, config, match, onClose }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(match.homeTeam.id);
  const [betAmount, setBetAmount] = useState<number | ''>(
    config.isFixedBet && config.defaultBetAmount != null ? config.defaultBetAmount : config.minBetAmount
  );
  const [placeBet, { isLoading, error, isSuccess, reset: resetMutation }] = usePlaceBetMutation();

  const handleClose = () => {
    resetMutation();
    setSelectedTeamId(match.homeTeam.id);
    setBetAmount(config.isFixedBet && config.defaultBetAmount != null ? config.defaultBetAmount : config.minBetAmount);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedTeamId || betAmount === '') return;
    await placeBet({
      matchBettingConfigId: config.id,
      selectedTeamId,
      betAmount: Number(betAmount),
    });
  };

  const handicapLabel = config.handicap !== 0
    ? `${config.favoredTeamName ?? 'Home'} ${config.handicap > 0 ? '+' : ''}${config.handicap}`
    : 'No handicap';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        Place Bet
        <Typography variant="body2" color="text.secondary">
          {match.homeTeam.name} vs {match.awayTeam.name}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isSuccess ? (
          <Alert severity="success">Bet placed successfully!</Alert>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {error && (
              <Alert severity="error">
                {'data' in error ? (error.data as { error?: string })?.error : 'Failed to place bet'}
              </Alert>
            )}

            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip label={handicapLabel} size="small" variant="outlined" />
              <Chip label={`Odds ×${config.odds}`} size="small" color="primary" variant="outlined" />
              <Chip
                label={`Closes ${format(new Date(config.bettingCloseTime), 'MMM dd, HH:mm')}`}
                size="small" color="warning" variant="outlined" />
            </Box>

            <Divider />

            <Box>
              <Typography variant="body2" fontWeight={500} mb={1}>Pick a team</Typography>
              <ToggleButtonGroup
                value={selectedTeamId}
                exclusive
                onChange={(_, v) => { if (v) setSelectedTeamId(v); }}
                fullWidth
                size="small">
                <ToggleButton value={match.homeTeam.id}>
                  {match.homeTeam.name}
                </ToggleButton>
                <ToggleButton value={match.awayTeam.id}>
                  {match.awayTeam.name}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={500} mb={1}>Bet Amount</Typography>
              {config.isFixedBet ? (
                <Typography variant="h6" fontWeight={700} color="primary">
                  {config.defaultBetAmount?.toLocaleString() ?? config.minBetAmount.toLocaleString()}
                </Typography>
              ) : (
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  inputProps={{ min: config.minBetAmount, max: config.maxBetAmount, step: 1 }}
                  helperText={`Min: ${config.minBetAmount.toLocaleString()} — Max: ${config.maxBetAmount.toLocaleString()}`}
                />
              )}
            </Box>

            {selectedTeamId && betAmount !== '' && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Potential win: <strong>+{(Number(betAmount) * config.odds).toLocaleString()}</strong>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{isSuccess ? 'Close' : 'Cancel'}</Button>
        {!isSuccess && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLoading || !selectedTeamId || betAmount === ''}
            startIcon={isLoading ? <CircularProgress size={16} /> : undefined}>
            Confirm Bet
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
