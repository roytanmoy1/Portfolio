import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/features/theme/ThemeContext";
import { getPortfolioSection } from "@/server/portfolio";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tanmoyroy.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const home = await getPortfolioSection("home");
  const title = `${home.name} · ${home.title}`;
  const description = home.profile;

  return {
    metadataBase: new URL(siteUrl),
    alternates: { canonical: "/" },
    title: { default: title, template: `%s · ${home.name}` },
    description,
    keywords: [home.name, `${home.name} portfolio`, home.title],
    authors: [{ name: home.name }],
    creator: home.name,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_IN",
      url: siteUrl,
      siteName: `${home.name} Portfolio`,
      images: [{ url: home.photo, alt: `${home.name} profile photo` }],
    },
    twitter: { card: "summary", title, description, images: [home.photo] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    icons: { icon: "/favicon.ico" },
  };
}

export default async function RootLayout({ children }) {
  const home = await getPortfolioSection("home");
  const [addressLocality, addressCountry] = home.location.split(",").map((value) => value.trim());
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: home.name,
        url: siteUrl,
        jobTitle: home.title,
        description: home.profile,
        email: `mailto:${home.email}`,
        address: {
          "@type": "PostalAddress",
          addressLocality,
          ...(addressCountry ? { addressCountry } : {}),
        },
        ...(home.currentRole?.company
          ? { worksFor: { "@type": "Organization", name: home.currentRole.company } }
          : {}),
        sameAs: [home.linkedin, home.github, home.leetcode?.url].filter(Boolean),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: `${home.name} Portfolio`,
        description: home.profile,
        publisher: { "@id": `${siteUrl}/#person` },
      },
    ],
  };

  return (
		<html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
			<body className={`${geistSans.variable} ${instrumentSerif.variable}`}>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
