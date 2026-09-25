"use client";

import { useState } from "react";
import { FaEnvelope, FaGithub, FaLinkedinIn, FaPhone } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import styles from "./Sections.module.css";
import { portfolioData } from "../data/portfolioData";

const initialForm = { name: "", email: "", message: "", company: "" };

const openEmailFallback = (form) => {
	const subject = encodeURIComponent(`Portfolio enquiry from ${form.name}`);
	const body = encodeURIComponent(
		`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
	);

	window.location.href = `mailto:${portfolioData.email}?subject=${subject}&body=${body}`;
};

const ContactSection = ({ id }) => {
	const [form, setForm] = useState(initialForm);
	const [status, setStatus] = useState({ type: "", message: "" });
	const [loading, setLoading] = useState(false);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((current) => ({ ...current, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setStatus({ type: "", message: "" });

		const name = form.name.trim();
		const email = form.email.trim().toLowerCase();
		const message = form.message.trim();
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		if (name.length < 2 || name.length > 80 || email.length > 254 || !emailPattern.test(email) || message.length < 10 || message.length > 4000) {
			setStatus({
				type: "error",
				message: "Please check your name, email, and message before sending.",
			});
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({
					name,
					email,
					message,
					company: form.company,
				}),
			});
			const result = await response.json().catch(() => ({}));

			if (response.status === 503) {
				openEmailFallback({ name, email, message });
				setStatus({
					type: "success",
					message: "Opening your email app with the message ready to send.",
				});
				setLoading(false);
				return;
			}

			if (!response.ok) {
				throw new Error(result.error || "The message could not be sent.");
			}

			setForm(initialForm);
			setStatus({ type: "success", message: "Thanks — your message has been sent." });
		} catch (error) {
			setStatus({
				type: "error",
				message: `${error.message} You can email me directly instead.`,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<section id={id} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.contactLayout}>
					<div className={styles.contactCopy}>
						<p className={styles.sectionEyebrow}>Let&apos;s build something useful</p>
						<h2 className={styles.contactTitle}>Have a hard problem?</h2>
						<p className={styles.contactDescription}>
							Tell me what you&apos;re working on, what is getting in the way, and what
							great looks like. I&apos;ll get back to you with a considered response.
						</p>

						<div className={styles.contactLinks}>
							<a className={styles.contactLink} href={`mailto:${portfolioData.email}`}>
								<FaEnvelope aria-hidden="true" /> {portfolioData.email}
							</a>
							<a className={styles.contactLink} href={portfolioData.linkedin} target="_blank" rel="noreferrer">
								<FaLinkedinIn aria-hidden="true" /> LinkedIn profile
						</a>
							<a className={styles.contactLink} href={portfolioData.github} target="_blank" rel="noreferrer">
								<FaGithub aria-hidden="true" /> GitHub profile
						</a>
							<a className={styles.contactLink} href={portfolioData.leetcode.url} target="_blank" rel="noreferrer">
								<SiLeetcode aria-hidden="true" /> LeetCode profile
							</a>
							<a className={styles.contactLink} href={`tel:${portfolioData.phones[0].replace(/\D/g, "")}`}>
								<FaPhone aria-hidden="true" /> {portfolioData.phones.join("  ·  ")}
							</a>
						</div>
					</div>

					<form className={styles.contactForm} onSubmit={handleSubmit}>
						<div className={styles.formHeader}>
							<h3 className={styles.formTitle}>Send a note</h3>
							<p className={styles.formSubtitle}>
								No account needed. Your email app is the fallback if no form service is configured.
							</p>
						</div>

						<div className={styles.fieldGrid}>
							<div className={styles.honeypot} aria-hidden="true">
								<label htmlFor="contact-company">Company</label>
								<input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" value={form.company} onChange={handleChange} />
							</div>
							<div className={styles.field}>
								<label htmlFor="contact-name">Name</label>
								<input id="contact-name" name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange} placeholder="Your name" minLength={2} maxLength={80} required />
							</div>
							<div className={styles.field}>
								<label htmlFor="contact-email">Email</label>
								<input id="contact-email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} placeholder="you@example.com" maxLength={254} required />
							</div>
							<div className={`${styles.field} ${styles.fieldFull}`}>
								<label htmlFor="contact-message">Message</label>
								<textarea id="contact-message" name="message" value={form.message} onChange={handleChange} placeholder="What would you like to build?" rows={6} minLength={10} maxLength={4000} required />
							</div>
						</div>

						<div className={styles.formFooter}>
							<p className={styles.formNote}>I usually reply within 1–2 business days.</p>
							<button className={styles.submitButton} type="submit" disabled={loading}>
								{loading ? "Preparing…" : "Send message ↗"}
							</button>
						</div>
						{status.message && (
							<p className={`${styles.status} ${status.type === "success" ? styles.success : styles.error}`} role="status" aria-live="polite">
								{status.message}
							</p>
						)}
					</form>
				</div>
			</div>
		</section>
	);
};

export default ContactSection;
