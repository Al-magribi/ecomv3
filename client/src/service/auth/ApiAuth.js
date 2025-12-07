import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiAuth = createApi({
  reducerPath: "ApiAuth",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/auth" }),
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    DoSignup: builder.mutation({
      query: (body) => ({
        url: "/signup",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    activate: builder.mutation({
      query: (code) => ({
        url: "/activate",
        method: "POST",
        params: code,
      }),
      invalidatesTags: ["Auth"],
    }),
    DoSignin: builder.mutation({
      query: (body) => ({
        url: "/signin",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
    loadUser: builder.query({
      query: () => ({
        url: "/load-user",
        method: "GET",
      }),
      providesTags: ["Auth"],
    }),
    DoLogout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const {
  useDoSignupMutation,
  useActivateMutation,
  useDoSigninMutation,
  useLoadUserQuery,
  useDoLogoutMutation,
} = ApiAuth;
