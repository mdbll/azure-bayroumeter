import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "https://func-azmeter-api-e8bxdwb8f3d0bhhq.francecentral-01.azurewebsites.net",
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
