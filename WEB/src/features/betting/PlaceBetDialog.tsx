import { useState } from 'react';
import { Dialog } from '@mui/material';

import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { BetDto, BettingConfigDto, MatchDto, SettlementMode } from '../../types';
import { usePlaceBetMutation, useUpdateBetMutation } from './bettingApi';
import { useUserTimeZone } from '../../utils/useUserTimeZone';

interface Props {
  open: boolean;
  config: BettingConfigDto;
  match: MatchDto;
  existingBet?: BetDto;
  settlementMode?: SettlementMode;
  onClose: () => void;
}

const QUICK_AMOUNTS = [50, 100, 200, 500];

const DIALOG_PAPER_SX = { borderRadius: 4, overflow: 'hidden', bgcolor: 'transparent', boxShadow: 'none' } as const;

export function PlaceBetDialog({ open, config, match, existingBet, settlementMode, onClose }: Props) {
  const { formatDate } = useUserTimeZone();
  const isEditMode = !!existingBet;
  const defaultTeamId = existingBet?.selectedTeamId ?? match.homeTeam.id;
  const defaultAmount = existingBet?.betAmount
    ?? (config.isFixedBet && config.defaultBetAmount != null ? config.defaultBetAmount : config.minBetAmount);

  const [selectedTeamId, setSelectedTeamId] = useState<string>(defaultTeamId);
  const [betAmount, setBetAmount] = useState<number | ''>(defaultAmount);
  const [placeBet, { isLoading: isPlacing, error: placeError, isSuccess: placeSuccess, reset: resetPlace }] = usePlaceBetMutation();
  const [updateBet, { isLoading: isUpdating, error: updateError, isSuccess: updateSuccess, reset: resetUpdate }] = useUpdateBetMutation();

  const isLoading = isPlacing || isUpdating;
  const error = placeError || updateError;
  const isSuccess = placeSuccess || updateSuccess;

  const handleClose = () => {
    resetPlace();
    resetUpdate();
    setSelectedTeamId(defaultTeamId);
    setBetAmount(defaultAmount);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedTeamId || betAmount === '') return;
    if (isEditMode) {
      await updateBet({
        betId: existingBet.id,
        body: { selectedTeamId, betAmount: Number(betAmount) },
      });
    } else {
      await placeBet({
        matchBettingConfigId: config.id,
        selectedTeamId,
        betAmount: Number(betAmount),
      });
    }
  };

  const handicapLabel = config.handicap !== 0
    ? `${config.favoredTeamName ?? 'Home'} ${config.handicap > 0 ? '+' : ''}${config.handicap}`
    : null;

  const potentialWin = betAmount !== '' ? Number(betAmount) * config.odds : 0;
  const selectedTeam = selectedTeamId === match.homeTeam.id ? match.homeTeam : match.awayTeam;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: DIALOG_PAPER_SX }}
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#0f1f14] to-[#1a3520] px-6 pt-5 pb-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <SportsSoccerIcon sx={{ fontSize: 18, color: '#34d399' }} />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{isEditMode ? 'Edit Your Bet' : 'Place Your Bet'}</span>
          </div>

          {/* Teams display */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 text-center">
              {match.homeTeam.flagUrl && (
                <img src={match.homeTeam.flagUrl} alt="" className="w-12 h-12 mx-auto mb-1.5 rounded-full object-cover ring-2 ring-white/20 shadow-lg" />
              )}
              <p className="text-sm font-bold text-white">{match.homeTeam.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">{match.homeTeam.code}</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-white/30">VS</span>
            </div>
            <div className="flex-1 text-center">
              {match.awayTeam.flagUrl && (
                <img src={match.awayTeam.flagUrl} alt="" className="w-12 h-12 mx-auto mb-1.5 rounded-full object-cover ring-2 ring-white/20 shadow-lg" />
              )}
              <p className="text-sm font-bold text-white">{match.awayTeam.name}</p>
              <p className="text-[10px] text-slate-400 font-medium">{match.awayTeam.code}</p>
            </div>
          </div>

          {/* Match info badges */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-300 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <AccessTimeIcon sx={{ fontSize: 12 }} />
              {formatDate(match.startTime, 'MMM dd, HH:mm')}
            </span>
            {handicapLabel && (
              <span className="text-[11px] text-amber-300 bg-amber-400/15 px-2.5 py-1 rounded-full font-medium">
                {handicapLabel}
              </span>
            )}
            {/* <span className="text-[11px] text-blue-300 bg-blue-400/15 px-2.5 py-1 rounded-full font-medium">
              ×{config.odds}
            </span> */}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {isSuccess ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircleOutlineIcon sx={{ fontSize: 36, color: '#10b981' }} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{isEditMode ? 'Bet Updated!' : 'Bet Placed!'}</h3>
              <p className="text-sm text-slate-500 mb-1">
                You picked <span className="font-semibold text-gray-700">{selectedTeam.name}</span>
              </p>
              <p className="text-sm text-slate-500">
                Potential win: <span className="font-bold text-emerald-600">+{potentialWin.toLocaleString()}</span>
              </p>
              <button
                onClick={handleClose}
                className="mt-6 px-8 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-sm text-red-700 font-medium">
                    {'data' in error ? (error.data as { error?: string })?.error : `Failed to ${isEditMode ? 'update' : 'place'} bet`}
                  </p>
                </div>
              )}

              {/* Pick a team */}
              <div className="mb-5">
                  <div className="flex items-center justify-between">
                    <label className="gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 block">
                      Pick your winner
                    </label>
                    <p className="gap-2 text-xs font-semibold text-red-400 bg-red/10 px-2.5 py-1 p-4 rounded-xl border-2 mb-2.5 block border-red-350 bg-red-40/50 shadow-sm shadow-red-50">
                      Betting closes {formatDate(config.bettingCloseTime, 'MMM dd, HH:mm')}
                    </p>
                  </div>

                <div className="grid grid-cols-2 gap-3">
                  {[match.homeTeam, match.awayTeam].map((team) => {
                    const isSelected = selectedTeamId === team.id;
                    return (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`
                          relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
                          ${isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm shadow-emerald-100'
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                        {team.flagUrl && (
                          <img src={team.flagUrl} alt="" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                        )}
                        <span className={`text-sm font-bold ${isSelected ? 'text-emerald-700' : 'text-gray-700'}`}>
                          {team.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bet amount */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 block">
                  Bet Amount
                </label>
                {config.isFixedBet ? (
                  <div className="flex items-center justify-center py-3 px-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-2xl font-black text-gray-800">
                      {(config.defaultBetAmount ?? config.minBetAmount).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        min={config.minBetAmount}
                        max={config.maxBetAmount}
                        step={1}
                        className="w-full px-4 py-3 text-lg font-bold text-gray-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all text-center"
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      {QUICK_AMOUNTS.filter((a) => a >= config.minBetAmount && a <= config.maxBetAmount).map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setBetAmount(amount)}
                          className={`
                            flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all
                            ${betAmount === amount
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }
                          `}
                        >
                          {amount}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 text-center">
                      Min: {config.minBetAmount.toLocaleString()} — Max: {config.maxBetAmount.toLocaleString()}
                    </p>
                  </>
                )}
              </div>

              {/* Potential win / loss */}
              {selectedTeamId && betAmount !== '' && (
                <div className="space-y-2 mb-5">
                    {settlementMode === 'WinnerKeepsLoserPays' ? (
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <TrendingUpIcon sx={{ fontSize: 18, transform: 'scaleY(-1)' }} />
                          <span className="font-medium">Potential Loss</span>
                        </div>
                        <span className="text-lg font-black text-red-600">
                          -{Number(betAmount).toLocaleString()}
                        </span>
                      </div>
                    ) :
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <TrendingUpIcon sx={{ fontSize: 18 }} />
                          <span className="font-medium">Potential Win</span>
                        </div>
                        <span className="text-lg font-black text-emerald-600">
                          +{potentialWin.toLocaleString()}
                        </span>
                      </div>}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !selectedTeamId || betAmount === ''}
                  className="flex-[2] py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading && (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {isLoading ? 'Saving...' : isEditMode ? 'Update Bet' : 'Confirm Bet'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
