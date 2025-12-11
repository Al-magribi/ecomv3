import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./auth/AuthSlice";
import { ApiAuth } from "./auth/ApiAuth";
import { ApiConfig } from "./config/ApiConfig";
import { ApiProduct } from "./product/ApiProduct";
import { ApiCategory } from "./product/ApiCategory";
import { ApiAddress } from "./address/ApiAddress";
import { ApiOrder } from "./order/ApiOrder";
import { ApiReview } from "./order/ApiReview";
import { ApiCart } from "./cart/ApiCart";
import { ApiReport } from "./reports/ApiReport";

const store = configureStore({
  reducer: {
    auth: authReducer,
    [ApiAuth.reducerPath]: ApiAuth.reducer,
    [ApiConfig.reducerPath]: ApiConfig.reducer,
    [ApiProduct.reducerPath]: ApiProduct.reducer,
    [ApiCategory.reducerPath]: ApiCategory.reducer,
    [ApiAddress.reducerPath]: ApiAddress.reducer,
    [ApiOrder.reducerPath]: ApiOrder.reducer,
    [ApiReview.reducerPath]: ApiReview.reducer,
    [ApiCart.reducerPath]: ApiCart.reducer,
    [ApiReport.reducerPath]: ApiReport.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([
      ApiAuth.middleware,
      ApiConfig.middleware,
      ApiProduct.middleware,
      ApiCategory.middleware,
      ApiAddress.middleware,
      ApiOrder.middleware,
      ApiReview.middleware,
      ApiCart.middleware,
      ApiReport.middleware,
    ]),
  devTools: true,
});

export default store;
