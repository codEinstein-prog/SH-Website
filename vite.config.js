
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { bookingApiPlugin } from "./scripts/booking-api-dev.js";

export default defineConfig(({ mode }) => ({
  plugins: [react(), bookingApiPlugin({ ...loadEnv(mode, process.cwd(), ""), ...process.env })],

  build: {
    outDir: "dist",
    sourcemap: true,
  },

  server: {
    port: 5173,
    open: true,
  },
}));
