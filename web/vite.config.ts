import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Treepl/",
  server: {
    proxy: {
      "/api/graphql": {
        target: "https://mainnet.intuition.sh",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/graphql/, "/v1/graphql"),
      },
    },
  },
});
