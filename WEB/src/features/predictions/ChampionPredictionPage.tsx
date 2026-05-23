import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid, Button, Alert, CircularProgress, Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { useGetChampionConfigQuery, useGetMyChampionPredictionQuery, usePlaceChampionPredictionMutation, useGetGroupChampionPredictionsQuery } from './championApi';
import { useGetTeamsQuery } from '../matches/matchesApi';
import { useAlert } from '../../components/AlertSnackbar';
import type { TeamDto } from '../../types';
import PredictionDeadlineTimer from './components/PredictionDeadlineTimer';
import ChampionPredictionCard from './components/ChampionPredictionCard';
import GroupPredictionsLeaderboard from './components/GroupPredictionsLeaderboard';

export default function ChampionPredictionPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [pendingTeam, setPendingTeam] = useState<TeamDto | null>(null);
  const [activeTab, setActiveTab] = useState<'pick' | 'leaderboard'>('pick');

  const { data: config, isLoading: configLoading } = useGetChampionConfigQuery(
    { groupId: groupId ?? '' },
    { skip: !groupId }
  );
  const { data: myPrediction, isLoading: predictionLoading } = useGetMyChampionPredictionQuery(
    { groupId: groupId ?? '' },
    { skip: !groupId }
  );
  const { data: teams, isLoading: teamsLoading } = useGetTeamsQuery();
  const { data: groupPredictions } = useGetGroupChampionPredictionsQuery(
    { groupId: groupId ?? '' },
    { skip: !groupId }
  );
  const [placeChampionPrediction, { isLoading: isPlacing, error: placeError }] = usePlaceChampionPredictionMutation();

  useEffect(() => {
    if (myPrediction?.selectedTeamId) {
      setSelectedTeamId(myPrediction.selectedTeamId);
    }
  }, [myPrediction?.selectedTeamId]);

  useEffect(() => {
    if (placeError) {
      const err = placeError as { error?: string; data?: { error?: string } };
      const errorMsg = err.error ?? err.data?.error ?? 'Failed to place prediction';
      showAlert(errorMsg, 'error');
    }
  }, [placeError, showAlert]);

  const handleConfirmPick = useCallback(async () => {
    if (!groupId || !pendingTeam) return;
    setSelectedTeamId(pendingTeam.id);
    setPendingTeam(null);
    try {
      await placeChampionPrediction({ groupId, selectedTeamId: pendingTeam.id }).unwrap();
      showAlert(myPrediction ? 'Prediction updated!' : 'Prediction placed!', 'success');
    } catch {
      setSelectedTeamId(myPrediction?.selectedTeamId || null);
    }
  }, [groupId, pendingTeam, myPrediction, placeChampionPrediction, showAlert]);

  if (!groupId) return <p className="text-center text-gray-500 py-8">Group not found</p>;

  if (configLoading || teamsLoading || predictionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircularProgress sx={{ color: '#fbbf24' }} />
      </div>
    );
  }

  if (!config) return <Alert severity="error" sx={{ borderRadius: 3 }}>No championship prediction config found</Alert>;

  const now = new Date();
  const isOpen = now >= new Date(config.predictionOpenTime) && now < new Date(config.predictionCloseTime);
  const isClosed = now >= new Date(config.predictionCloseTime);
  const winnerTeam = config.isSettled ? teams?.find((t: TeamDto) => t.id === config.winnerTeamId) : null;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-500 rounded-2xl p-4 sm:p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-amber-900/60 hover:text-amber-900 hover:bg-white/20 transition-all"
            >
              <ArrowBackIcon sx={{ fontSize: 20 }} />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/25 backdrop-blur flex items-center justify-center flex-shrink-0">
              <EmojiEventsIcon sx={{ fontSize: { xs: 22, sm: 26 }, color: '#a04500' }} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-amber-950 leading-tight">Champion Prediction</h1>
              <p className="text-xs sm:text-sm text-amber-800/70">Pick the World Cup 2026 winner</p>
            </div>
          </div>
          {isOpen && <PredictionDeadlineTimer closeTime={config.predictionCloseTime} />}
        </div>
      </div>

      {/* Settled Winner Banner */}
      {config.isSettled && winnerTeam && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-700 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center ring-4 ring-emerald-200 dark:ring-emerald-700">
            {winnerTeam.flagUrl ? (
              <img src={winnerTeam.flagUrl} alt={winnerTeam.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <EmojiEventsIcon sx={{ fontSize: 28, color: '#059669' }} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon sx={{ fontSize: 18, color: '#059669' }} />
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Championship Settled</p>
            </div>
            <p className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
              {winnerTeam.name} <span className="text-emerald-600 dark:text-emerald-400 font-medium text-base">({winnerTeam.code})</span>
            </p>
          </div>
        </div>
      )}

      {/* Your Prediction Status */}
      {myPrediction && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 border border-violet-200 dark:border-violet-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-800/50 flex items-center justify-center">
                {(() => {
                  const selectedTeam = teams?.find((t: TeamDto) => t.id === myPrediction.selectedTeamId);
                  return selectedTeam?.flagUrl ? (
                    <img src={selectedTeam.flagUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <EmojiEventsIcon sx={{ fontSize: 18, color: '#7c3aed' }} />
                  );
                })()}
              </div>
              <div>
                <p className="text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wide">Your Prediction</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{myPrediction.selectedTeamName}</p>
                {config.isSettled && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {myPrediction.isCorrect ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircleIcon sx={{ fontSize: 14 }} /> You Win
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                        <CancelIcon sx={{ fontSize: 14 }} /> You Lost
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('pick')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'pick'
              ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <EmojiEventsIcon sx={{ fontSize: 18 }} />
          Select Champion
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <PeopleAltIcon sx={{ fontSize: 18 }} />
          Group Predictions
          {groupPredictions && groupPredictions.length > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'leaderboard' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
            }`}>
              {groupPredictions.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Select Champion */}
      {activeTab === 'pick' && (
        <div className="mb-8">
          {isClosed && !config.isSettled && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>
              Prediction window has closed. You cannot change your prediction.
            </Alert>
          )}

          <Grid container spacing={2}>
            {teams?.map((team: TeamDto) => (
              <Grid item xs={6} sm={4} md={3} key={team.id}>
                <ChampionPredictionCard
                  team={team}
                  isSelected={selectedTeamId === team.id}
                  isDisabled={isClosed && !config.isSettled}
                  isCorrect={
                    config.isSettled && selectedTeamId === team.id
                      ? myPrediction?.isCorrect ?? false
                      : undefined
                  }
                  onClick={() => !isClosed && !config.isSettled && setPendingTeam(team)}
                  isLoading={isPlacing && selectedTeamId === team.id}
                />
              </Grid>
            ))}
          </Grid>
        </div>
      )}

      {/* Tab: Group Predictions */}
      {activeTab === 'leaderboard' && groupPredictions && (
        <GroupPredictionsLeaderboard predictions={groupPredictions} isSettled={config.isSettled} teams={teams} />
      )}

      {/* Confirm Prediction Dialog */}
      <Dialog
        open={!!pendingTeam}
        onClose={() => setPendingTeam(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        {pendingTeam && (
          <DialogContent sx={{ p: 0 }}>
            <div className="bg-gradient-to-br from-amber-500 to-yellow-500 px-6 pt-5 pb-6 relative">
              <IconButton
                onClick={() => setPendingTeam(null)}
                size="small"
                sx={{ position: 'absolute', top: 8, right: 8, color: 'white', opacity: 0.7, '&:hover': { opacity: 1 } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center mb-3 ring-4 ring-white/20">
                  {pendingTeam.flagUrl ? (
                    <img src={pendingTeam.flagUrl} alt={pendingTeam.name} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <EmojiEventsIcon sx={{ fontSize: 32, color: '#78350f' }} />
                  )}
                </div>
                <h3 className="text-lg font-black text-amber-950">{pendingTeam.name}</h3>
                <p className="text-sm text-amber-800/70 mt-1">
                  {myPrediction ? 'Change your champion prediction to' : 'Pick as your champion prediction?'}
                </p>
              </div>
            </div>
            <div className="p-5 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                {myPrediction
                  ? <>You will change from <strong>{myPrediction.selectedTeamName}</strong> to <strong>{pendingTeam.name}</strong></>
                  : <>You are about to predict <strong>{pendingTeam.name}</strong> as the World Cup 2026 champion</>}
              </p>
              <div className="flex gap-2">
                <Button
                  fullWidth
                  onClick={() => setPendingTeam(null)}
                  sx={{ borderRadius: 2, textTransform: 'none', py: 1.2 }}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={isPlacing}
                  onClick={handleConfirmPick}
                  startIcon={<EmojiEventsIcon />}
                  sx={{
                    borderRadius: 2, textTransform: 'none', py: 1.2,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
                  }}
                >
                  {isPlacing ? 'Confirming...' : 'Confirm Pick'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
