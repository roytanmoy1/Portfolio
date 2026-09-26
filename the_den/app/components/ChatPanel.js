"use client";

import { useEffect, useRef, useState } from "react";
import {
	FaArrowUp,
	FaMicrophone,
	FaPaperclip,
	FaRobot,
	FaTimes,
	FaVolumeMute,
	FaVolumeUp,
} from "react-icons/fa";
import { useAssistant } from "../AssistantContext";
import styles from "./ChatPanel.module.css";

const suggestions = [
	"What is Tanmoy's current role?",
	"Which projects show AI experience?",
	"Summarize his cloud skills.",
	"How can I contact Tanmoy?",
];

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
	const [draftName, setDraftName] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [isUserActive, setIsUserActive] = useState(true);
	const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(false);
	const [visitorName, setVisitorName] = useState("");
	const [nameError, setNameError] = useState("");
	const socketRef = useRef(null);
	const fileInputRef = useRef(null);
	const recognitionRef = useRef(null);
	const voiceRepliesRef = useRef(false);
	const messagesEndRef = useRef(null);
	const nameInputRef = useRef(null);
	const inputRef = useRef(null);

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
		if (!isUserActive) {
			setConnectionState("paused");
			return undefined;
		}

		let disposed = false;
		let socket;
		let reconnectTimer;
		let attempts = 0;

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
						setConnectionState("ready");
						return;
					}
					if (payload.type === "typing") {
						setIsTyping(Boolean(payload.active));
						return;
					}
					if (payload.type === "assistant" && typeof payload.message === "string") {
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
						setIsTyping(false);
						setMessages((current) => [
							...current,
							{ id: createId(), role: "error", text: payload.message },
						]);
					}
				});

				socket.addEventListener("close", () => {
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
	}, [isUserActive]);

	useEffect(() => {
		if (!isAssistantOpen) return undefined;
		const handleKeyDown = (event) => {
			if (event.key === "Escape") closeAssistant();
		};
		document.addEventListener("keydown", handleKeyDown);
		if (visitorName) inputRef.current?.focus();
		else nameInputRef.current?.focus();
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [closeAssistant, isAssistantOpen, visitorName]);

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

	const handleFileSelection = async (event) => {
		const selectedFiles = Array.from(event.target.files || []);
		event.target.value = "";
		if (selectedFiles.length === 0) return;
		if (attachments.length + selectedFiles.length > MAX_FILES) {
			addClientError("A chat session can contain at most five files.");
			return;
		}
		if (selectedFiles.some((file) => file.size < 1 || file.size > MAX_FILE_BYTES)) {
			addClientError("Each file must be no larger than 2 MiB.");
			return;
		}

		setIsUploading(true);
		try {
			const credentials = await getChatCredentials();
			const uploadUrl = new URL(credentials.websocketUrl);
			uploadUrl.protocol = uploadUrl.protocol === "wss:" ? "https:" : "http:";
			uploadUrl.pathname = `${uploadUrl.pathname.replace(/\/$/, "")}/upload`;
			uploadUrl.search = "";
			const body = new FormData();
			selectedFiles.forEach((file) => body.append("files", file));
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
		} catch (error) {
			addClientError(error.message || "Files could not be stored.");
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

	const sendMessage = (value) => {
		const message = value.trim() || (attachments.length ? "Please summarize the attached files." : "");
		if (!message || message.length > 500 || connectionState !== "ready") return;
		if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

		setMessages((current) => [...current, { id: createId(), role: "user", text: message }]);
		setInput("");
		setIsTyping(true);
		socketRef.current.send(JSON.stringify({
			type: "chat",
			message,
			name: visitorName,
			fileIds: attachments.map((file) => file.id),
		}));
		setAttachments([]);
	};

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
						<span className={`${styles.statusDot} ${connectionState === "ready" ? styles.online : ""}`} aria-hidden="true" />
						{connectionLabels[connectionState]}
					</span>
					{visitorName && (
						<button
							type="button"
							className={`${styles.voiceToggle} ${voiceRepliesEnabled ? styles.activeControl : ""}`}
							onClick={() => setVoiceRepliesEnabled((current) => !current)}
							aria-label={voiceRepliesEnabled ? "Disable spoken replies" : "Enable spoken replies"}
							title={voiceRepliesEnabled ? "Spoken replies on" : "Spoken replies off"}
						>
							{voiceRepliesEnabled ? <FaVolumeUp aria-hidden="true" /> : <FaVolumeMute aria-hidden="true" />}
						</button>
					)}
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
						</form>
					) : (
						<>
							{messages.length === 0 && (
								<div className={styles.welcome}>
									<strong>Hi {visitorName}. Start with a portfolio question.</strong>
									<p>I can discuss public experience, skills, projects, education, and contact details.</p>
								</div>
							)}
							{messages.map((message) => (
								<div className={`${styles.message} ${styles[message.role]}`} key={message.id}>
									{message.text}
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

				{visitorName && messages.every((message) => message.role !== "user") && (
					<div className={styles.suggestions} aria-label="Suggested questions">
						{suggestions.map((suggestion) => (
							<button
								type="button"
								key={suggestion}
								onClick={() => sendMessage(suggestion)}
								disabled={connectionState !== "ready"}
							>
								{suggestion}
							</button>
						))}
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
							type="button"
							className={styles.toolButton}
							onClick={() => fileInputRef.current?.click()}
							disabled={isUploading || attachments.length >= MAX_FILES}
							aria-label="Attach files"
							title="Attach up to 5 PDF, TXT, or XLSX files, 2 MiB each"
						>
							<FaPaperclip aria-hidden="true" />
						</button>
						<label className={styles.srOnly} htmlFor="assistant-message">Ask a portfolio question</label>
						<input
							id="assistant-message"
							ref={inputRef}
							value={input}
							onChange={(event) => setInput(event.target.value)}
							placeholder={connectionState === "ready" ? "Ask about experience or projects" : "Connecting to assistant"}
							maxLength={500}
							autoComplete="off"
						/>
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
							disabled={(!input.trim() && attachments.length === 0) || connectionState !== "ready" || isTyping || isUploading}
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