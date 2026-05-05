import { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Skeleton, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { format } from 'date-fns';
import { useGetMyBetsQuery } from './bettingApi';
import { useGetGroupsQuery } from '../groups/groupsApi';

const statusColorMap: Record<string, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
  Won: 'success',
  HalfWon: 'success',
  Lost: 'error',
  HalfLost: 'error',
  Push: 'warning',
  Pending: 'info',
  Cancelled: 'default',
};

export function BetHistoryPage() {
  const { data: groups } = useGetGroupsQuery();
  const [selectedGroup, setSelectedGroup] = useState('');
  const groupId = selectedGroup || groups?.[0]?.id || '';
  const { data, isLoading } = useGetMyBetsQuery({ groupId }, { skip: !groupId });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">My Bets</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Group</InputLabel>
          <Select value={groupId} label="Group" onChange={(e) => setSelectedGroup(e.target.value)}>
            {(groups ?? []).map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!groupId && (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          Join a group to see your bets
        </Typography>
      )}

      {isLoading && <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />}

      {data && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Match</TableCell>
                <TableCell>Pick</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Profit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((bet) => (
                <TableRow key={bet.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {bet.homeTeamName} vs {bet.awayTeamName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={bet.selectedTeamName} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {bet.betAmount.toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: bet.profit > 0 ? 'success.main' : bet.profit < 0 ? 'error.main' : 'inherit' }}>
                    {bet.profit > 0 ? '+' : ''}{bet.profit.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip label={bet.status} size="small" color={statusColorMap[bet.status] || 'default'} />
                  </TableCell>
                  <TableCell>{format(new Date(bet.createdAt), 'MMM dd, HH:mm')}</TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={3}>No bets placed yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
