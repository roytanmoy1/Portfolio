"use client";

import { useEffect, useRef, useState } from "react";
import { FaArrowUp, FaRobot, FaTimes } from "react-icons/fa";
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
};
const MAX_RECONNECT_ATTEMPTS = 4;

const ChatPanel = () => {
	const { isAssistantOpen, closeAssistant } = useAssistant();
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState("");
	const [connectionState, setConnectionState] = useState("connecting");
	const [isTyping, setIsTyping] = useState(false);
	const socketRef = useRef(null);
	const messagesEndRef = useRef(null);
	const inputRef = useRef(null);

	useEffect(() => {
		if (!isAssistantOpen) return undefined;

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
				const tokenResponse = await fetch("/api/chat/token", {
					method: "POST",
					headers: { Accept: "application/json" },
					cache: "no-store",
				});
				const tokenPayload = await tokenResponse.json().catch(() => ({}));
				if (!tokenResponse.ok || !tokenPayload.token || !tokenPayload.websocketUrl) {
					throw new Error("Assistant connection is unavailable.");
				}

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
			socket?.close(1000, "Panel closed");
		};
	}, [isAssistantOpen]);

	useEffect(() => {
		if (!isAssistantOpen) return undefined;
		const handleKeyDown = (event) => {
			if (event.key === "Escape") closeAssistant();
		};
		document.addEventListener("keydown", handleKeyDown);
		inputRef.current?.focus();
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [closeAssistant, isAssistantOpen]);

	useEffect(() => {
		if (isAssistantOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [isAssistantOpen, isTyping, messages]);

	const sendMessage = (value) => {
		const message = value.trim();
		if (!message || message.length > 500 || connectionState !== "ready") return;
		if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

		setMessages((current) => [...current, { id: createId(), role: "user", text: message }]);
		setInput("");
		setIsTyping(true);
		socketRef.current.send(JSON.stringify({ type: "chat", message }));
	};

	if (!isAssistantOpen) return null;

	return (
		<>
			<button className={styles.backdrop} type="button" onClick={closeAssistant} aria-label="Close portfolio assistant" />
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
					<span className={`${styles.statusDot} ${connectionState === "ready" ? styles.online : ""}`} aria-hidden="true" />
					{connectionLabels[connectionState]}
				</div>

				<div className={styles.messages} aria-live="polite">
					{messages.length === 0 && (
						<div className={styles.welcome}>
							<strong>Start with a portfolio question.</strong>
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
				</div>

				{messages.every((message) => message.role !== "user") && (
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

				<form
					className={styles.composer}
					onSubmit={(event) => {
						event.preventDefault();
						sendMessage(input);
					}}
				>
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
					<button type="submit" disabled={!input.trim() || connectionState !== "ready" || isTyping} aria-label="Send message">
						<FaArrowUp aria-hidden="true" />
					</button>
				</form>
			</aside>
		</>
	);
};

export default ChatPanel;