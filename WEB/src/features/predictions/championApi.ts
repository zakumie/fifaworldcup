import { apiSlice } from '../../app/api';
import type {
  ChampionConfigDto,
  ChampionPredictionDto,
  CreateChampionConfigRequest,
  PlaceChampionPredictionRequest,
  SettleChampionPredictionRequest,
  UpdateChampionConfigRequest,
} from '../../types';

export const championApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChampionConfig: builder.query<ChampionConfigDto, { groupId: string }>({
      query: ({ groupId }) => `/championpredictions/groups/${groupId}/config`,
      providesTags: (_result, _err, { groupId }) => [{ type: 'Predictions', id: `config-${groupId}` }],
    }),

    createChampionConfig: builder.mutation<ChampionConfigDto, CreateChampionConfigRequest>({
      query: (body) => ({ url: '/championpredictions/configs', method: 'POST', body }),
      invalidatesTags: (_result, _err, { groupId }) => [{ type: 'Predictions', id: `config-${groupId}` }],
    }),

    updateChampionConfig: builder.mutation<ChampionConfigDto, { groupId: string; body: UpdateChampionConfigRequest }>({
      query: ({ groupId, body }) => ({ url: `/championpredictions/groups/${groupId}/config`, method: 'PUT', body }),
      invalidatesTags: (_result, _err, { groupId }) => [{ type: 'Predictions', id: `config-${groupId}` }],
    }),

    placeChampionPrediction: builder.mutation<ChampionPredictionDto, PlaceChampionPredictionRequest>({
      query: (body) => ({ url: '/championpredictions/predictions', method: 'POST', body }),
      invalidatesTags: (_result, _err, { groupId }) => [
        { type: 'Predictions', id: `config-${groupId}` },
        { type: 'Predictions', id: `my-prediction-${groupId}` },
        { type: 'Predictions', id: `group-predictions-${groupId}` },
      ],
    }),

    getMyChampionPrediction: builder.query<ChampionPredictionDto | null, { groupId: string }>({
      query: ({ groupId }) => `/championpredictions/groups/${groupId}/predictions/mine`,
      providesTags: (_result, _err, { groupId }) => [{ type: 'Predictions', id: `my-prediction-${groupId}` }],
    }),

    getGroupChampionPredictions: builder.query<ChampionPredictionDto[], { groupId: string }>({
      query: ({ groupId }) => `/championpredictions/groups/${groupId}/predictions`,
      providesTags: (_result, _err, { groupId }) => [{ type: 'Predictions', id: `group-predictions-${groupId}` }],
    }),

    settleChampionPredictions: builder.mutation<{ message: string }, { groupId: string; body: SettleChampionPredictionRequest }>({
      query: ({ groupId, body }) => ({ url: `/championpredictions/groups/${groupId}/settle`, method: 'POST', body }),
      invalidatesTags: (_result, _err, { groupId }) => [
        { type: 'Predictions', id: `config-${groupId}` },
        { type: 'Predictions', id: `group-predictions-${groupId}` },
      ],
    }),
  }),
});

export const {
  useGetChampionConfigQuery,
  useCreateChampionConfigMutation,
  useUpdateChampionConfigMutation,
  usePlaceChampionPredictionMutation,
  useGetMyChampionPredictionQuery,
  useGetGroupChampionPredictionsQuery,
  useSettleChampionPredictionsMutation,
} = championApi;
