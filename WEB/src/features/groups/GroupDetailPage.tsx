import { useParams } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Avatar, Skeleton,
} from '@mui/material';
import { format } from 'date-fns';
import { useGetGroupQuery } from './groupsApi';

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: group, isLoading } = useGetGroupQuery(id ?? '', { skip: !id });

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 2 }} />
      </Box>
    );
  }

  if (!group) return <Typography>Group not found</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5">{group.name}</Typography>
          <Typography variant="body2" color="text.secondary">{group.description}</Typography>
        </Box>
        <Chip label={`Invite: ${group.inviteCode}`} variant="outlined" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }} />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Members ({group.members.length}/{group.maxMembers})</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.members.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.8rem' }}>
                          {member.displayName?.charAt(0).toUpperCase()}
                        </Avatar>
                        {member.displayName ?? 'Unknown'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={member.role} size="small"
                        color={member.role === 'Manager' ? 'primary' : 'default'} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {member.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>{format(new Date(member.joinedAt), 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
