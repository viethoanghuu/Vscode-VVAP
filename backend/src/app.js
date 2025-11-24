import express from "express";
import cors from "cors";

import productsRouter from "./routes/products.js";
import adminRouter from "./routes/admin.js";

const app = express();

// lightweight request logger
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - started;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});
app.use(express.json());

const allowedOrigins =
  process.env.FRONTEND_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean) ||
  ["http://localhost:5173"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/products", productsRouter);
app.use("/api/admin", adminRouter);

// 404
app.use((req, res) => res.status(404).json({ success: false, error: "Not Found" }));

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res
    .status(err.status || 500)
    .json({ success: false, error: err.message || "Internal Server Error" });
});

export default app;
