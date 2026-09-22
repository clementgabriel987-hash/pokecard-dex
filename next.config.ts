/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.tcgdex.net' },
      { protocol: 'https', hostname: 'tcgplayer-cdn.tcgplayer.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.pokemontcg.io' } // Le domaine pour pokemontcg.io !
    ],
  },
};

export default nextConfig;