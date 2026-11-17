/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // The plain address /mcp is the OAuth endpoint for AI apps (POST, or the SSE probe). Browsers still get the docs page.
    return {
      beforeFiles: [
        { source: "/mcp", has: [{ type: "header", key: "content-type", value: "application/json.*" }], destination: "/api/mcp" },
        { source: "/mcp", has: [{ type: "header", key: "accept", value: ".*text/event-stream.*" }], destination: "/api/mcp" },
        { source: "/mcp", has: [{ type: "header", key: "access-control-request-method" }], destination: "/api/mcp" },
      ],
    };
  },
  async redirects() {
    // Pay links used to live inside the app. Keep old links working; the query string carries over.
    return [{ source: "/app/pay", destination: "/pay", permanent: false }];
  },
};

export default nextConfig;
