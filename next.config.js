/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: [
      "zunoqjiwhyzimcayolyu.supabase.co",  // Add your Supabase domain here
      "images.unsplash.com",  // Allow Unsplash images
    ],
  },
};

export default nextConfig;
