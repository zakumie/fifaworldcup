import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Card, CardContent, CardActions, Button,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useGetGroupsQuery, useGetAllGroupsQuery, useCreateGroupMutation, useJoinGroupMutation } from './groupsApi';
import type { CreateGroupRequest, JoinGroupRequest } from '../../types';
import type { RootState } from '../../app/store';

const createSchema = yup.object({
  name: yup.string().min(3).max(50).required('Name is required'),
  description: yup.string().max(200).default(''),
  maxMembers: yup.number().min(2).max(100).required().default(20),
  defaultBalance: yup.number().min(100).max(100000).required().default(10000),
});

const joinSchema = yup.object({
  inviteCode: yup.string().required('Invite code is required'),
});

export function GroupListPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isAdmin = currentUser?.role === 'Admin';
  const { data: myGroups, isLoading: myLoading } = useGetGroupsQuery(undefined, { skip: isAdmin });
  const { data: allGroups, isLoading: allLoading } = useGetAllGroupsQuery(undefined, { skip: !isAdmin });
  const data = isAdmin ? allGroups : myGroups;
  const isLoading = isAdmin ? allLoading : myLoading;
  const [createGroup] = useCreateGroupMutation();
  const [joinGroup] = useJoinGroupMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [error, setError] = useState('');

  const createForm = useForm<CreateGroupRequest>({
    resolver: yupResolver(createSchema),
    defaultValues: { name: '', description: '', maxMembers: 20, defaultBalance: 10000 },
  });

  const joinForm = useForm<JoinGroupRequest>({
    resolver: yupResolver(joinSchema),
    defaultValues: { inviteCode: '' },
  });

  const handleCreate = async (formData: CreateGroupRequest) => {
    try {
      setError('');
      const result = await createGroup(formData).unwrap();
      setCreateOpen(false);
      createForm.reset();
      navigate(`/groups/${result.id}`);
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      setError(status === 403 ? 'You do not have permission to create groups.' : 'Failed to create group');
    }
  };

  const handleJoin = async (formData: JoinGroupRequest) => {
    try {
      setError('');
      await joinGroup(formData).unwrap();
      setJoinOpen(false);
      joinForm.reset();
    } catch {
      setError('Invalid invite code or group is full');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">My Groups</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<LoginIcon />} onClick={() => setJoinOpen(true)}>
            Join Group
          </Button>
          {isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Create Group
            </Button>
          )}
        </Box>
      </Box>

      {isLoading && <Typography>Loading...</Typography>}

      <Grid container spacing={2}>
        {data?.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate(`/groups/${group.id}`)}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <GroupsIcon color="primary" />
                  <Typography variant="h6">{group.name}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {group.description || 'No description'}
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip label={`${group.memberCount}/${group.maxMembers} members`} size="small" />
                </Box>
              </CardContent>
              <CardActions>
                <Button size="small">View Details</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={createForm.handleSubmit(handleCreate)}>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField {...createForm.register('name')} label="Group Name" fullWidth margin="normal"
              error={!!createForm.formState.errors.name} helperText={createForm.formState.errors.name?.message} autoFocus />
            <TextField {...createForm.register('description')} label="Description" fullWidth margin="normal" multiline rows={2} />
            <TextField {...createForm.register('maxMembers')} label="Max Members" type="number" fullWidth margin="normal"
              error={!!createForm.formState.errors.maxMembers} helperText={createForm.formState.errors.maxMembers?.message} />
            <TextField {...createForm.register('defaultBalance')} label="Default Balance" type="number" fullWidth margin="normal"
              error={!!createForm.formState.errors.defaultBalance} helperText={createForm.formState.errors.defaultBalance?.message} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Join Group Dialog */}
      <Dialog open={joinOpen} onClose={() => setJoinOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={joinForm.handleSubmit(handleJoin)}>
          <DialogTitle>Join a Group</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField {...joinForm.register('inviteCode')} label="Invite Code" fullWidth margin="normal"
              error={!!joinForm.formState.errors.inviteCode} helperText={joinForm.formState.errors.inviteCode?.message} autoFocus />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Join</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
