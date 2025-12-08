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
  }),
});

export const { useGetSummaryQuery } = ApiReport;
