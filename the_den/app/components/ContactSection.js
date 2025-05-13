import Image from "next/image";
import styles from "./Sections.module.css";
import { FaLinkedinIn, FaPhone, FaEnvelope, FaWhatsapp } from "react-icons/fa";
const ContactSection = ({ id }) => {
	return (
		<section id={id} className={styles.section}>
			<h2>My Contact</h2>
			<div className={styles.contactInfo}>
				<a
					href="mailto:roytanmoy.main@gmail.com"
					className={styles.contactItem}
				>
					<FaEnvelope className={styles.icon} />
					roytanmoy.main@gmail.com
				</a>
				<a
					href="https://linkedin.com/in/roytanmoy1"
					className={styles.contactItem}
					target="_blank"
					rel="noopener noreferrer"
				>
					<FaLinkedinIn className={styles.icon} />
					My LinkedIn
				</a>
				<a href="tel:7699475642" className={styles.contactItem}>
					<FaPhone className={styles.icon} />
					<FaWhatsapp className={styles.icon} />
					<span>7699475642</span>
					<FaPhone className={styles.icon} />
					<span>8250602917</span>
				</a>
			</div>
		</section>
	);
};

export default ContactSection;
// add a text box to send messages/ email to me
