"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	FaArrowUp,
	FaEnvelope,
	FaMicrophone,
	FaPaperclip,
	FaRobot,
	FaTimes,
	FaVolumeMute,
	FaVolumeUp,
} from "react-icons/fa";
import { useAssistant } from "../context/AssistantContext";
import { portfolioData } from "../../portfolio/data/portfolioData";
import { CONTACT_LIMITS, getContactFieldValidationError, normalizeContactFields } from "../../contact/contactValidation";
import styles from "./ChatPanel.module.css";

const starterSuggestions = [
	"What is Tanmoy's current role?",
	"Which projects show AI experience?",
	"Summarize his cloud skills.",
	"Send an email to Tanmoy",
];
const contactIntentPattern = /\b(?:send|write)\b.{0,50}\b(?:message|email|note)\b|\bemail\s+(?:tanmoy|him)\b|\bcontact\s+tanmoy\b/i;
const contactPrompts = {
	name: "What name should I include in the email?",
	email: "What email address should Tanmoy reply to?",
	message: "What would you like the email to say?",
};

const getSuggestedQuestions = (messages, isTyping) => {
	const lastMessage = messages.at(-1);
	if (!lastMessage) return starterSuggestions;
	if (isTyping || lastMessage.role !== "assistant") return [];

	const userQuestions = messages.filter((message) => message.role === "user");
	const lastQuestion = userQuestions.at(-1);
	if (!lastQuestion) return starterSuggestions;
	const topicQuestion = /^tell me more\b/i.test(lastQuestion.text) && userQuestions.length > 1
		? userQuestions.at(-2)
		: lastQuestion;
	let questions;
	if (topicQuestion.attachments?.length) {
		questions = ["Tell me more", "How does this relate to Tanmoy's experience?"];
	} else if (/\b(?:role|job|deloitte|work)\b/i.test(topicQuestion.text)) {
		questions = ["Which projects show his recent impact?", "What skills support this role?"];
	} else if (/\bprojects?\b/i.test(topicQuestion.text)) {
		questions = ["What skills do those projects demonstrate?", "Which project best shows leadership?"];
	} else if (/\b(?:skills?|cloud|aws|azure|frontend|backend)\b/i.test(topicQuestion.text)) {
		questions = ["Which projects use those skills?", "What is Tanmoy's current role?"];
	} else if (/\b(?:contact|email|reach|call)\b/i.test(topicQuestion.text)) {
		questions = ["Send a message to Tanmoy", "What is Tanmoy's current role?"];
	} else {
		questions = ["Tell me more", "Which projects show AI experience?"];
	}
	return questions.filter((question) => question.toLowerCase() !== lastQuestion.text.toLowerCase());
};

const createId = () =>
	typeof crypto !== "undefined" && crypto.randomUUID
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const connectionLabels = {
	connecting: "Connecting",
	ready: "Online",
	offline: "Reconnecting",
	unavailable: "Unavailable",
	paused: "Paused while inactive",
};
const MAX_RECONNECT_ATTEMPTS = 4;
const INACTIVITY_MS = 2 * 60 * 1000;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const formatFileSize = (bytes) => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const initialContactForm = { name: "", email: "", message: "" };

const getChatCredentials = async () => {
	const tokenResponse = await fetch("/api/chat/token", {
		method: "POST",
		headers: { Accept: "application/json" },
		cache: "no-store",
	});
	const tokenPayload = await tokenResponse.json().catch(() => ({}));
	if (!tokenResponse.ok || !tokenPayload.token || !tokenPayload.websocketUrl) {
		throw new Error("Assistant connection is unavailable.");
	}
	return tokenPayload;
};

