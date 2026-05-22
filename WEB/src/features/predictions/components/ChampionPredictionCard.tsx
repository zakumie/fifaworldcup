import { useMemo } from 'react';
import { CircularProgress } from '@mui/material';
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
  const cardClass = useMemo(() => {
    const base = 'relative rounded-2xl border-2 p-4 text-center transition-all duration-200 cursor-pointer';
    if (isCorrect === true) return `${base} border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100`;
    if (isCorrect === false) return `${base} border-red-300 bg-red-50/50`;
    if (isSelected) return `${base} border-violet-400 bg-violet-50 shadow-md shadow-violet-100 ring-2 ring-violet-200`;
    if (isDisabled) return `${base} border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed`;
    return `${base} border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:-translate-y-1`;
  }, [isSelected, isDisabled, isCorrect]);

  return (
    <div onClick={isDisabled ? undefined : onClick} className={cardClass}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl z-10">
          <CircularProgress size={22} sx={{ color: '#8b5cf6' }} />
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && isCorrect === undefined && (
        <span className="absolute top-2 right-2 text-[9px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full leading-none">
          ★ PICK
        </span>
      )}

      {/* Flag */}
      {team.flagUrl ? (
        <img
          src={team.flagUrl}
          alt={team.name}
          className={`w-12 h-12 mx-auto mb-2 rounded-full object-cover ring-2 ${
            isSelected ? 'ring-violet-300' : isCorrect === true ? 'ring-emerald-300' : 'ring-gray-200'
          }`}
        />
      ) : (
        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-gray-200">
          <span className="text-lg font-bold text-gray-400">{team.code?.charAt(0)}</span>
        </div>
      )}

      {/* Team Name */}
      <p className="text-sm font-bold text-gray-900 mb-0.5">{team.name}</p>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{team.code}</p>

      {/* Result Badge */}
      {isCorrect !== undefined && (
        <div className="mt-2 flex justify-center">
          {isCorrect ? (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircleIcon sx={{ fontSize: 12 }} /> Win
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
              <CancelIcon sx={{ fontSize: 12 }} /> Lost
            </span>
          )}
        </div>
      )}
    </div>
  );
}
