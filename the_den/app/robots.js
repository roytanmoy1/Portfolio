const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tanmoyroy.vercel.app";

export default function robots() {
	return {
		rules: [{ userAgent: "*", allow: "/" }],
		googleBot: { userAgent: "Googlebot", allow: "/", disallow: ["/api/"] },
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
