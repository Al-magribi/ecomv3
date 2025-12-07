import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiOrder = createApi({
  reducerPath: "ApiOrder",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/order" }),
  tagTypes: ["Order", "Couriers"],
  endpoints: (builder) => ({
    getMyOrders: builder.query({
      query: ({ page, limit, search }) => ({
        url: "/get-my-order",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["Order"],
    }),
    getOrderStatus: builder.query({
      query: (inv) => ({
        url: `/get-order-status`,
        method: "GET",
        params: { inv },
      }),
      providesTags: ["Order"],
    }),
    getCouriers: builder.query({
      query: () => ({
        url: "/get-couriers",
        method: "GET",
      }),
      providesTags: ["Couriers"],
    }),
    getShippingCost: builder.query({
      query: ({ courier, destination, weight }) => ({
        url: `/get-shipping-cost`,
        method: "GET",
        params: { courier, destination, weight },
      }),
      // Jangan cache terlalu lama agar real-time
      keepUnusedDataFor: 0,
    }),
    createOrder: builder.mutation({
      query: (body) => ({
        url: "/create-order",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ inv, status, method }) => ({
        url: "/update-order-status",
        method: "POST",
        body: { inv, status, method },
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useGetMyOrdersQuery,
  useGetOrderStatusQuery,
  useGetCouriersQuery,
  useGetShippingCostQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
} = ApiOrder;
