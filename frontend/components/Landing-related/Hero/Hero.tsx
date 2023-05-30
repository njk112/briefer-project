import Image from "next/image";

export type HeroProps = {
	title: string;
	paragraph: string;
	getStartedButton: string;
	learnMoreButton: string;
};

function Hero({
	title,
	paragraph,
	getStartedButton,
	learnMoreButton,
}: HeroProps) {
	return (
		<div className="relative isolate pt-14">
			<svg
				className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
				aria-hidden="true"
			>
				<defs>
					<pattern
						id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
						width={200}
						height={200}
						x="50%"
						y={-1}
						patternUnits="userSpaceOnUse"
					>
						<path d="M100 200V.5M.5 .5H200" fill="none" />
					</pattern>
				</defs>
				<svg x="50%" y={-1} className="overflow-visible fill-gray-50">
					<path
						d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
						strokeWidth={0}
					/>
				</svg>
				<rect
					width="100%"
					height="100%"
					strokeWidth={0}
					fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)"
				/>
			</svg>
			<div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
				<div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
					<h1 className="mt-10 max-w-lg text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
						{title}
					</h1>
					<p className="mt-6 text-lg leading-8 text-gray-600">{paragraph}</p>
					<div className="mt-10 flex items-center gap-x-6">
						<a
							href="youtube-summaries"
							className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
						>
							{getStartedButton}
						</a>
						<a
							href="#learnMore"
							className="text-sm font-semibold leading-6 text-gray-900"
						>
							{learnMoreButton}
						</a>
					</div>
				</div>
				<div className="mt-16 sm:mt-24 lg:mt-0 lg:flex-shrink-0 lg:flex-grow">
					<Image
						className="mx-auto w-[22.875rem] max-w-full drop-shadow-xl"
						src="/notebook.webp"
						alt="Notebook logo"
						width={367}
						height={367}
					/>
				</div>
			</div>
		</div>
	);
}
export default Hero;
