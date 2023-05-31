import { dashboardNavigation } from "@/app.config";
import { classNames } from "@utils/ClassNames";
import Image from "next/image";

function DesktopSideBar() {
	return (
		<div>
			<div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
				<div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
					<div className="flex h-16 shrink-0 items-center">
						<a href="/">
							<Image
								className="h-4 w-auto"
								src="/briefer.png"
								alt="Briefer"
								width={100}
								height={100}
							/>
						</a>
					</div>
					<nav className="flex flex-1 flex-col">
						<ul role="list" className="flex flex-1 flex-col gap-y-7">
							<li>
								<ul role="list" className="-mx-2 space-y-1">
									{dashboardNavigation.map((item) => (
										<li key={item.name}>
											<a
												href={item.href}
												className={classNames(
													item.current
														? "bg-gray-50 text-indigo-600"
														: "text-gray-700 hover:bg-gray-50 hover:text-indigo-600",
													"group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
												)}
											>
												<item.icon
													className={classNames(
														item.current
															? "text-indigo-600"
															: "text-gray-400 group-hover:text-indigo-600",
														"h-6 w-6 shrink-0"
													)}
													aria-hidden="true"
												/>
												{item.name}
											</a>
										</li>
									))}
								</ul>
							</li>
						</ul>
					</nav>
				</div>
			</div>
		</div>
	);
}
export default DesktopSideBar;
