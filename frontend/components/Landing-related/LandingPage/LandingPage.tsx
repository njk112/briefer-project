import LogoCloud from "../LogoCloud/LogoCloud";
import FeatureSection from "../FeatureSection/FeatureSection";
import Hero from "../Hero/Hero";
import Footer from "./Footer/Footer";
import Header from "../Header/Header";
import { textConfig } from "@/text.config";

export default function LandingPage() {
	return (
		<div className="bg-white">
			<Header {...textConfig.landingPage.header} />
			<main>
				<Hero {...textConfig.landingPage.heroSection} />
				<LogoCloud />
				<FeatureSection {...textConfig.landingPage.featureSection} />
			</main>
			<Footer {...textConfig.landingPage.footer} />
		</div>
	);
}
