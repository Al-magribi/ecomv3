import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { socketAuth } from "./middleware/socketAuth.js";

// Router
import RouterConfig from "./router/config/routerConfig.js";
import RouterAuth from "./router/auth/RouterAuth.js";
import RouterProduct from "./router/product/RouterProduct.js";
import RouterCategory from "./router/product/RouterCategory.js";
import RouterAddress from "./router/address/RouterAddress.js";
import RouterOrder from "./router/order/RouterOrder.js";
import RouterCart from "./router/cart/RouterCart.js";
import RouterReport from "./router/report/RouterReport.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_MODE === "dev" ? process.env.LOCAL : process.env.DOMAIN,
  },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/config", RouterConfig);
app.use("/api/auth", RouterAuth);
app.use("/api/product", RouterProduct);
app.use("/api/category", RouterCategory);
app.use("/api/address", RouterAddress);
app.use("/api/order", RouterOrder);
app.use("/api/cart", RouterCart);
app.use("/api/report", RouterReport);

io.use(socketAuth);

io.on("connection", (socket) => {
  // Asumsi socket.user sudah terisi oleh middleware otentikasi
  if (socket.user && socket.user.role === "admin") {
    // 1. Gabungkan admin ke room 'admins'
    socket.join("admins");
    console.log(`Admin ${socket.user.id} joined the 'admins' room.`);
  } else if (socket.user) {
    // User biasa
    socket.join(socket.user.id.toString());
  } else {
    // User anonim
    console.log("Anonymous user connected.");
  }

  socket.on("disconnect", () => {
    const userId = socket.user ? socket.user.id : "Anonim";
    console.log(`User ${userId} disconnected`);
  });
});

export default server;
