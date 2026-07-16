import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths - works on GitHub Pages regardless of repo name
  // (username.github.io/repo-name/) without needing to hardcode the repo name here.
  base: "./",
});
