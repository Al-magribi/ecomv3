import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiProduct = createApi({
  reducerPath: "ApiProduct",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/product" }),
  tagTypes: ["Product"],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ page, limit, search, categoryId }) => ({
        url: "/get-products",
        method: "GET",
        params: { page, limit, search, categoryId },
      }),
      providesTags: ["Product"],
    }),
    getProduct: builder.query({
      query: (id) => ({
        url: `/get-product`,
        method: "GET",
        params: { id },
      }),
      providesTags: ["Product"],
    }),
    saveProduct: builder.mutation({
      query: (data) => ({
        url: "/save-product",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: "/delete-product",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useSaveProductMutation,
  useDeleteProductMutation,
} = ApiProduct;
