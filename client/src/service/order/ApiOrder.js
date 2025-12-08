import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiCart } from "../cart/ApiCart";

export const ApiOrder = createApi({
  reducerPath: "ApiOrder",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/order" }),
  tagTypes: ["Order", "Couriers"],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: ({ page, limit, search }) => ({
        url: "/get-orders",
        method: "GET",
        params: { page, limit, search },
      }),
      providesTags: ["Order"],
    }),
    adminUpdateOrder: builder.mutation({
      query: ({ inv, status, shipping_number }) => ({
        url: "/admin-update-order",
        method: "POST",
        body: { inv, status, shipping_number },
      }),
      invalidatesTags: ["Order"],
    }),
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
      // Ubah parameter 'destination' menjadi 'address_id'
      query: ({ courier, address_id, weight }) => ({
        url: `/get-shipping-cost`,
        method: "GET",
        params: { courier, address_id, weight },
      }),
      keepUnusedDataFor: 0,
    }),
    createOrder: builder.mutation({
      query: (body) => ({
        url: "/create-order",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Order"],

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(ApiCart.util.invalidateTags(["Cart"]));
        } catch (error) {
          console.log(error);
        }
      },
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
  useGetOrdersQuery,
  useAdminUpdateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderStatusQuery,
  useGetCouriersQuery,
  useGetShippingCostQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
} = ApiOrder;
