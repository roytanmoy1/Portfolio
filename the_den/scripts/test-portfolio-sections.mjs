import assert from "node:assert/strict";
import { getPortfolioSection } from "../server/portfolio.js";

const [home, experience, skills, about, lab] = await Promise.all([
	getPortfolioSection("home"),
	getPortfolioSection("experience"),
	getPortfolioSection("skills"),
	getPortfolioSection("about"),
	getPortfolioSection("lab"),
]);

assert.equal(home.name, "Tanmoy Kumar Roy");
assert.equal(home.currentRole.company, "Deloitte USI");
assert.equal(experience.length, 3);
assert.ok(experience.every((role) => Array.isArray(role.stack) && Array.isArray(role.highlights)));
assert.equal(experience.flatMap((role) => role.projects).length, 5);
assert.ok(experience.flatMap((role) => role.projects).some((project) => /central operations platform/i.test(project.description)));
assert.equal(skills.length, 4);
assert.ok(skills.every((group) => group.items.length > 0));
assert.ok(skills.find((group) => group.category === "Backend & APIs").items.some((item) => item.name === "Python · FastAPI"));
assert.deepEqual(skills.find((group) => group.category === "Cloud & DevOps").items.map((item) => item.name), ["AWS", "Azure"]);
assert.ok(!skills.find((group) => group.category === "Data, AI & Quality").items.some((item) => item.name === "Power BI · MicroStrategy"));
assert.equal(about.aboutPoints.length, 4);
assert.equal(about.certifications.length, 4);
assert.equal(lab.personalProjects.length, 4);

console.log("Portfolio section queries verified.", {
	roles: experience.length,
	projects: experience.flatMap((role) => role.projects).length,
	skillGroups: skills.length,
	personalProjects: lab.personalProjects.length,
});
