import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import authMiddleware from "./middleware/auth.middleware.js";
import githubRoutes from "./routes/github.routes.js";

const app = express();

app.use(
  cors({
    origin: "*"
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "OpenSourceMentor Backend is running",
  });
});

app.get("/api/test-auth", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});

export default app;