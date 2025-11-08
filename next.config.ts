import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
    images: {
     remotePatterns: [
       { protocol: 'https', hostname: 'drive.google.com' },
       { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
       { protocol: 'https', hostname: 'travel.mthai.com' },
     ],
   },
};
 
const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');
export default withNextIntl(nextConfig);