import { Card, Box, Typography, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { TeamDto } from '../../../types';

interface Props {
  team: TeamDto;
  isSelected: boolean;
  isDisabled: boolean;
  isCorrect?: boolean;
  onClick: () => void;
  isLoading: boolean;
}

export default function ChampionPredictionCard({ team, isSelected, isDisabled, isCorrect, onClick, isLoading }: Props) {
  const getCardStyles = () => {
    if (isCorrect === true) {
      return {
        border: '2px solid #10b981',
        backgroundColor: '#ecfdf5',
      };
    }
    if (isCorrect === false) {
      return {
        border: '2px solid #ef4444',
        backgroundColor: '#fef2f2',
      };
    }
    if (isSelected) {
      return {
        border: '2px solid #a78bfa',
        backgroundColor: '#faf5ff',
      };
    }
    return {
      border: '2px solid #e5e7eb',
      backgroundColor: '#ffffff',
    };
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled && !isSelected ? 0.6 : 1,
        ...getCardStyles(),
        transition: 'all 0.2s ease-in-out',
        '&:hover': !isDisabled ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
        } : {},
      }}
      className="p-4 text-center relative"
    >
      {isLoading && (
        <Box className="absolute inset-0 flex items-center justify-center bg-white/40 rounded">
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Flag */}
      {team.flagUrl && (
        <img
          src={team.flagUrl}
          alt={team.name}
          className="w-12 h-12 mx-auto mb-2 rounded-full object-cover ring-2 ring-gray-200"
        />
      )}

      {/* Team Name */}
      <Typography variant="body2" className="font-bold text-gray-900 mb-2">
        {team.name}
      </Typography>

      {/* Team Code */}
      <Typography variant="caption" className="text-gray-500">
        {team.code}
      </Typography>

      {/* Result Badge */}
      {isCorrect !== undefined && (
        <div className="mt-2 flex justify-center">
          {isCorrect ? (
            <div className="flex items-center gap-1">
              <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
              <Typography variant="caption" className="font-bold text-green-600">
                ✓
              </Typography>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <CancelIcon sx={{ fontSize: 16, color: '#ef4444' }} />
              <Typography variant="caption" className="font-bold text-red-600">
                ✗
              </Typography>
            </div>
          )}
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && isCorrect === undefined && (
        <div className="mt-2">
          <Typography variant="caption" className="font-bold text-purple-600">
            ★ YOUR PICK
          </Typography>
        </div>
      )}
    </Card>
  );
}
