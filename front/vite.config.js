import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import glsl from "vite-plugin-glsl";
import path from "path";

// https://vite.dev/config/
export default defineConfig((mode) => {
  const envDir = path.resolve(__dirname, "../");
  const env = loadEnv(mode, envDir, "");

  console.log(env);

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
          @use "@/styles/vars" as vars;
        `,
        },
      },
    },
    plugins: [react(), glsl()],
    define: {
      APP_CLIENT_ID: JSON.stringify(env.TWITCH_CLIENT_ID),
      TWITCH_OAUTH_REDIRECT_URL: JSON.stringify(env.TWITCH_OAUTH_REDIRECT_URL),
    },
  };
});
