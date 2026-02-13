import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBase = (env.VITE_API_BASE || "").trim();
  const isRemote = /^https?:\/\//i.test(apiBase);
  return {
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: true
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/src/pages/Admin") || id.includes("/src/components/admin/")) return "admin";
            if (id.includes("/src/components/") && id.toLowerCase().includes("modal")) return "modals";
            if (id.includes("/src/pages/Dashboard") || id.includes("/src/components/learner/") || id.includes("/src/components/teacher/")) return "dashboard";
            return undefined;
          }
        }
      }
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: isRemote ? apiBase.replace(/\/+$/, "") : `http://127.0.0.1:${env.VITE_API_PORT || 5000}`,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});

