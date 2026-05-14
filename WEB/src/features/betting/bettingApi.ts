import { apiSlice } from '../../app/api';
import type { BetDto, BettingConfigDto, CreateBettingConfigRequest, PlaceBetRequest, UpdateBetRequest, UpdateBettingConfigRequest } from '../../types';

export const bettingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGroupConfigs: builder.query<BettingConfigDto[], { groupId: string }>({
      query: ({ groupId }) => `/betting/groups/${groupId}/configs`,
      providesTags: (_result, _err, { groupId }) => [{ type: 'Bets', id: `configs-${groupId}` }],
    }),
    getBettingConfig: builder.query<BettingConfigDto, { matchId: string; groupId: string }>({
      query: ({ matchId, groupId }) => `/betting/configs?matchId=${matchId}&groupId=${groupId}`,
      providesTags: (_result, _err, { matchId, groupId }) => [{ type: 'Bets', id: `config-${matchId}-${groupId}` }],
    }),
    createBettingConfig: builder.mutation<BettingConfigDto, CreateBettingConfigRequest>({
      query: (body) => ({ url: '/betting/configs', method: 'POST', body }),
      invalidatesTags: (_result, _err, { groupId }) => [{ type: 'Bets', id: `configs-${groupId}` }],
    }),
    updateBettingConfig: builder.mutation<BettingConfigDto, { configId: string; groupId: string; body: UpdateBettingConfigRequest }>({
      query: ({ configId, body }) => ({ url: `/betting/configs/${configId}`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { groupId }) => [{ type: 'Bets', id: `configs-${groupId}` }],
    }),
    placeBet: builder.mutation<BetDto, PlaceBetRequest>({
      query: (body) => ({ url: '/betting/bets', method: 'POST', body }),
      invalidatesTags: ['Bets', 'Groups'],
    }),
    updateBet: builder.mutation<BetDto, { betId: string; body: UpdateBetRequest }>({
      query: ({ betId, body }) => ({ url: `/betting/bets/${betId}`, method: 'PUT', body }),
      invalidatesTags: ['Bets', 'Groups'],
    }),
    getMyBets: builder.query<BetDto[], { groupId: string }>({
      query: ({ groupId }) => `/betting/groups/${groupId}/bets`,
      providesTags: ['Bets'],
    }),
    getMatchBets: builder.query<BetDto[], { groupId: string; matchId: string }>({
      query: ({ groupId, matchId }) => `/betting/groups/${groupId}/matches/${matchId}/bets`,
      providesTags: (_result, _err, { matchId }) => [{ type: 'Bets', id: `match-bets-${matchId}` }],
    }),
  }),
});

export const {
  useGetGroupConfigsQuery,
  useGetBettingConfigQuery,
  useCreateBettingConfigMutation,
  useUpdateBettingConfigMutation,
  usePlaceBetMutation,
  useUpdateBetMutation,
  useGetMyBetsQuery,
  useGetMatchBetsQuery,
} = bettingApi;
