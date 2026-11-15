import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All state lives client-side (Zustand + localStorage), so Cache Components
  // and partial prefetching add nothing here and fight the hydration gate.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
