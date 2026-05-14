import { apiSlice } from '../../app/api';
import type { LeaderboardEntryDto } from '../../types';

export const leaderboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboard: builder.query<LeaderboardEntryDto[], { groupId: string }>({
      query: ({ groupId }) => `/leaderboard/groups/${groupId}`,
      providesTags: ['Leaderboard'],
    }),
  }),
});

export const { useGetLeaderboardQuery } = leaderboardApi;
