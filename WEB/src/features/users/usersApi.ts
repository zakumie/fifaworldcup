import { apiSlice } from '../../app/api';
import type { AdminUserDto, UpdateUserRoleRequest, ToggleUserActiveRequest, UserProfileDto, UpdateProfileRequest } from '../../types';

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<UserProfileDto, void>({
      query: () => '/users/me',
      providesTags: ['Users'],
    }),
    updateProfile: builder.mutation<UserProfileDto, UpdateProfileRequest>({
      query: (body) => ({ url: '/users/me', method: 'PUT', body }),
      invalidatesTags: ['Users'],
    }),
    getAllUsers: builder.query<AdminUserDto[], void>({
      query: () => '/users',
      providesTags: ['Users'],
    }),
    updateUserRole: builder.mutation<AdminUserDto, { id: string; body: UpdateUserRoleRequest }>({
      query: ({ id, body }) => ({ url: `/users/${id}/role`, method: 'PUT', body }),
      invalidatesTags: ['Users'],
    }),
    toggleUserActive: builder.mutation<AdminUserDto, { id: string; body: ToggleUserActiveRequest }>({
      query: ({ id, body }) => ({ url: `/users/${id}/active`, method: 'PUT', body }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserActiveMutation,
} = usersApi;
