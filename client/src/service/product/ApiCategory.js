import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiCategory = createApi({
  reducerPath: "ApiCategory",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/category" }),
  tagTypes: ["Categories"],
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: ({ page, limit, search, categoryId }) => ({
        url: "/get-categories",
        method: "GET",
        params: { page, limit, search, categoryId },
      }),
      providesTags: ["Categories"],
    }),
    getCategory: builder.query({
      query: (id) => ({
        url: `/get-category`,
        method: "GET",
        params: { id },
      }),
      providesTags: ["Categories"],
    }),
    saveCategory: builder.mutation({
      query: (data) => ({
        url: "/save-category",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: "/delete-category",
        method: "DELETE",
        params: { id },
      }),
      invalidatesTags: ["Categories"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useSaveCategoryMutation,
  useDeleteCategoryMutation,
} = ApiCategory;
