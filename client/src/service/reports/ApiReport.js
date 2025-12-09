import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiReport = createApi({
  reducerPath: "ApiReport",
  baseQuery: fetchBaseQuery({ baseUrl: `/api/report` }),
  tagTypes: ["Report"],
  endpoints: (builder) => ({
    getSummary: builder.query({
      query: () => `/summary`,
      providesTags: ["Report"],
    }),
    getReport: builder.query({
      query: () => `/sales-report`,
      providesTags: ["Report"],
    }),
    getUsers: builder.query({
      query: ({ page, search }) => ({
        url: `/users-report`,
        params: { page, search },
      }),
      providesTags: ["Report"],
    }),
  }),
});

export const { useGetSummaryQuery, useGetReportQuery, useGetUsersQuery } =
  ApiReport;
