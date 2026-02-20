export default function FeaturesSlide() {
	const features = [
		{
			title: "React + TypeScript",
			description: "Write slides with full type safety",
		},
		{
			title: "MDX Support",
			description: "Mix markdown with React components",
		},
		{
			title: "Hot Reload",
			description: "See changes instantly in dev",
		},
		{
			title: "Keyboard Navigation",
			description: "Navigate with arrow keys and space",
		},
		{
			title: "Themeable",
			description: "Customize with Tailwind CSS",
		},
	];

	return (
		<div className="flex h-full flex-col items-center justify-center gap-8 bg-white p-12">
			<h1 className="text-5xl font-bold text-slate-900">Features</h1>
			<div className="grid w-full max-w-4xl grid-cols-2 gap-6">
				{features.map((feature) => (
					<div
						key={feature.title}
						className="rounded-lg border border-slate-200 bg-slate-50 p-6"
					>
						<h3 className="text-xl font-semibold text-slate-800">
							{feature.title}
						</h3>
						<p className="mt-2 text-slate-600">{feature.description}</p>
					</div>
				))}
			</div>
		</div>
	);
}
