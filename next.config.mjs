/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
    loader: 'custom',
    loaderFile: './src/utils/imageLoader.js',
  },
};

export default nextConfig;
