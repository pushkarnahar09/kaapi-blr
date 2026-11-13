import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// React is loaded from cdnjs by the published page (artifact CSP allows it), so it is external here.
export default defineConfig({
  plugins: [react({ jsxRuntime: "classic" }), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    modulePreload: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: "src/main.tsx",
      external: ["react", "react-dom", "react-dom/client"],
      output: {
        format: "iife",
        entryFileNames: "app.js",
        assetFileNames: "app[extname]",
        globals: { react: "React", "react-dom": "ReactDOM", "react-dom/client": "ReactDOM" },
      },
    },
  },
});
