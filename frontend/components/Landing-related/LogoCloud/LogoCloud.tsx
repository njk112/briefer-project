import Image from "next/image";

function LogoCloud() {
	return (
		<div className="mx-auto max-w-7xl px-6 lg:px-8 flex justify-center">
			<Image
				className="content-center"
				src="/youtube.webp"
				alt="Youtube logo"
				width={158}
				height={48}
			/>
		</div>
	);
}
export default LogoCloud;
