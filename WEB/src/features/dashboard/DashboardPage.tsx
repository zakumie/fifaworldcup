import { useMemo } from 'react';
import { Box, Typography, Grid, Card, CardContent, Skeleton } from '@mui/material';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import GroupsIcon from '@mui/icons-material/Groups';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useGetGroupsQuery } from '../groups/groupsApi';
import { useGetMatchesQuery } from '../matches/matchesApi';
import { useGetMyBetsQuery } from '../betting/bettingApi';
import { useAppSelector } from '../../app/hooks';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h4" fontWeight={700}>{value}</Typography>
          </Box>
          <Box sx={{ bgcolor: `${color}15`, p: 1.5, borderRadius: 2 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: groups, isLoading: groupsLoading } = useGetGroupsQuery();
  const { data: matches, isLoading: matchesLoading } = useGetMatchesQuery({ status: 'Scheduled' });
  const { data: bets, isLoading: betsLoading } = useGetMyBetsQuery({ groupId: '' }, { skip: true });

  const isLoading = groupsLoading || matchesLoading || betsLoading;
  const totalProfit = useMemo(
    () => bets?.reduce((sum, b) => sum + ((b.payout ?? 0) - b.betAmount), 0) ?? 0,
    [bets],
  );

  return (
    <Box>
      <Typography variant="h5" mb={3}>Welcome back, {user?.displayName}!</Typography>

      <Grid container spacing={3} mb={4}>
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Grid>
          ))
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="My Groups" value={groups?.length ?? 0}
                icon={<GroupsIcon sx={{ color: '#1a472a', fontSize: 32 }} />} color="#1a472a" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Upcoming Matches" value={matches?.totalCount ?? 0}
                icon={<SportsSoccerIcon sx={{ color: '#1565c0', fontSize: 32 }} />} color="#1565c0" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Total Bets" value={bets?.length ?? 0}
                icon={<AccountBalanceWalletIcon sx={{ color: '#e65100', fontSize: 32 }} />} color="#e65100" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Net Profit" value={`${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}`}
                icon={<TrendingUpIcon sx={{ color: totalProfit >= 0 ? '#2e7d32' : '#c62828', fontSize: 32 }} />}
                color={totalProfit >= 0 ? '#2e7d32' : '#c62828'} />
            </Grid>
          </>
        )}
      </Grid>

      <Typography variant="h6" mb={2}>Recent Bets</Typography>
      {!bets?.length ? (
        <Card><CardContent>
          <Typography color="text.secondary" textAlign="center">No bets placed yet. Go to Matches to start predicting!</Typography>
        </CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {bets.slice(0, 6).map((bet) => (
            <Grid item xs={12} sm={6} md={4} key={bet.id}>
              <Card>
                <CardContent>
                  <Typography variant="body2" fontWeight={600}>
                    {bet.match.homeTeam.name} vs {bet.match.awayTeam.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Prediction: {bet.predictedHomeScore} - {bet.predictedAwayScore} ({bet.betSide})
                  </Typography>
                  <Box display="flex" justifyContent="space-between" mt={1}>
                    <Typography variant="body2">Bet: {bet.betAmount.toLocaleString()}</Typography>
                    <Typography variant="body2" fontWeight={600}
                      color={bet.status === 'Won' || bet.status === 'HalfWon' ? 'success.main' : bet.status === 'Pending' ? 'info.main' : 'error.main'}>
                      {bet.status}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
