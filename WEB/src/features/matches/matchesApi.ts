import { apiSlice } from '../../app/api';
import type { MatchDto, PagedResult, UpdateScoreRequest } from '../../types';

export const matchesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMatches: builder.query<PagedResult<MatchDto>, { page?: number; pageSize?: number; status?: string }>({
      query: ({ page = 1, pageSize = 20, status } = {}) => {
        let url = `/matches?page=${page}&pageSize=${pageSize}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      providesTags: ['Matches'],
    }),
    getMatch: builder.query<MatchDto, string>({
      query: (id) => `/matches/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Matches', id }],
    }),
    updateScore: builder.mutation<MatchDto, { id: string; body: UpdateScoreRequest }>({
      query: ({ id, body }) => ({ url: `/matches/${id}/score`, method: 'PUT', body }),
      invalidatesTags: ['Matches'],
    }),
  }),
});

export const { useGetMatchesQuery, useGetMatchQuery, useUpdateScoreMutation } = matchesApi;
