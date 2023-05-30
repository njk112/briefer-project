import LogoCloud from "@components/Landing-related/LogoCloud/LogoCloud";
import FeatureSection from "@components/Landing-related/FeatureSection/FeatureSection";
import Hero from "@components/Landing-related/Hero/Hero";
import Footer from "@components/Landing-related/Footer/Footer";
import Header from "@components/Landing-related/Header/Header";
import { textConfig } from "@/app.config";

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
