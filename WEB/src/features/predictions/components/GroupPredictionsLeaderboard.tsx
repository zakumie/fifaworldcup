import { useMemo } from 'react';
import { Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Chip } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { ChampionPredictionDto } from '../../../types';

interface Props {
  predictions: ChampionPredictionDto[];
  isSettled: boolean;
}

export default function GroupPredictionsLeaderboard({ predictions, isSettled }: Props) {
  const sortedPredictions = useMemo(() => {
    if (!isSettled) {
      return predictions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    // Sort by: correct first, then by creation time
    return predictions.sort((a, b) => {
      if (a.isCorrect === b.isCorrect) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return (b.isCorrect ? 1 : 0) - (a.isCorrect ? 1 : 0);
    });
  }, [predictions, isSettled]);

  const correctCount = predictions.filter(p => p.isCorrect).length;
  const totalCount = predictions.length;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <EmojiEventsIcon sx={{ fontSize: 24, color: '#fbbf24' }} />
        <div>
          <Typography variant="h6" className="font-bold">
            Group Predictions
          </Typography>
          {isSettled && (
            <Typography variant="body2" className="text-gray-600">
              {correctCount} / {totalCount} members predicted correctly
            </Typography>
          )}
        </div>
      </div>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell className="font-bold">Member</TableCell>
              <TableCell className="font-bold">Team</TableCell>
              {isSettled && <TableCell className="font-bold text-center">Result</TableCell>}
              <TableCell className="font-bold text-right">Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedPredictions.map((prediction, idx) => (
              <TableRow key={prediction.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <TableCell>
                  <Typography variant="body2" className="font-medium">
                    {prediction.userDisplayName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{prediction.selectedTeamName}</Typography>
                </TableCell>
                {isSettled && (
                  <TableCell className="text-center">
                    {prediction.isCorrect ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Correct"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<CancelIcon />}
                        label="Incorrect"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <Typography variant="caption" className="text-gray-500">
                    {new Date(prediction.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {predictions.length === 0 && (
        <Box className="text-center py-8">
          <Typography variant="body2" className="text-gray-500">
            No predictions yet
          </Typography>
        </Box>
      )}
    </Card>
  );
}
