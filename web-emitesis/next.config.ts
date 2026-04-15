import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@react-pdf-viewer/core",
    "@react-pdf-viewer/default-layout",
    "@react-pdf-viewer/highlight",
    "@react-pdf-viewer/attachment",
    "@react-pdf-viewer/bookmark",
    "@react-pdf-viewer/thumbnail",
    "@react-pdf-viewer/toolbar",
  ],
  // Desactivado hasta resolver hydration mismatch con styled-jsx (Next.js dependency)
  // reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
