import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react-swc";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { lingui } from "@lingui/vite-plugin";

const VENDOR_CHUNKS: Array<{ chunk: string; test: (id: string) => boolean }> = [
  {
    chunk: "vendor-antd",
    test: (id) =>
      id.includes("node_modules/antd") || id.includes("node_modules/rc-"),
  },
  {
    chunk: "vendor-tanstack",
    test: (id) => id.includes("node_modules/@tanstack/"),
  },
  {
    chunk: "vendor-ui",
    test: (id) => id.includes("node_modules/lucide-react"),
  },
  {
    chunk: "vendor-i18n",
    test: (id) =>
      id.includes("node_modules/@lingui/") || id.includes("/@lingui/"),
  },
];

function manualChunkForId(id: string): string | undefined {
  for (const { chunk, test } of VENDOR_CHUNKS) {
    if (test(id)) return chunk;
  }
  return undefined;
}

export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react({
      plugins: [["@lingui/swc-plugin", {}]],
    }),
    lingui(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => manualChunkForId(id),
      },
    },
    chunkSizeWarningLimit: 1024,
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
});
