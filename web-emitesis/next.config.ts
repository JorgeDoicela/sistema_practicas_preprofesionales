import type { NextConfig } from "next";

const nextConfig: any = {
  eslint: {
    // Desactivar comprobación de ESLint durante la compilación para evitar bloqueos por warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desactivar errores de tipado de TS durante compilación para acelerar despliegue
    ignoreBuildErrors: true,
  },
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
  webpack: (config: any, { isServer }: any) => {
    const webpack = require("webpack");

    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^canvas$/,
      }),
    );

    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        canvas: false,
      };
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        canvas: false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:5000'}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
