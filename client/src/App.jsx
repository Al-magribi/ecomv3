import { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoadingScreen from "./components/loader/LoadingScreen";
import Home from "./module/home/Home";
import Signup from "./module/auth/Signup";
import Activation from "./module/auth/Activation";
import Signin from "./module/auth/Signin";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import { isAuthenticated } from "./utils/authentication";
import { useLoadUserQuery } from "./service/auth/ApiAuth";

// Import Halaman Lain (Admin & User)
import Profile from "./module/user/profile/Profile";
import Order from "./module/user/order/Order";
import Cart from "./module/user/cart/Cart";
import Checkout from "./module/home/components/checkout/Checkout";
import Status from "./module/user/order/Status";
import Dashboard from "./module/admin/dashboard/Dashboard";
import Products from "./module/admin/products/Products";
import Orders from "./module/admin/orders/Orders";
import Reports from "./module/admin/reports/Reports";

// IMPORT GUARDS
import ProtectedRoute from "./components/protection/ProtectedRoute";
import PublicRoute from "./components/protection/PublicRoute";
import Config from "./module/admin/config/Config";

const App = () => {
  const isSignin = isAuthenticated();

  // Memanggil query load user (Data akan masuk ke Redux via AuthSlice)
  // isLoading akan ditangani di dalam ProtectedRoute/PublicRoute via Redux State
  useLoadUserQuery(undefined, {
    skip: !isSignin,
  });

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <ToastContainer position='top-left' />
        <Routes>
          {/* --- PUBLIC ROUTES (Hanya untuk yang BELUM login) --- */}
          {/* Jika sudah login, akses ke sini akan diredirect ke "/" atau dashboard */}
          <Route element={<PublicRoute />}>
            <Route path='/signin' element={<Signin />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/activation/:code' element={<Activation />} />
          </Route>

          {/* --- ADMIN ROUTES (Hanya Role: admin) --- */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path='/admin-dashboard' element={<Dashboard />} />
            <Route path='/admin-products' element={<Products />} />
            <Route path='/admin-orders' element={<Orders />} />
            <Route path='/admin-reports' element={<Reports />} />
            <Route path='/admin-config' element={<Config />} />
          </Route>

          {/* --- USER ROUTES (Hanya Role: user) --- */}
          <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
            <Route path='/orders' element={<Order />} />
            <Route path='/order/status/:inv' element={<Status />} />
            <Route path='/cart' element={<Cart />} />
            <Route path='/checkout' element={<Checkout />} />
            {/* User juga bisa akses profile */}
            <Route path='/profile' element={<Profile />} />
          </Route>

          {/* --- OPEN ROUTES (Bisa diakses siapa saja atau logic khusus) --- */}
          <Route path='/' element={<Home />} />
          <Route path='*' element={<Home />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
