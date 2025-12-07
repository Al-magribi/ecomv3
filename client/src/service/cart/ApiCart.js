import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ApiCart = createApi({
  reducerPath: "ApiCart",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/cart" }),
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    // GET: Ambil data keranjang
    getCart: builder.query({
      query: () => ({
        url: "/get-my-cart",
        method: "GET",
      }),
      providesTags: ["Cart"],
    }),

    // POST: Tambah ke keranjang
    addToCart: builder.mutation({
      query: (data) => ({
        url: "/add-to-cart",
        method: "POST",
        body: data, // { product_id, product_variant_id, quantity }
      }),
      invalidatesTags: ["Cart"],
    }),

    // PUT: Update quantity
    updateCartQty: builder.mutation({
      query: ({ cart_id, quantity }) => ({
        url: "/update-qty",
        method: "PUT",
        body: { cart_id, quantity },
      }),
      invalidatesTags: ["Cart"],
    }),

    // DELETE: Hapus item
    deleteCartItem: builder.mutation({
      query: (id) => ({
        url: `/delete-item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartQtyMutation,
  useDeleteCartItemMutation,
} = ApiCart;
