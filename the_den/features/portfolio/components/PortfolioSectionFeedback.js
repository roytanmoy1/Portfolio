export default function PortfolioSectionFeedback({ label, error, onRetry, className, retryClassName }) {
	return (
		<div className={className} role="status" aria-live="polite" aria-busy={!error}>
			<span>{error || `Loading ${label}…`}</span>
			{error && (
				<button className={retryClassName} type="button" onClick={onRetry}>
					Retry
				</button>
			)}
		</div>
	);
}
