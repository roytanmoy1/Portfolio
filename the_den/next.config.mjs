/** @type {import('next').NextConfig} */
const nextConfig = {
	// ESLint is run explicitly with `npm run lint`; Next 15.1.2's build-time
	// wrapper cannot serialize the ESLint 9 flat-config parser.
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
