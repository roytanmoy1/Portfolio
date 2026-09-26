import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./ThemeContext";
import { portfolioData } from "./data/portfolioData";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tanmoyroy.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: {
    default: "Tanmoy Kumar Roy · Consultant Full Stack Engineer",
    template: "%s · Tanmoy Kumar Roy",
  },
  description:
    "Portfolio of Tanmoy Kumar Roy, a Consultant and Lead Full Stack Engineer building enterprise web applications and Generative AI platforms.",
  keywords: [
    "Tanmoy Kumar Roy",
    "Tanmoy Roy portfolio",
    "Tanmoy Roy resume",
    "Tanmoy Roy full stack engineer",
    "Tanmoy Roy Deloitte",
    "Full Stack Engineer",
    "React",
    "Node.js",
    "Generative AI",
    "AWS",
    "Azure",
  ],
  authors: [{ name: "Tanmoy Kumar Roy" }],
  creator: "Tanmoy Kumar Roy",
  openGraph: {
    title: "Tanmoy Kumar Roy · Consultant Full Stack Engineer",
    description:
      "Enterprise web applications, real-time systems, and Generative AI platforms.",
    type: "website",
    locale: "en_IN",
    url: siteUrl,
     siteName: "Tanmoy Kumar Roy Portfolio",
    images: [{ url: "/unnamed.jpg", alt: "Tanmoy Kumar Roy standing in front of a waterfall" }],
  },
  twitter: {
    card: "summary",
    title: "Tanmoy Kumar Roy · Consultant Full Stack Engineer",
    description:
      "Enterprise web applications, real-time systems, and Generative AI platforms.",
    images: ["/unnamed.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: portfolioData.name,
      url: siteUrl,
      jobTitle: "Consultant · Full Stack Engineer",
      description: portfolioData.profile,
      email: `mailto:${portfolioData.email}`,
      address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
      worksFor: { "@type": "Organization", name: "Deloitte USI" },
      sameAs: [portfolioData.linkedin, portfolioData.github, portfolioData.leetcode.url],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Tanmoy Kumar Roy Portfolio",
      description: metadata.description,
      publisher: { "@id": `${siteUrl}/#person` },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
		<html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
			<body className={`${geistSans.variable} ${geistMono.variable}`}>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
