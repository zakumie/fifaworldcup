import { useState, memo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Tabs, Tab, Skeleton,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { format } from 'date-fns';
import { useGetMatchesQuery } from './matchesApi';
import { useGetGroupConfigsQuery } from '../betting/bettingApi';
import { useGetGroupsQuery, useGetAllGroupsQuery } from '../groups/groupsApi';
import { useAppSelector } from '../../app/hooks';
import { MatchAdminDialog } from './MatchAdminDialog';
import { PlaceBetDialog } from '../betting/PlaceBetDialog';
import type { BettingConfigDto, MatchDto } from '../../types';

const STATUS_TABS = ['All', 'Scheduled', 'Live', 'Finished'];

interface MatchCardProps {
  match: MatchDto;
  config?: BettingConfigDto;
  isAdmin: boolean;
  groupId: string;
}

const MatchCard = memo(function MatchCard({ match, config, isAdmin, groupId }: MatchCardProps) {
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [betDialogOpen, setBetDialogOpen] = useState(false);

  const statusColor = match.status === 'Live' ? 'error' : match.status === 'Finished' ? 'default' : 'primary';

  const now = Date.now();
  const bettingOpen = config
    ? now >= new Date(config.bettingOpenTime).getTime() && now <= new Date(config.bettingCloseTime).getTime()
    : false;

  return (
    <>
      <Card
        sx={{
          '&:hover': { boxShadow: 4 },
          cursor: isAdmin ? 'pointer' : 'default',
        }}
        onClick={isAdmin ? () => setAdminDialogOpen(true) : undefined}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Chip label={match.stage} size="small" variant="outlined" />
            <Box display="flex" gap={0.5} alignItems="center">
              {config?.isSettled && <Chip label="Settled" size="small" color="default" />}
              {config && !config.isSettled && !bettingOpen && (
                <Chip label="Betting Closed" size="small" color="default" variant="outlined" />
              )}
              {config && !config.isSettled && bettingOpen && (
                <Chip label="Betting Open" size="small" color="success" variant="outlined" />
              )}
              <Chip label={match.status} size="small" color={statusColor} />
            </Box>
          </Box>

          <Box display="flex" justifyContent="center" alignItems="center" gap={2} my={2}>
            <Box textAlign="center" flex={1}>
              <Typography variant="body2" fontWeight={600}>{match.homeTeam.name}</Typography>
              <Typography variant="caption" color="text.secondary">{match.homeTeam.code}</Typography>
            </Box>
            <Box textAlign="center" sx={{ minWidth: 80 }}>
              {match.status === 'Scheduled' ? (
                <Typography variant="h6" color="text.secondary">vs</Typography>
              ) : (
                <Typography variant="h5" fontWeight={700}>
                  {match.homeScore} - {match.awayScore}
                </Typography>
              )}
            </Box>
            <Box textAlign="center" flex={1}>
              <Typography variant="body2" fontWeight={600}>{match.awayTeam.name}</Typography>
              <Typography variant="caption" color="text.secondary">{match.awayTeam.code}</Typography>
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {format(new Date(match.startTime), 'MMM dd, HH:mm')}
            </Typography>

            {!isAdmin && groupId && config && !config.isSettled && bettingOpen && (
              <Chip
                label="Bet Now"
                size="small"
                color="success"
                onClick={(e) => { e.stopPropagation(); setBetDialogOpen(true); }}
                clickable
              />
            )}
          </Box>

          {config && config.handicap !== 0 && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Handicap: {config.favoredTeamName ?? 'Home'} {config.handicap > 0 ? '+' : ''}{config.handicap} &nbsp;|&nbsp; Odds ×{config.odds}
            </Typography>
          )}
        </CardContent>
      </Card>

      {adminDialogOpen && (
        <MatchAdminDialog
          open={adminDialogOpen}
          match={match}
          groupId={groupId}
          config={config}
          onClose={() => setAdminDialogOpen(false)}
        />
      )}

      {betDialogOpen && config && (
        <PlaceBetDialog
          open={betDialogOpen}
          config={config}
          match={match}
          onClose={() => setBetDialogOpen(false)}
        />
      )}
    </>
  );
});

export function MatchListPage() {
  const [tab, setTab] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState('');
  const status = tab === 0 ? undefined : STATUS_TABS[tab];

  const { data, isLoading } = useGetMatchesQuery({ status });
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'Admin');

  const { data: myGroups } = useGetGroupsQuery(undefined, { skip: isAdmin === true });
  const { data: allGroups } = useGetAllGroupsQuery(undefined, { skip: isAdmin !== true });
  const groups = isAdmin ? allGroups : myGroups;
  const groupId = selectedGroup || groups?.[0]?.id || '';
  const { data: configs } = useGetGroupConfigsQuery({ groupId }, { skip: !groupId });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Matches</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Group</InputLabel>
          <Select value={groupId} label="Group" onChange={(e) => setSelectedGroup(e.target.value)}>
            {(groups ?? []).map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        {STATUS_TABS.map((t) => <Tab key={t} label={t} />)}
      </Tabs>

      {isLoading && (
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      )}

      <Grid container spacing={2}>
        {data?.items.map((match) => (
          <Grid item xs={12} sm={6} md={4} key={match.id}>
            <MatchCard
              match={match}
              config={configs?.find((c) => c.matchId === match.id)}
              isAdmin={isAdmin ?? false}
              groupId={groupId}
            />
          </Grid>
        ))}
      </Grid>

      {!isLoading && data?.items.length === 0 && (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          No matches found
        </Typography>
      )}
    </Box>
  );
}
