import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desactivado hasta resolver hydration mismatch con styled-jsx (Next.js dependency)
  // reactCompiler: true,
};

export default nextConfig;
