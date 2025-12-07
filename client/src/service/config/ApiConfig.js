import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiConfig = createApi({
  reducerPath: "ApiConfig",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/config" }),
  tagTypes: ["config"],
  endpoints: (builder) => ({
    getMidConfig: builder.query({
      query: () => "/get-mid-config",
      providesTags: ["config"],
    }),
  }),
});

export const { useGetMidConfigQuery } = ApiConfig;
