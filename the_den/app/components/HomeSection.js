import styles from "./Sections.module.css";
import {
	FaMapMarkerAlt,
	FaPhone,
	FaEnvelope,
	FaHeart,
	FaConnectdevelop,
} from "react-icons/fa";
import AboutSection from "./AboutSection";
import { useState, useEffect } from "react";

const HomeSection = ({ id }) => {
	const [showMore, setShowMore] = useState(false);

	const myData = {
		about: `I'm Tanmoy Roy - An ordinary guy trying to master Javascript `,
		role: "Full Stack Developer at Accenture India",
		location: "Bengaluru, India",
		phone: "7699475642",
		email: "roytanmoy.main@gmail.com",
	};
	useEffect(() => {
		if (showMore) {
			const aboutSection = document.getElementById("about");
			if (aboutSection) {
				aboutSection.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		}
		setShowMore(false);
	}, [showMore]);

	const handleDownloadCV = () => {
		const link = document.createElement("a");
		link.href = "/Tanmoy_Kumar_Roy-Resume.pdf";
		link.setAttribute("download", "Tanmoy_Kumar_Roy-Resume.pdf");
		document.body.appendChild(link);
		link.click();
		link.parentNode.removeChild(link);
	};

	return (
		<section id={id} className={styles.section}>
			<div className={styles.content}>
				<h2>Hello There</h2>
				<p>
					{myData.about}
					<FaHeart className={styles.icon} />
				</p>
				<div className={styles.ctas}>
					<button className={styles.primary} onClick={handleDownloadCV}>
						Download CV
					</button>
					<button
						className={styles.secondary}
						onClick={() => setShowMore(!showMore)}
					>
						Know More !!
					</button>
				</div>
				<div className={styles.contactInfo}>
					<a
						target="_blank"
						rel="noopener noreferrer"
						className={styles.contactItem}
					>
						<FaConnectdevelop className={styles.icon} />
						<span>{myData.role}</span>
					</a>
					<a
						target="_blank"
						rel="noopener noreferrer"
						className={styles.contactItem}
					>
						<FaMapMarkerAlt className={styles.icon} />
						<span>{myData.location}</span>
					</a>
					<a href="tel:7699475642" className={styles.contactItem}>
						<FaPhone className={styles.icon} />
						<span>{myData.phone}</span>
					</a>
					<a
						href="mailto:roytanmoy.main@gmail.com"
						className={styles.contactItem}
					>
						<FaEnvelope className={styles.icon} />
						<span>{myData.email}</span>
					</a>
				</div>
			</div>
		</section>
	);
};

export default HomeSection;
