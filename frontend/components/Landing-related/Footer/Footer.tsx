export type FooterProps = {
	text: string;
};

function Footer({ text }: FooterProps) {
	return (
		<footer
			className="mt-32 bg-gray-900 sm:mt-56"
			aria-labelledby="footer-heading"
		>
			<div className="mx-auto max-w-7xl px-6 pb-8 pt-8">
				<div className="  md:flex md:items-center md:justify-between">
					<p className="mt-8 text-xs leading-5 text-gray-400 md:order-1 md:mt-0">
						&copy; {text}
					</p>
				</div>
			</div>
		</footer>
	);
}
export default Footer;
