import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  // headers(), redirects() and compress are handled by .htaccess in static export mode
};

export default nextConfig;
