import { textConfig } from "@/app.config";
import DesktopSideBar from "@components/Dashboard-related/Sidebars/DesktopSideBar/DesktopSidebar";
import MobileSideBar from "@components/Dashboard-related/Sidebars/MobileSideBar/MobileSidebar";
import AddVideos from "@components/Dashboard-related/YoutubeVideos/YoutubeVideos";

export default function Dashboard() {
	return (
		<>
			<div>
				<MobileSideBar {...textConfig.dashboard.mobileSideBar} />
				<DesktopSideBar />

				<main className="py-10 lg:pl-72">
					<div className="px-4 sm:px-6 lg:px-8">
						<AddVideos />
					</div>
				</main>
			</div>
		</>
	);
}
