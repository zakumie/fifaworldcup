import { apiSlice } from '../../app/api';
import type { GroupDto, GroupDetailDto, CreateGroupRequest, UpdateGroupRequest, JoinGroupRequest, UpdateMemberAmountsRequest } from '../../types';

export const groupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<GroupDto[], void>({
      query: () => '/groups',
      providesTags: ['Groups'],
    }),
    getAllGroups: builder.query<GroupDto[], void>({
      query: () => '/groups/all',
      providesTags: ['Groups'],
    }),
    getGroup: builder.query<GroupDetailDto, string>({
      query: (id) => `/groups/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Groups', id }],
    }),
    createGroup: builder.mutation<GroupDto, CreateGroupRequest>({
      query: (body) => ({ url: '/groups', method: 'POST', body }),
      invalidatesTags: ['Groups'],
    }),
    updateGroup: builder.mutation<GroupDto, { id: string; body: UpdateGroupRequest }>({
      query: ({ id, body }) => ({ url: `/groups/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Groups'],
    }),
    joinGroup: builder.mutation<void, JoinGroupRequest>({
      query: (body) => ({ url: '/groups/join', method: 'POST', body }),
      invalidatesTags: ['Groups'],
    }),
    updateMemberAmounts: builder.mutation<void, { groupId: string; memberId: string; body: UpdateMemberAmountsRequest }>({
      query: ({ groupId, memberId, body }) => ({ url: `/groups/${groupId}/members/${memberId}/amounts`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { groupId }) => [{ type: 'Groups', id: groupId }],
    }),
    leaveGroup: builder.mutation<void, string>({
      query: (id) => ({ url: `/groups/${id}/leave`, method: 'POST' }),
      invalidatesTags: ['Groups'],
    }),
  }),
});

export const {
  useGetGroupsQuery, useGetAllGroupsQuery, useGetGroupQuery,
  useCreateGroupMutation, useUpdateGroupMutation, useJoinGroupMutation, useUpdateMemberAmountsMutation, useLeaveGroupMutation,
} = groupsApi;
