/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Pay links used to live inside the app. Keep old links working; the query string carries over.
    return [{ source: "/app/pay", destination: "/pay", permanent: false }];
  },
};

export default nextConfig;
