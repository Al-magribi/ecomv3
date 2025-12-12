import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiProduct } from "../product/ApiProduct";

export const ApiReview = createApi({
  reducerPath: "ApiReview",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/review" }),
  tagTypes: ["Review"],
  endpoints: (builder) => ({
    getReviews: builder.query({
      query: () => ({
        url: "/get-reviews",
        method: "GET",
      }),
      providesTags: ["Review"],
    }),
    SaveReview: builder.mutation({
      query: (body) => ({
        url: "/save-review",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Review"],
    }),
    replyReview: builder.mutation({
      query: ({ reviewId, reply }) => ({
        url: `/${reviewId}/reply`,
        method: "POST",
        body: { reply },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;

        dispatch(ApiProduct.util.invalidateTags(["Product"]));
      },
    }),
  }),
});

export const {
  useGetReviewsQuery,
  useSaveReviewMutation,
  useReplyReviewMutation,
} = ApiReview;
