import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiAddress = createApi({
  reducerPath: "ApiAddress",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/address" }),
  tagTypes: ["Address"],
  endpoints: (builder) => ({
    getProvinces: builder.query({
      query: () => "/provinces",
      providesTags: ["Address"],
    }),
    getRegencies: builder.query({
      query: (province_id) => ({
        url: "/regencies",
        params: { province_id },
      }),
      providesTags: ["Address"],
    }),
    getDistricts: builder.query({
      query: (regency_id) => ({
        url: "/districts",
        params: { regency_id },
      }),
      providesTags: ["Address"],
    }),
    getVillages: builder.query({
      query: (district_id) => ({
        url: "/villages",
        params: { district_id },
      }),
      providesTags: ["Address"],
    }),
    saveAddress: builder.mutation({
      query: (body) => ({
        url: "/save-address",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Address"],
    }),
    deleteAddress: builder.mutation({
      query: (id) => ({
        url: "/delete-address",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: ["Address"],
    }),
  }),
});

export const {
  useGetProvincesQuery,
  useGetRegenciesQuery,
  useGetDistrictsQuery,
  useGetVillagesQuery,
  useSaveAddressMutation,
  useDeleteAddressMutation,
} = ApiAddress;
