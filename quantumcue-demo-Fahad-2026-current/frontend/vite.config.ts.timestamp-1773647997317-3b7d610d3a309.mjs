// vite.config.ts
import { defineConfig } from "file:///app/node_modules/vite/dist/node/index.js";
import react from "file:///app/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/app";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  optimizeDeps: {
    include: ["recharts"]
  },
  server: {
    port: 3e3,
    host: true,
    // Allow access via localhost in normal dev, plus your public domain when reverse-proxied (e.g. via Caddy).
    // If this is too restrictive for your environment, set VITE_ALLOWED_HOSTS="host1,host2,..."
    allowedHosts: process.env.VITE_ALLOWED_HOSTS ? process.env.VITE_ALLOWED_HOSTS.split(",").map((h) => h.trim()).filter(Boolean) : [".quantumcue.app", "localhost", "127.0.0.1", "0.0.0.0"],
    strictPort: true,
    proxy: {
      "/api": {
        // Frontend typically runs in Docker in this repo; reach backend via service DNS.
        // If running outside Docker, you can override via VITE_DEV_PROXY_TARGET.
        target: process.env.VITE_DEV_PROXY_TARGET || "http://backend:8000",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsncmVjaGFydHMnXSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBob3N0OiB0cnVlLFxuICAgIC8vIEFsbG93IGFjY2VzcyB2aWEgbG9jYWxob3N0IGluIG5vcm1hbCBkZXYsIHBsdXMgeW91ciBwdWJsaWMgZG9tYWluIHdoZW4gcmV2ZXJzZS1wcm94aWVkIChlLmcuIHZpYSBDYWRkeSkuXG4gICAgLy8gSWYgdGhpcyBpcyB0b28gcmVzdHJpY3RpdmUgZm9yIHlvdXIgZW52aXJvbm1lbnQsIHNldCBWSVRFX0FMTE9XRURfSE9TVFM9XCJob3N0MSxob3N0MiwuLi5cIlxuICAgIGFsbG93ZWRIb3N0czogcHJvY2Vzcy5lbnYuVklURV9BTExPV0VEX0hPU1RTXG4gICAgICA/IHByb2Nlc3MuZW52LlZJVEVfQUxMT1dFRF9IT1NUUy5zcGxpdCgnLCcpLm1hcCgoaCkgPT4gaC50cmltKCkpLmZpbHRlcihCb29sZWFuKVxuICAgICAgOiBbJy5xdWFudHVtY3VlLmFwcCcsICdsb2NhbGhvc3QnLCAnMTI3LjAuMC4xJywgJzAuMC4wLjAnXSxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgLy8gRnJvbnRlbmQgdHlwaWNhbGx5IHJ1bnMgaW4gRG9ja2VyIGluIHRoaXMgcmVwbzsgcmVhY2ggYmFja2VuZCB2aWEgc2VydmljZSBETlMuXG4gICAgICAgIC8vIElmIHJ1bm5pbmcgb3V0c2lkZSBEb2NrZXIsIHlvdSBjYW4gb3ZlcnJpZGUgdmlhIFZJVEVfREVWX1BST1hZX1RBUkdFVC5cbiAgICAgICAgdGFyZ2V0OiBwcm9jZXNzLmVudi5WSVRFX0RFVl9QUk9YWV9UQVJHRVQgfHwgJ2h0dHA6Ly9iYWNrZW5kOjgwMDAnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThMLFNBQVMsb0JBQW9CO0FBQzNOLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxVQUFVO0FBQUEsRUFDdEI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBO0FBQUEsSUFHTixjQUFjLFFBQVEsSUFBSSxxQkFDdEIsUUFBUSxJQUFJLG1CQUFtQixNQUFNLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxFQUFFLE9BQU8sT0FBTyxJQUM3RSxDQUFDLG1CQUFtQixhQUFhLGFBQWEsU0FBUztBQUFBLElBQzNELFlBQVk7QUFBQSxJQUNaLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQTtBQUFBO0FBQUEsUUFHTixRQUFRLFFBQVEsSUFBSSx5QkFBeUI7QUFBQSxRQUM3QyxjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLEVBQ2I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
