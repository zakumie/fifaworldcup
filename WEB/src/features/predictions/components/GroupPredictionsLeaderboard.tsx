import { useMemo, useState } from 'react';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import type { ChampionPredictionDto, TeamDto } from '../../../types';

interface Props {
  predictions: ChampionPredictionDto[];
  isSettled: boolean;
  teams?: TeamDto[];
}

type SortField = 'name' | 'team' | 'date';
type SortDir = 'asc' | 'desc';

const teamMap = (teams?: TeamDto[]) =>
  new Map(teams?.map(t => [t.id, t]) ?? []);


export default function GroupPredictionsLeaderboard({ predictions, isSettled, teams }: Props) {
  const teamsById = useMemo(() => teamMap(teams), [teams]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedPredictions = useMemo(() => {
    const sorted = [...predictions].sort((a, b) => {
      // If settled, correct predictions always come first
      if (isSettled && a.isCorrect !== b.isCorrect) {
        return (b.isCorrect ? 1 : 0) - (a.isCorrect ? 1 : 0);
      }

      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = (a.userDisplayName ?? '').localeCompare(b.userDisplayName ?? '');
          break;
        case 'team':
          cmp = (a.selectedTeamName ?? '').localeCompare(b.selectedTeamName ?? '');
          break;
        case 'date':
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [predictions, isSettled, sortField, sortDir]);

  const correctCount = predictions.filter(p => p.isCorrect).length;
  const totalCount = predictions.length;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc'
      ? <ArrowUpwardIcon sx={{ fontSize: 12 }} />
      : <ArrowDownwardIcon sx={{ fontSize: 12 }} />;
  };

  const colHeaderClass = (field: SortField) =>
    `cursor-pointer select-none flex items-center gap-0.5 transition-colors ${
      sortField === field ? 'text-amber-700' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <EmojiEventsIcon sx={{ fontSize: 18, color: '#d97706' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Group Predictions</h3>
            {isSettled && (
              <p className="text-[11px] text-gray-500">
                {correctCount}/{totalCount} predicted correctly
              </p>
            )}
          </div>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
          {totalCount} {totalCount === 1 ? 'member' : 'members'}
        </span>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[32px_1fr_1fr_auto_auto] items-center gap-3 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider">
        <span className="text-gray-400 text-center">#</span>
        <span className={colHeaderClass('name')} onClick={() => handleSort('name')}>
          Member <SortIcon field="name" />
        </span>
        <span className={colHeaderClass('team')} onClick={() => handleSort('team')}>
          Team <SortIcon field="team" />
        </span>
        {isSettled && <span className="text-gray-400">Result</span>}
        <span className={colHeaderClass('date')} onClick={() => handleSort('date')}>
          Date <SortIcon field="date" />
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {sortedPredictions.map((prediction, idx) => {
          const team = teamsById.get(prediction.selectedTeamId);
          return (
            <div
              key={prediction.id}
              className={`grid grid-cols-[32px_1fr_1fr_auto_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50/50 ${
                isSettled && prediction.isCorrect ? 'bg-emerald-50/30' : ''
              }`}
            >
              {/* # */}
              <span className="text-center text-xs font-bold text-gray-400">{idx + 1}</span>

              {/* Member */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm shrink-0">
                  <span className="text-xs font-bold text-white">
                    {prediction.userDisplayName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{prediction.userDisplayName}</p>
              </div>

              {/* Team */}
              <div className="flex items-center gap-2 min-w-0">
                {team?.flagUrl ? (
                  <img src={team.flagUrl} alt={prediction.selectedTeamName} className="w-5 h-5 rounded-full object-cover ring-1 ring-gray-200 shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0" />
                )}
                <p className="text-sm text-gray-700 truncate">{prediction.selectedTeamName}</p>
              </div>

              {/* Result */}
              {isSettled && (
                prediction.isCorrect ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                    <CheckCircleIcon sx={{ fontSize: 12 }} /> Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 whitespace-nowrap">
                    <CancelIcon sx={{ fontSize: 12 }} /> Wrong
                  </span>
                )
              )}

              {/* Date */}
              <div className="text-right whitespace-nowrap">
                <p className="text-xs font-semibold text-gray-700">
                  {new Date(prediction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(prediction.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {predictions.length === 0 && (
        <div className="text-center py-10">
          <EmojiEventsIcon sx={{ fontSize: 36, color: '#d1d5db' }} />
          <p className="text-sm text-gray-400 mt-2">No predictions yet</p>
        </div>
      )}
    </div>
  );
}
