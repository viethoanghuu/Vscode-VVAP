import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || true }));

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4002;
app.listen(port, () => console.log(`API up on :${port}`));
