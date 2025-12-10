import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiConfig = createApi({
  reducerPath: "ApiConfig",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/config" }),
  tagTypes: ["Config", "Tables"],
  endpoints: (builder) => ({
    // Logo & favicon
    getStore: builder.query({
      query: () => "/get-store",
      providesTags: ["Config"],
    }),

    // Untuk User (Public/Safe Configs)
    getMidConfig: builder.query({
      query: () => "/get-mid-config",
      providesTags: ["Config"],
    }),

    // Untuk Admin (All Configs)
    getConfigs: builder.query({
      query: () => "/get-configs",
      providesTags: ["Config"],
    }),

    // Update Configs (Admin)
    saveConfigs: builder.mutation({
      query: (formData) => ({
        url: "/save-configs",
        method: "PUT",
        body: formData, // Mengirim FormData agar bisa handle file & text sekaligus
      }),
      invalidatesTags: ["Config"], // Auto-refresh data setelah update
    }),

    checkAddress: builder.query({
      query: () => "/check-address",
      providesTags: ["Config"],
    }),

    // Restore
    restoreDatabase: builder.mutation({
      query: (formData) => ({
        url: "/restore",
        method: "POST",
        body: formData,
      }),
    }),

    // Get List Tables
    getTables: builder.query({
      query: () => "/tables",
      providesTags: ["Tables"],
    }),

    // Reset Tables
    resetTables: builder.mutation({
      query: (selectedTables) => ({
        url: "/reset-tables",
        method: "POST",
        body: { tables: selectedTables },
      }),
      invalidatesTags: ["Tables"],
    }),
  }),
});

export const {
  useGetStoreQuery,
  useGetMidConfigQuery,
  useGetConfigsQuery,
  useSaveConfigsMutation,
  useCheckAddressQuery,
  useRestoreDatabaseMutation,
  useGetTablesQuery,
  useResetTablesMutation,
} = ApiConfig;
