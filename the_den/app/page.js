import PortfolioPage from "@/features/portfolio/PortfolioPage";
import { getPortfolioSection } from "@/server/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	const initialHome = await getPortfolioSection("home");
	return <PortfolioPage initialHome={initialHome} />;
}
