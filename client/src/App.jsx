import { Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoadingScreen from "./components/loader/LoadingScreen";
import Home from "./module/home/Home";
import Signup from "./module/auth/Signup";
import Activation from "./module/auth/Activation";
import Signin from "./module/auth/Signin";
import { ToastContainer } from "react-toastify";
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
import Users from "./module/admin/users/Users";
import { useGetStoreQuery } from "./service/config/ApiConfig";
import Database from "./module/admin/database/Database";

const App = () => {
  const { data: store, isLoading } = useGetStoreQuery();

  const isSignin = isAuthenticated();

  // Memanggil query load user (Data akan masuk ke Redux via AuthSlice)
  // isLoading akan ditangani di dalam ProtectedRoute/PublicRoute via Redux State
  useLoadUserQuery(undefined, {
    skip: !isSignin,
  });

  // ============================================================
  // LOGIC GANTI FAVICON & TITLE
  // ============================================================
  useEffect(() => {
    // Pastikan data store tersedia
    if (store) {
      // 1. GANT FAVICON
      if (store.favicon) {
        let link = document.querySelector("link[rel~='icon']");

        // Jika elemen <link rel="icon"> belum ada, buat baru
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.getElementsByTagName("head")[0].appendChild(link);
        }

        // Update URL icon
        link.href = store.favicon;
      }

      // 2. GANTI TITLE (Nama Tab Browser)
      if (store.name) {
        document.title = store.name;
        // Atau jika ingin format khusus, misal: "Toserba - Nama Toko"
        // document.title = `Toserba - ${store.name}`;
      }
    }
  }, [store]); // Jalankan setiap kali data 'store' berubah
  // ============================================================

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <ToastContainer position='top-left' />
        <Routes>
          {/* --- PUBLIC ROUTES (Hanya untuk yang BELUM login) --- */}
          {/* Jika sudah login, akses ke sini akan diredirect ke "/" atau dashboard */}
          <Route element={<PublicRoute />}>
            <Route
              path='/signin'
              element={<Signin logo={store?.logo} isLoad={isLoading} />}
            />
            <Route
              path='/signup'
              element={<Signup logo={store?.logo} isLoad={isLoading} />}
            />
            <Route path='/activation/:code' element={<Activation />} />
          </Route>

          {/* --- ADMIN ROUTES (Hanya Role: admin) --- */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path='/admin-dashboard' element={<Dashboard />} />
            <Route path='/admin-users' element={<Users />} />
            <Route path='/admin-products' element={<Products />} />
            <Route path='/admin-orders' element={<Orders />} />
            <Route path='/admin-reports' element={<Reports />} />
            <Route path='/admin-config' element={<Config />} />
            <Route path='/admin-database' element={<Database />} />
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
