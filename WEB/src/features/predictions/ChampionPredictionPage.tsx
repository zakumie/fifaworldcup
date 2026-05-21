import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Typography, Button, Alert, CircularProgress, Card } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useGetChampionConfigQuery, useGetMyChampionPredictionQuery, usePlaceChampionPredictionMutation, useGetGroupChampionPredictionsQuery } from './championApi';
import { useGetTeamsQuery } from '../matches/matchesApi';
import { useAlert } from '../../components/AlertSnackbar';
import type { TeamDto } from '../../types';
import PredictionDeadlineTimer from './components/PredictionDeadlineTimer';
import ChampionPredictionCard from './components/ChampionPredictionCard';
import GroupPredictionsLeaderboard from './components/GroupPredictionsLeaderboard';

export default function ChampionPredictionPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { showAlert } = useAlert();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  if (!groupId) return <Typography>Group not found</Typography>;

  const { data: config, isLoading: configLoading } = useGetChampionConfigQuery({ groupId });
  const { data: myPrediction, isLoading: predictionLoading } = useGetMyChampionPredictionQuery({ groupId });
  const { data: teams, isLoading: teamsLoading } = useGetTeamsQuery();
  const { data: groupPredictions } = useGetGroupChampionPredictionsQuery({ groupId });
  const [placeChampionPrediction, { isLoading: isPlacing, error: placeError }] = usePlaceChampionPredictionMutation();

  useEffect(() => {
    if (myPrediction?.selectedTeamId) {
      setSelectedTeamId(myPrediction.selectedTeamId);
    }
  }, [myPrediction?.selectedTeamId]);

  useEffect(() => {
    if (placeError) {
      const errorMsg = 'error' in placeError ? (placeError.error as string) : (placeError as any)?.data?.error || 'Failed to place prediction';
      showAlert(errorMsg, 'error');
    }
  }, [placeError, showAlert]);

  const handleSelectTeam = async (teamId: string) => {
    setSelectedTeamId(teamId);
    try {
      await placeChampionPrediction({ groupId, selectedTeamId: teamId }).unwrap();
      showAlert(myPrediction ? 'Prediction updated!' : 'Prediction placed!', 'success');
    } catch {
      setSelectedTeamId(myPrediction?.selectedTeamId || null);
    }
  };

  if (configLoading || teamsLoading || predictionLoading) return <CircularProgress />;

  if (!config) return <Alert severity="error">No championship prediction config found</Alert>;

  const now = new Date();
  const isOpen = now >= new Date(config.predictionOpenTime) && now < new Date(config.predictionCloseTime);
  const isClosed = now >= new Date(config.predictionCloseTime);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <EmojiEventsIcon sx={{ fontSize: 28, color: '#fbbf24' }} />
          <Typography variant="h4" className="font-bold">
            Champion Prediction
          </Typography>
        </div>
        
        {config.isSettled && config.winnerTeamId && (
          <Card className="p-4 bg-green-50 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircleIcon sx={{ color: '#10b981', fontSize: 24 }} />
              <div>
                <Typography variant="subtitle2" className="font-bold">
                  Championship Settled
                </Typography>
                <Typography variant="body2" className="text-gray-600">
                  Winner: <span className="font-bold">{teams?.find((t: TeamDto) => t.id === config.winnerTeamId)?.name}</span>
                </Typography>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Timing Info */}
      {!config.isSettled && (
        <Card className="p-4 mb-6 bg-blue-50 border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <Typography variant="subtitle2" className="font-bold text-gray-900">
                {isOpen ? '⏱️ Prediction Window Open' : isClosed ? '🔒 Prediction Closed' : '⏳ Prediction Not Open Yet'}
              </Typography>
              <Typography variant="body2" className="text-gray-600 mt-1">
                Opens: {new Date(config.predictionOpenTime).toLocaleString()}
              </Typography>
              <Typography variant="body2" className="text-gray-600">
                Closes: {new Date(config.predictionCloseTime).toLocaleString()}
              </Typography>
            </div>
            {isOpen && <PredictionDeadlineTimer closeTime={config.predictionCloseTime} />}
          </div>
        </Card>
      )}

      {/* Teams Grid */}
      <div className="mb-8">
        <Typography variant="h6" className="font-bold mb-4">
          Select Your Champion
        </Typography>

        {isClosed && !config.isSettled && (
          <Alert severity="warning" className="mb-4">
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
                onClick={() => !isClosed && !config.isSettled && handleSelectTeam(team.id)}
                isLoading={isPlacing && selectedTeamId === team.id}
              />
            </Grid>
          ))}
        </Grid>
      </div>

      {/* Your Prediction Status */}
      {myPrediction && (
        <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="subtitle2" className="font-bold text-gray-900">
                Your Prediction
              </Typography>
              <Typography variant="body2" className="text-gray-600 mt-1">
                {myPrediction.selectedTeamName}
              </Typography>
              {config.isSettled && (
                <div className="flex items-center gap-1 mt-2">
                  {myPrediction.isCorrect ? (
                    <>
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="body2" className="text-green-600 font-bold">
                        Correct! 🎉
                      </Typography>
                    </>
                  ) : (
                    <>
                      <CancelIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                      <Typography variant="body2" className="text-red-600 font-bold">
                        Incorrect
                      </Typography>
                    </>
                  )}
                </div>
              )}
            </div>
            {!config.isSettled && isOpen && (
              <Button
                size="small"
                onClick={() => setSelectedTeamId(null)}
                startIcon={<CloseIcon />}
                variant="outlined"
                color="secondary"
              >
                Change
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Group Predictions Leaderboard */}
      {groupPredictions && <GroupPredictionsLeaderboard predictions={groupPredictions} isSettled={config.isSettled} />}
    </div>
  );
}
