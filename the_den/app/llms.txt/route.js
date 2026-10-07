import { getPortfolioSection } from "@/server/portfolio";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const [home, experience, skills, about, lab] = await Promise.all([
			getPortfolioSection("home"),
			getPortfolioSection("experience"),
			getPortfolioSection("skills"),
			getPortfolioSection("about"),
			getPortfolioSection("lab"),
		]);
		const lines = [
			`# ${home.name}`,
			"",
			`${home.name} is a ${home.title} based in ${home.location}. ${home.profile}`,
			"",
			"## Contact",
			`- Email: ${home.email}`,
			`- LinkedIn: ${home.linkedin}`,
			`- GitHub: ${home.github}`,
			`- Resume: ${home.resume}`,
			"",
			"## Experience",
		];
		for (const role of experience) {
			lines.push("", `### ${role.role} at ${role.company} (${role.dates})`, role.summary);
			for (const highlight of role.highlights) lines.push(`- ${highlight}`);
			for (const project of role.projects) {
				lines.push("", `#### ${project.title} (${project.category})`, project.description);
				for (const highlight of project.highlights) lines.push(`- ${highlight}`);
			}
		}
		lines.push("", "## Skills");
		for (const group of skills) lines.push(`- ${group.category}: ${group.items.map((item) => item.name).join(", ")}`);
		lines.push("", "## Profile");
		for (const point of about.aboutPoints) lines.push(`- ${point.label}: ${point.text}`);
		lines.push(`- Education: ${about.education.degree}, ${about.education.institution} (${about.education.years})`);
		lines.push(`- Certifications: ${about.certifications.join(", ")}`);
		lines.push("", "## Personal projects");
		for (const project of lab.personalProjects) lines.push(`- ${project.title}: ${project.description} ${project.repoUrl}`);
		lines.push("", `## Canonical source`, process.env.NEXT_PUBLIC_SITE_URL || "https://tanmoyroy.vercel.app/");

		return new Response(`${lines.join("\n")}\n`, {
			headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
		});
	} catch {
		return new Response("Portfolio information is temporarily unavailable.\n", {
			status: 503,
			headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
		});
	}
}
