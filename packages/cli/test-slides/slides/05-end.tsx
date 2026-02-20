export default function EndSlide() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
			<h1 className="text-6xl font-bold">Get Started</h1>
			<p className="text-2xl text-slate-300">Create your first slide deck</p>

			<div className="mt-8 rounded-lg bg-slate-800 p-6 font-mono text-lg">
				<div className="text-slate-400"># Create a new project</div>
				<div className="text-green-400">bunx @mnestia/cli create my-deck</div>
				<div className="mt-2 text-slate-400"># Start developing</div>
				<div className="text-green-400">cd my-deck && bun dev</div>
			</div>

			<div className="mt-12 text-slate-400">
				Thank you for trying Mnestia!
			</div>
		</div>
	);
}
