import { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Avatar, Chip, FormControl, InputLabel, Select, MenuItem, Skeleton,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useGetLeaderboardQuery } from './leaderboardApi';
import { useGetGroupsQuery } from '../groups/groupsApi';

const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function LeaderboardPage() {
  const { data: groupsData } = useGetGroupsQuery();
  const [selectedGroup, setSelectedGroup] = useState('');

  const groups = groupsData ?? [];
  const groupId = selectedGroup || groups[0]?.id || '';

  const { data: leaderboard, isLoading } = useGetLeaderboardQuery(
    { groupId },
    { skip: !groupId }
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Leaderboard</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Group</InputLabel>
          <Select value={groupId} label="Group" onChange={(e) => setSelectedGroup(e.target.value)}>
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!groupId && (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          Join a group to see the leaderboard
        </Typography>
      )}

      {isLoading && <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />}

      {leaderboard && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60}>Rank</TableCell>
                <TableCell>Player</TableCell>
                <TableCell align="right">Bets</TableCell>
                <TableCell align="right">W/L</TableCell>
                <TableCell align="right">Win Rate</TableCell>
                <TableCell align="right">Wagered</TableCell>
                <TableCell align="right">Profit</TableCell>
                <TableCell align="right">Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.userId} sx={entry.rank <= 3 ? { bgcolor: `${rankColors[entry.rank - 1]}10` } : undefined}>
                  <TableCell>
                    {entry.rank <= 3 ? (
                      <EmojiEventsIcon sx={{ color: rankColors[entry.rank - 1], fontSize: 24 }} />
                    ) : (
                      <Typography fontWeight={500}>{entry.rank}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                        {entry.displayName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography fontWeight={500}>{entry.displayName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{entry.totalBets}</TableCell>
                  <TableCell align="right">
                    <Chip label={`${entry.wins}W`} size="small" color="success" sx={{ mr: 0.5 }} />
                    <Chip label={`${entry.losses}L`} size="small" color="error" />
                  </TableCell>
                  <TableCell align="right">{(entry.winRate * 100).toFixed(1)}%</TableCell>
                  <TableCell align="right">{entry.totalWagered.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: entry.profit >= 0 ? 'success.main' : 'error.main' }}>
                    {entry.profit >= 0 ? '+' : ''}{entry.profit.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {entry.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
