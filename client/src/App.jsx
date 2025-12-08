import { Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoadingScreen from "./components/loader/LoadingScreen";
import Home from "./module/home/Home";
import Signup from "./module/auth/Signup";
import Activation from "./module/auth/Activation";
import Signin from "./module/auth/Signin";
import { ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { isAuthenticated } from "./utils/authentication";
import { useLoadUserQuery } from "./service/auth/ApiAuth";
import { setUser } from "./service/auth/AuthSlice";
import Profile from "./module/user/profile/Profile";
import Order from "./module/user/order/Order";
import Cart from "./module/user/cart/Cart";
import Checkout from "./module/home/components/checkout/Checkout";
import Status from "./module/user/order/Status";
import Dashboard from "./module/admin/dashboard/Dashboard";
import Products from "./module/admin/products/Products";
import Orders from "./module/admin/orders/Orders";
import Reports from "./module/admin/reports/Reports";

const App = () => {
  const dispatch = useDispatch();

  const isSignin = isAuthenticated();
  const { user } = useSelector((state) => state.auth);

  const { data, isLoading } = useLoadUserQuery(undefined, {
    skip: !isSignin,
  });

  // useEffect(() => {
  //   // 1. Sinkronisasi Data ke Redux
  //   if (data && !user) {
  //     dispatch(setUser(data));
  //   }

  //   // 2. Ambil path saat ini
  //   const currentPath = window.location.pathname;

  //   // 3. Logika Redirect
  //   if (!isSignin) {
  //     // Jika tidak login dan bukan di halaman login, tendang ke login
  //     if (currentPath !== "/siginin") {
  //       window.location.href = "/signin";
  //     }
  //   } else if (isSignin && data) {
  //     // PENTING: Gunakan 'data' langsung dari API hook, jangan 'user' dari Redux
  //     // untuk menghindari delay (race condition) saat reload.

  //     // Jika user Login tapi masih di halaman "/" (Login Page), arahkan sesuai role
  //     if (currentPath === "/signin" || currentPath === "/signup") {
  //       if (data.role === "admin") {
  //         window.location.href = "/admin-dashboard";
  //       } else {
  //         window.location.href = "/";
  //       }
  //     }

  //     // OPTIONAL: Keamanan Tambahan
  //     // Jika user biasa mencoba akses admin dashboard secara manual
  //     if (currentPath.startsWith("/admin") && data.role !== "admin") {
  //       window.location.href = "/";
  //     } else if (currentPath.startsWith("/user") && data.role !== "user") {
  //       window.location.href = "/";
  //     }
  //   }
  // }, [data, user, isSignin]);

  if (isLoading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <ToastContainer position="top-left" />
        <Routes>
          <Route path="*" element={<Home />} />
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/activation/:code" element={<Activation />} />
          <Route path="/signin" element={<Signin />} />

          {/* Admin */}
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/admin-products" element={<Products />} />
          <Route path="/admin-orders" element={<Orders />} />
          <Route path="/admin-reports" element={<Reports />} />

          {/* User */}
          <Route path="/orders" element={<Order />} />
          <Route path="/order/status/:inv" element={<Status />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          {/* User & Admin */}
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
