import { createSlice } from "@reduxjs/toolkit";
import { ApiAuth } from "./ApiAuth";
import { setSignIn, setSignOut } from "../../utils/authentication";

const UserSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isLoading: true, // Default true agar saat refresh kita menunggu loadUser selesai
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      setSignOut();
    },
  },
  extraReducers: (builder) => {
    // --- LOGIN HANDLER ---
    builder.addMatcher(
      ApiAuth.endpoints.DoSignin.matchFulfilled,
      (state, action) => {
        state.user = action.payload; // Set user dari respon login
        state.isLoading = false;
        setSignIn(); // Set localStorage
      }
    );

    // --- LOAD USER HANDLER (Inti permintaan Anda) ---
    builder.addMatcher(ApiAuth.endpoints.loadUser.matchPending, (state) => {
      state.isLoading = true;
    });

    // Ketika load user BERHASIL -> Set ke state.user
    builder.addMatcher(
      ApiAuth.endpoints.loadUser.matchFulfilled,
      (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        setSignIn(); // Pastikan tetap true di localStorage
      }
    );

    // Ketika load user GAGAL (misal token expired) -> Logout otomatis
    builder.addMatcher(ApiAuth.endpoints.loadUser.matchRejected, (state) => {
      state.user = null;
      state.isLoading = false;
    });

    // --- LOGOUT HANDLER ---
    builder.addMatcher(ApiAuth.endpoints.DoLogout.matchFulfilled, (state) => {
      state.user = null;
      state.isLoading = false;
      setSignOut();
    });
  },
});

export const { setUser, clearUser } = UserSlice.actions;
export default UserSlice.reducer;
