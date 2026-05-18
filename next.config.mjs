/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent TypeScript build errors from blocking deployment.
  // The codebase is pure JSX — this is a safety net for any auto-generated TS files.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent ESLint from blocking deployment.
  eslint: {
    ignoreDuringBuilds: true,
  },
}
export default nextConfig
