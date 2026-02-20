export default function WelcomeSlide() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
			<h1 className="text-6xl font-bold tracking-tight">Welcome to Mnestia</h1>
			<p className="text-2xl text-slate-300">Modern slide decks for developers</p>
			<div className="mt-8 flex gap-4 text-slate-400">
				<span className="flex items-center gap-2">
					<kbd className="rounded bg-slate-700 px-2 py-1 text-sm">Space</kbd>
					<span>Next</span>
				</span>
				<span className="flex items-center gap-2">
					<kbd className="rounded bg-slate-700 px-2 py-1 text-sm">←</kbd>
					<span>Previous</span>
				</span>
			</div>
		</div>
	);
}
