"use client";

import { useEffect, useRef, useState } from "react";

export function usePortfolioSectionData(section) {
	const sectionRef = useRef(null);
	const [retryCount, setRetryCount] = useState(0);
	const [result, setResult] = useState({ data: null, error: "", loading: false });

	useEffect(() => {
		const target = sectionRef.current;
		if (!target) return undefined;

		let observer;
		const controller = new AbortController();
		let active = true;
		let requestStarted = false;
		const loadMargin = 560;

		const load = async () => {
			if (requestStarted) return;
			requestStarted = true;
			observer?.disconnect();
			window.removeEventListener("scroll", loadWhenNear);
			window.removeEventListener("resize", loadWhenNear);
			setResult({ data: null, error: "", loading: true });
			try {
				const response = await fetch(`/api/portfolio?section=${encodeURIComponent(section)}`, {
					signal: controller.signal,
				});
				if (!response.ok) throw new Error("Portfolio data is temporarily unavailable.");
				const payload = await response.json();
				if (payload.section !== section || payload.data == null) {
					throw new Error("Portfolio data is temporarily unavailable.");
				}
				if (active) setResult({ data: payload.data, error: "", loading: false });
			} catch (error) {
				if (error.name !== "AbortError" && active) {
					setResult({ data: null, error: "Portfolio data is temporarily unavailable.", loading: false });
				}
			}
		};
		const loadWhenNear = () => {
			const bounds = target.getBoundingClientRect();
			if (bounds.top <= window.innerHeight + loadMargin && bounds.bottom >= -loadMargin) void load();
		};

		if (typeof IntersectionObserver !== "function") {
			window.addEventListener("scroll", loadWhenNear, { passive: true });
			window.addEventListener("resize", loadWhenNear);
			loadWhenNear();
		} else {
			observer = new IntersectionObserver((entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				void load();
			}, { rootMargin: `${loadMargin}px 0px` });
			observer.observe(target);
			window.addEventListener("scroll", loadWhenNear, { passive: true });
			window.addEventListener("resize", loadWhenNear);
			loadWhenNear();
		}

		return () => {
			active = false;
			observer?.disconnect();
			window.removeEventListener("scroll", loadWhenNear);
			window.removeEventListener("resize", loadWhenNear);
			controller.abort();
		};
	}, [section, retryCount]);

	return {
		sectionRef,
		...result,
		retry: () => setRetryCount((count) => count + 1),
	};
}