const ChatPanel = () => {
	const { isAssistantOpen, closeAssistant } = useAssistant();
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [connectionState, setConnectionState] = useState("connecting");
	const [attachments, setAttachments] = useState([]);
	const [pendingFiles, setPendingFiles] = useState([]);
	const [draftName, setDraftName] = useState("");
	const [isDraggingFiles, setIsDraggingFiles] = useState(false);
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState("");
	const [isListening, setIsListening] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [isUserActive, setIsUserActive] = useState(true);
	const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(false);
	const [visitorName, setVisitorName] = useState("");
	const [nameError, setNameError] = useState("");
	const [contactFlowStep, setContactFlowStep] = useState(null);
	const [contactForm, setContactForm] = useState(initialContactForm);
	const [isContactSubmitting, setIsContactSubmitting] = useState(false);
	const socketRef = useRef(null);
	const pendingRequestRef = useRef(null);
	const fileInputRef = useRef(null);
	const recognitionRef = useRef(null);
	const voiceRepliesRef = useRef(false);
	const messagesEndRef = useRef(null);
	const nameInputRef = useRef(null);
	const inputRef = useRef(null);
	const uploadDialogRef = useRef(null);
	const uploadTriggerRef = useRef(null);

	const closeUploadDialog = () => {
		setIsUploadDialogOpen(false);
		setPendingFiles([]);
		setUploadError("");
		window.requestAnimationFrame(() => uploadTriggerRef.current?.focus());
	};

	const startContactFlow = (request = "I'd like to send Tanmoy an email.") => {
		setContactForm(initialContactForm);
		setContactFlowStep("name");
		setMessages((current) => [
			...current,
			{ id: createId(), role: "user", text: request },
			{ id: createId(), role: "assistant", text: `Sure. ${contactPrompts.name}` },
		]);
		window.requestAnimationFrame(() => inputRef.current?.focus());
	};

	const submitContactFlow = async (fields, userMessage) => {
		setContactFlowStep("sending");
		setIsContactSubmitting(true);
		setMessages((current) => [
			...current,
			{ id: createId(), role: "user", text: userMessage },
			{ id: createId(), role: "assistant", text: "Sending your email..." },
		]);

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify(fields),
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok || result.delivery !== "smtp") {
				throw new Error(result.error || "The email server could not confirm delivery.");
			}
			setMessages((current) => [...current, {
				id: createId(),
				role: "assistant",
				text: "Your message was accepted by the email server for delivery. Tanmoy can reply to the address you provided.",
			}]);
		} catch (error) {
			setMessages((current) => [...current, {
				id: createId(),
				role: "error",
				text: `I couldn't send that email: ${error.message || "delivery failed"} You can email Tanmoy directly at ${portfolioData.email}.`,
			}]);
		} finally {
			setContactFlowStep(null);
			setContactForm(initialContactForm);
			setIsContactSubmitting(false);
			window.requestAnimationFrame(() => inputRef.current?.focus());
		}
	};

	const continueContactFlow = (userMessage) => {
		if (!contactFlowStep || contactFlowStep === "sending") return;
		const value = contactFlowStep === "name"
			? userMessage.replace(/\s+/g, " ").trim()
			: contactFlowStep === "email"
				? userMessage.trim().toLowerCase()
				: userMessage.trim();

		if (/^(?:cancel|stop|never mind)$/i.test(value)) {
			setContactFlowStep(null);
			setContactForm(initialContactForm);
			setMessages((current) => [
				...current,
				{ id: createId(), role: "user", text: userMessage },
				{ id: createId(), role: "assistant", text: "No problem. I haven't sent anything." },
			]);
			return;
		}

		const validationError = getContactFieldValidationError(contactFlowStep, value);
		if (validationError) {
			setMessages((current) => [
				...current,
				{ id: createId(), role: "user", text: userMessage },
				{ id: createId(), role: "assistant", text: `${validationError} ${contactPrompts[contactFlowStep]}` },
			]);
			return;
		}

		const fields = normalizeContactFields({ ...contactForm, [contactFlowStep]: value });
		if (contactFlowStep === "message") {
			void submitContactFlow(fields, userMessage);
			return;
		}

		const nextStep = contactFlowStep === "name" ? "email" : "message";
		setContactForm(fields);
		setContactFlowStep(nextStep);
		setMessages((current) => [
			...current,
			{ id: createId(), role: "user", text: userMessage },
			{ id: createId(), role: "assistant", text: contactPrompts[nextStep] },
		]);
	};

	useEffect(() => {
		voiceRepliesRef.current = voiceRepliesEnabled;
		if (!voiceRepliesEnabled) window.speechSynthesis?.cancel();
	}, [voiceRepliesEnabled]);

	useEffect(() => {
		let inactivityTimer;

		const markActive = () => {
			if (document.visibilityState === "hidden") return;
			setIsUserActive(true);
			window.clearTimeout(inactivityTimer);
			inactivityTimer = window.setTimeout(() => setIsUserActive(false), INACTIVITY_MS);
		};
		const handleVisibility = () => {
			if (document.visibilityState === "hidden") {
				window.clearTimeout(inactivityTimer);
				setIsUserActive(false);
			} else {
				markActive();
			}
		};

		markActive();
		document.addEventListener("pointerdown", markActive, { passive: true });
		document.addEventListener("keydown", markActive);
		document.addEventListener("visibilitychange", handleVisibility);
		window.addEventListener("scroll", markActive, { passive: true });

		return () => {
			window.clearTimeout(inactivityTimer);
			document.removeEventListener("pointerdown", markActive);
			document.removeEventListener("keydown", markActive);
			document.removeEventListener("visibilitychange", handleVisibility);
			window.removeEventListener("scroll", markActive);
		};
	}, []);

	useEffect(() => {
		if (!isAssistantOpen || !isUserActive) {
			return undefined;
		}

		let disposed = false;
		let socket;
		let reconnectTimer;
		let attempts = 0;
		const restorePendingRequest = () => {
			const pendingRequest = pendingRequestRef.current;
			if (!pendingRequest) return;
			setInput(pendingRequest.message);
			setAttachments(pendingRequest.attachments);
			pendingRequestRef.current = null;
		};

		const scheduleReconnect = () => {
			if (disposed) return;
			if (attempts >= MAX_RECONNECT_ATTEMPTS) {
				setConnectionState("unavailable");
				return;
			}
			const delay = Math.min(1000 * 2 ** attempts, 12000);
			attempts += 1;
			reconnectTimer = window.setTimeout(connect, delay);
		};

		const connect = async () => {
			window.clearTimeout(reconnectTimer);
			setConnectionState(attempts ? "offline" : "connecting");

			try {
				const tokenPayload = await getChatCredentials();
				if (disposed) return;

				const websocketUrl = new URL(tokenPayload.websocketUrl);
				websocketUrl.pathname = `${websocketUrl.pathname.replace(/\/$/, "")}/ws`;
				websocketUrl.searchParams.set("token", tokenPayload.token);
				socket = new WebSocket(websocketUrl);
				socketRef.current = socket;

				socket.addEventListener("message", (event) => {
					let payload;
					try {
						payload = JSON.parse(event.data);
					} catch {
						return;
					}

					if (payload.type === "ping") return;
					if (payload.type === "ready") {
						attempts = 0;
						restorePendingRequest();
						setIsTyping(false);
						setConnectionState("ready");
						return;
					}
					if (payload.type === "typing") {
						setIsTyping(Boolean(payload.active));
						return;
					}
					if (payload.type === "assistant" && typeof payload.message === "string") {
						pendingRequestRef.current = null;
						setAttachments([]);
						setIsTyping(false);
						setMessages((current) => [
							...current,
							{ id: payload.id || createId(), role: "assistant", text: payload.message },
						]);
						if (voiceRepliesRef.current && "speechSynthesis" in window) {
							window.speechSynthesis.cancel();
							const utterance = new SpeechSynthesisUtterance(payload.message);
							utterance.lang = "en-IN";
							window.speechSynthesis.speak(utterance);
						}
						return;
					}
					if (payload.type === "error" && typeof payload.message === "string") {
						restorePendingRequest();
						setIsTyping(false);
						setMessages((current) => [
							...current,
							{ id: createId(), role: "error", text: payload.message },
						]);
					}
				});

				socket.addEventListener("close", () => {
					if (disposed) return;
					restorePendingRequest();
					if (socketRef.current === socket) socketRef.current = null;
					setIsTyping(false);
					setConnectionState("offline");
					scheduleReconnect();
				});
				socket.addEventListener("error", () => socket.close());
			} catch {
				setConnectionState("unavailable");
				scheduleReconnect();
			}
		};

		connect();
		return () => {
			disposed = true;
			window.clearTimeout(reconnectTimer);
			if (socketRef.current === socket) socketRef.current = null;
			socket?.close(1000, "Connection paused");
		};
	}, [isAssistantOpen, isUserActive]);

	useEffect(() => {
		if (!isAssistantOpen) return undefined;
		const handleKeyDown = (event) => {
			if (event.key === "Escape" && contactFlowStep && contactFlowStep !== "sending") {
				setContactFlowStep(null);
				setContactForm(initialContactForm);
				setMessages((current) => [
					...current,
					{ id: createId(), role: "assistant", text: "No problem. I haven't sent anything." },
				]);
				return;
			}
			if (event.key === "Escape" && isUploadDialogOpen) {
				setIsUploadDialogOpen(false);
				setPendingFiles([]);
				setUploadError("");
				window.requestAnimationFrame(() => uploadTriggerRef.current?.focus());
				return;
			}
			if (event.key === "Escape") {
				closeAssistant();
				return;
			}
			if (event.key === "Tab" && isUploadDialogOpen) {
				const focusable = [...uploadDialogRef.current.querySelectorAll("button:not(:disabled), [tabindex]:not([tabindex='-1'])")];
				const first = focusable[0];
				const last = focusable.at(-1);
				if (!first || !last) return;
				if (event.shiftKey && (document.activeElement === first || !uploadDialogRef.current.contains(document.activeElement))) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && (document.activeElement === last || !uploadDialogRef.current.contains(document.activeElement))) {
					event.preventDefault();
					first.focus();
				}
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		if (isUploadDialogOpen) uploadDialogRef.current?.querySelector("button:not(:disabled)")?.focus();
		else if (visitorName) inputRef.current?.focus();
		else nameInputRef.current?.focus();
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [closeAssistant, contactFlowStep, isAssistantOpen, isUploadDialogOpen, visitorName]);

	useEffect(() => {
		if (isAssistantOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [isAssistantOpen, isTyping, messages]);

	useEffect(() => {
		if (isAssistantOpen) return;
		recognitionRef.current?.stop();
		window.speechSynthesis?.cancel();
	}, [isAssistantOpen]);

	const addClientError = (message) => {
		setMessages((current) => [...current, { id: createId(), role: "error", text: message }]);
	};

	const submitVisitorName = (event) => {
		event.preventDefault();
		const name = draftName.replace(/\s+/g, " ").trim();
		if (name.length < 2 || name.length > 60) {
			setNameError("Enter a name between 2 and 60 characters.");
			return;
		}
		setNameError("");
		setVisitorName(name);
	};

	const stageFiles = (files) => {
		const selectedFiles = Array.from(files || []);
		if (selectedFiles.length === 0) return;
		if (attachments.length + pendingFiles.length + selectedFiles.length > MAX_FILES) {
			setUploadError("A chat session can contain at most five files.");
			return;
		}
		if (selectedFiles.some((file) => !/\.(?:pdf|txt|xlsx)$/i.test(file.name))) {
			setUploadError("Only PDF, TXT, and XLSX files are supported.");
			return;
		}
		if (selectedFiles.some((file) => file.size < 1 || file.size > MAX_FILE_BYTES)) {
			setUploadError("Each file must be no larger than 2 MiB.");
			return;
		}
		setUploadError("");
		setPendingFiles((current) => {
			const known = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
			return [...current, ...selectedFiles.filter((file) => !known.has(`${file.name}:${file.size}:${file.lastModified}`))];
		});
	};

	const handleFileSelection = (event) => {
		stageFiles(event.target.files);
		event.target.value = "";
	};

	const savePendingFiles = async () => {
		if (pendingFiles.length === 0) return;

		setIsUploading(true);
		setUploadError("");
		try {
			const credentials = await getChatCredentials();
			const uploadUrl = new URL(credentials.websocketUrl);
			uploadUrl.protocol = uploadUrl.protocol === "wss:" ? "https:" : "http:";
			uploadUrl.pathname = `${uploadUrl.pathname.replace(/\/$/, "")}/upload`;
			uploadUrl.search = "";
			const body = new FormData();
			pendingFiles.forEach((file) => body.append("files", file));
			const uploadResponse = await fetch(uploadUrl, {
				method: "POST",
				headers: { Authorization: `Bearer ${credentials.token}` },
				body,
			});
			const payload = await uploadResponse.json().catch(() => ({}));
			if (!uploadResponse.ok || !Array.isArray(payload.files)) {
				throw new Error(payload.error || "Files could not be stored.");
			}
			setAttachments((current) => [...current, ...payload.files].slice(0, MAX_FILES));
			setPendingFiles([]);
			setIsUploadDialogOpen(false);
		} catch (error) {
			setUploadError(error.message || "Files could not be stored.");
		} finally {
			setIsUploading(false);
		}
	};

	const toggleListening = () => {
		if (recognitionRef.current) {
			recognitionRef.current.stop();
			return;
		}

		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) {
			addClientError("Voice input is not supported by this browser.");
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "en-IN";
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.onresult = (resultEvent) => {
			const transcript = Array.from(resultEvent.results)
				.map((result) => result[0]?.transcript || "")
				.join(" ")
				.trim();
			setInput(transcript.slice(0, 500));
		};
		recognition.onerror = (errorEvent) => {
			if (!["aborted", "no-speech"].includes(errorEvent.error)) addClientError("Voice input could not be started.");
		};
		recognition.onend = () => {
			recognitionRef.current = null;
			setIsListening(false);
		};

		try {
			recognitionRef.current = recognition;
			setIsListening(true);
			recognition.start();
		} catch {
			recognitionRef.current = null;
			setIsListening(false);
			addClientError("Voice input could not be started.");
		}
	};

	const activeConnectionState = isUserActive ? connectionState : "paused";

	const sendMessage = (value) => {
		const message = value.trim() || (!contactFlowStep && attachments.length ? "Please summarize the attached files." : "");
		const maxMessageLength = contactFlowStep === "message" ? CONTACT_LIMITS.messageMax : 500;
		if (!message || message.length > maxMessageLength) return;
		if (contactFlowStep && contactFlowStep !== "sending") {
			continueContactFlow(message);
			setInput("");
			return;
		}
		if (contactIntentPattern.test(message)) {
			setInput("");
			startContactFlow(message);
			return;
		}
		if (activeConnectionState !== "ready") return;
		if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
		const sentAttachments = attachments.map(({ id, name, size, type }) => ({ id, name, size, type }));

		setMessages((current) => [
			...current,
			{ id: createId(), role: "user", text: message, attachments: sentAttachments },
		]);
		pendingRequestRef.current = { message, attachments: sentAttachments };
		setInput("");
		setIsTyping(true);
		socketRef.current.send(JSON.stringify({
			type: "chat",
			message,
			name: visitorName,
			fileIds: sentAttachments.map((file) => file.id),
		}));
		setAttachments([]);
	};

	const suggestedQuestions = getSuggestedQuestions(messages, isTyping);

	if (!isAssistantOpen) return null;

	return (
		<aside id="portfolio-assistant" className={styles.panel} role="dialog" aria-label="Tanmoy portfolio assistant">
				<header className={styles.header}>
					<div className={styles.identity}>
						<span className={styles.botIcon} aria-hidden="true"><FaRobot /></span>
						<div>
							<h2>Ask about Tanmoy</h2>
							<p>Portfolio-only assistant</p>
						</div>
					</div>
					<button className={styles.closeButton} type="button" onClick={closeAssistant} aria-label="Close assistant">
						<FaTimes aria-hidden="true" />
					</button>
				</header>

				<div className={styles.status} role="status" aria-live="polite">
					<span className={styles.connectionStatus}>
						<span className={`${styles.statusDot} ${activeConnectionState === "ready" ? styles.online : ""}`} aria-hidden="true" />
						{connectionLabels[activeConnectionState]}
					</span>
					{visitorName && <div className={styles.statusActions}>
						<button type="button" className={styles.contactButton} onClick={() => startContactFlow()} aria-label="Email Tanmoy" disabled={Boolean(contactFlowStep) || isContactSubmitting}>
							<FaEnvelope aria-hidden="true" />
							<span>Email Tanmoy</span>
						</button>
						<button
							type="button"
							className={`${styles.voiceToggle} ${voiceRepliesEnabled ? styles.activeControl : ""}`}
							onClick={() => setVoiceRepliesEnabled((current) => !current)}
							aria-label={voiceRepliesEnabled ? "Disable spoken replies" : "Enable spoken replies"}
							title={voiceRepliesEnabled ? "Spoken replies on" : "Spoken replies off"}
						>
							{voiceRepliesEnabled ? <FaVolumeUp aria-hidden="true" /> : <FaVolumeMute aria-hidden="true" />}
						</button>
					</div>}
				</div>

				<div className={styles.messages} aria-live="polite">
					{!visitorName ? (
						<form className={styles.onboarding} onSubmit={submitVisitorName}>
							<span className={styles.onboardingIcon} aria-hidden="true"><FaRobot /></span>
							<h3>Welcome</h3>
							<p>What should I call you?</p>
							<label className={styles.srOnly} htmlFor="assistant-name">Your name</label>
							<input
								id="assistant-name"
								ref={nameInputRef}
								value={draftName}
								onChange={(event) => setDraftName(event.target.value)}
								placeholder="Your name"
								minLength={2}
								maxLength={60}
								autoComplete="name"
								required
							/>
							{nameError && <span className={styles.nameError} role="alert">{nameError}</span>}
							<button type="submit" disabled={draftName.trim().length < 2}>Continue</button>
							<small className={styles.retentionNote}>Your name and chat are retained for 90 days. Don&apos;t share sensitive information.</small>
						</form>
					) : (
						<>
							{messages.length === 0 && (
								<div className={styles.welcome}>
									<strong>Hi {visitorName}. Start with a portfolio question.</strong>
									<p>I can discuss public experience, skills, projects, education, and contact details.</p>
									<button type="button" className={styles.contactCta} onClick={() => startContactFlow()}>
										<FaEnvelope aria-hidden="true" /> Email Tanmoy
									</button>
								</div>
							)}
							{messages.map((message) => (
								<div className={`${styles.message} ${styles[message.role]}`} key={message.id}>
									<span className={styles.messageText}>{message.text}</span>
									{message.attachments?.length > 0 && (
										<ul className={styles.sentAttachments} aria-label="Files sent with this message">
											{message.attachments.map((file) => (
												<li className={styles.sentAttachment} key={file.id}>
													<FaPaperclip aria-hidden="true" />
													<span title={file.name}>{file.name}</span>
													<small>{formatFileSize(file.size)}</small>
												</li>
											))}
										</ul>
									)}
								</div>
							))}
							{isTyping && (
								<div className={`${styles.message} ${styles.assistant} ${styles.typing}`} aria-label="Assistant is responding">
									<span /><span /><span />
								</div>
							)}
							<div ref={messagesEndRef} />
						</>
					)}
				</div>

				{visitorName && !contactFlowStep && suggestedQuestions.length > 0 && (
					<div className={styles.suggestions} aria-label={messages.length ? "Suggested follow-up questions" : "Suggested questions"}>
						{suggestedQuestions.map((suggestion) => (
							<button
								type="button"
								key={suggestion}
								onClick={() => sendMessage(suggestion)}
								disabled={activeConnectionState !== "ready"}
							>
								{suggestion}
							</button>
						))}
					</div>
				)}

				{visitorName && isUploadDialogOpen && (
					<div className={styles.uploadOverlay}>
						<div ref={uploadDialogRef} className={styles.uploadDialog} role="dialog" aria-modal="true" aria-labelledby="upload-title">
							<div className={styles.uploadHeader}>
								<div>
									<h3 id="upload-title">Attach files</h3>
									<p>PDF, TXT, or XLSX · 2 MiB each · 5 total</p>
								</div>
								<button
									type="button"
									onClick={closeUploadDialog}
									aria-label="Close file dialog"
								>
									<FaTimes aria-hidden="true" />
								</button>
							</div>

							<button
								type="button"
								className={`${styles.dropzone} ${isDraggingFiles ? styles.dragActive : ""}`}
								onClick={() => fileInputRef.current?.click()}
								onDragEnter={(event) => {
									event.preventDefault();
									setIsDraggingFiles(true);
								}}
								onDragOver={(event) => event.preventDefault()}
								onDragLeave={() => setIsDraggingFiles(false)}
								onDrop={(event) => {
									event.preventDefault();
									setIsDraggingFiles(false);
									stageFiles(event.dataTransfer.files);
								}}
							>
								<FaPaperclip aria-hidden="true" />
								<strong>Choose files</strong>
								<span>or drop them here</span>
							</button>
							{uploadError && <p className={styles.uploadError} role="alert">{uploadError}</p>}

							<div className={styles.fileReview}>
								{attachments.length > 0 && (
									<div>
										<h4>Saved for next message</h4>
										{attachments.map((file) => (
											<div className={styles.reviewFile} key={file.id}>
												<span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span>
												<button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))} aria-label={`Remove ${file.name}`}>
													<FaTimes aria-hidden="true" />
												</button>
											</div>
										))}
									</div>
								)}
								<div>
									<h4>Ready to upload</h4>
									{pendingFiles.length === 0 ? (
										<p className={styles.emptyFiles}>No files selected.</p>
									) : pendingFiles.map((file) => (
										<div className={styles.reviewFile} key={`${file.name}:${file.size}:${file.lastModified}`}>
											<span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span>
											<button type="button" onClick={() => setPendingFiles((current) => current.filter((item) => item !== file))} aria-label={`Remove ${file.name}`}>
												<FaTimes aria-hidden="true" />
											</button>
										</div>
									))}
								</div>
							</div>

							<div className={styles.uploadActions}>
								<button
									type="button"
									onClick={closeUploadDialog}
								>
									Cancel
								</button>
								<button type="button" onClick={savePendingFiles} disabled={pendingFiles.length === 0 || isUploading}>
									{isUploading ? "Saving..." : "Save files"}
								</button>
							</div>
						</div>
					</div>
				)}

				{visitorName && <form
					className={styles.composer}
					onSubmit={(event) => {
						event.preventDefault();
						sendMessage(input);
					}}
				>
					<input
						ref={fileInputRef}
						className={styles.fileInput}
						type="file"
						accept=".pdf,.txt,.xlsx"
						multiple
						onChange={handleFileSelection}
						tabIndex={-1}
					/>
					{attachments.length > 0 && (
						<div className={styles.attachments} aria-label="Attached files">
							{attachments.map((file) => (
								<span className={styles.attachment} key={file.id}>
									<span title={file.name}>{file.name}</span>
									<button
										type="button"
										onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}
										aria-label={`Remove ${file.name}`}
									>
										<FaTimes aria-hidden="true" />
									</button>
								</span>
							))}
						</div>
					)}
					{isUploading && <p className={styles.uploadStatus}>Encrypting and storing files...</p>}
					<div className={styles.composerRow}>
						<button
							ref={uploadTriggerRef}
							type="button"
							className={styles.toolButton}
							onClick={() => {
								setUploadError("");
								setIsUploadDialogOpen(true);
							}}
							disabled={isUploading || isTyping}
							aria-label="Attach files"
							title="Attach up to 5 PDF, TXT, or XLSX files, 2 MiB each"
						>
							<FaPaperclip aria-hidden="true" />
						</button>
						<label className={styles.srOnly} htmlFor="assistant-message">{contactFlowStep ? "Your email details" : "Ask a portfolio question"}</label>
						{contactFlowStep === "message" ? (
							<textarea
								id="assistant-message"
								ref={inputRef}
								value={input}
								onChange={(event) => setInput(event.target.value)}
								placeholder="Type the email message"
								disabled={isTyping || isContactSubmitting}
								maxLength={CONTACT_LIMITS.messageMax}
								rows={2}
								autoComplete="off"
							/>
						) : (
							<input
								id="assistant-message"
								ref={inputRef}
								value={input}
								onChange={(event) => setInput(event.target.value)}
								placeholder={contactFlowStep === "name" ? "Type the contact name" : contactFlowStep === "email" ? "Type the reply email" : contactFlowStep === "sending" ? "Sending email..." : activeConnectionState === "ready" ? "Ask about experience or projects" : "Connecting to assistant"}
								disabled={isTyping || isContactSubmitting}
								maxLength={contactFlowStep === "name" ? CONTACT_LIMITS.nameMax : contactFlowStep === "email" ? CONTACT_LIMITS.emailMax : 500}
								autoComplete="off"
							/>
						)}
						<button
							type="button"
							className={`${styles.toolButton} ${isListening ? styles.activeControl : ""}`}
							onClick={toggleListening}
							aria-label={isListening ? "Stop voice input" : "Start voice input"}
							title={isListening ? "Stop listening" : "Use microphone"}
						>
							<FaMicrophone aria-hidden="true" />
						</button>
						<button
							type="submit"
							className={styles.sendButton}
							disabled={(!input.trim() && attachments.length === 0) || (!contactFlowStep && activeConnectionState !== "ready") || isTyping || isUploading || isContactSubmitting}
							aria-label="Send message"
						>
							<FaArrowUp aria-hidden="true" />
						</button>
					</div>
				</form>}
		</aside>
	);
};

export default ChatPanel;