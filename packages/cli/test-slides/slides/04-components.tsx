import { useState } from "react";

export default function ComponentsSlide() {
	const [count, setCount] = useState(0);

	return (
		<div className="flex h-full flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-900 to-purple-900 p-12 text-white">
			<h1 className="text-5xl font-bold">Interactive Components</h1>
			<p className="text-xl text-indigo-200">
				Slides can have state and interactivity
			</p>

			<div className="mt-8 flex flex-col items-center gap-6">
				<button
					onClick={() => setCount((c) => c + 1)}
					className="rounded-lg bg-indigo-500 px-8 py-4 text-2xl font-semibold transition hover:bg-indigo-400"
				>
					Click me! Count: {count}
				</button>

				<div className="flex gap-4">
					<button
						onClick={() => setCount(0)}
						className="rounded bg-indigo-700 px-4 py-2 text-sm transition hover:bg-indigo-600"
					>
						Reset
					</button>
					<button
						onClick={() => setCount((c) => c - 1)}
						className="rounded bg-indigo-700 px-4 py-2 text-sm transition hover:bg-indigo-600"
					>
						Decrement
					</button>
				</div>
			</div>

			<p className="mt-8 text-indigo-300">
				React hooks work just like in any React app
			</p>
		</div>
	);
}
