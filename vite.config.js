import { defineConfig } from "vite";
import vitePluginString from "vite-plugin-string";

export default defineConfig({
  base: "/",
  plugins: [
    vitePluginString({
      include: ["**/*.frag", "**/*.vert"],
    }),
  ],
});
