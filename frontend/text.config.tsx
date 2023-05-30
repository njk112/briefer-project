import {
	ClockIcon,
	UserCircleIcon,
	VideoCameraIcon,
} from "@heroicons/react/20/solid";

export const textConfig = {
	landingPage: {
		heroSection: {
			title: "Briefer. Summarise your content.",
			paragraph:
				"Briefer transforms long YouTube videos into concise PDF summaries. Save time and focus on essential insights. Discover Briefer - your shortcut to efficient learning.",
			getStartedButton: "Get started",
			learnMoreButton: "Learn more",
		},
		featureSection: {
			subTitle: "How it works",
			title: "Quickest way to summarise YouTube videos.",
			paragraph:
				"Briefer uses advanced AI to create concise summaries of lengthy YouTube videos. Get well-structured, ready-to-read summaries in PDF format, perfect for sharing and offline reading.",
		},
		footer: {
			text: `${new Date().getFullYear()} Briefer. All rights reserved.`,
		},
		header: {
			company: "Briefer",
			mainMenu: "Open main menu",
			closeMenu: "Close menu",
			logoLink: "",
		},
	},
	dashboard: {
		mobileSideBar: {
			closeSideBar: "Close sidebar",
			openSideBar: "Open sidebar",
			title: "Youtube Summaries",
		},
		emailInput: {
			title: "Email",
			errorText: "Please enter a valid email address.",
		},
		urlsInput: {
			title: "Youtube Urls",
		},
		positiveAlert: {
			title: "Your request has been submitted successfully.",
			close: "Dismiss",
		},
		negativeAlert: {
			close: "Dismiss",
		},
		dashboard: {
			sendButton: "Send",
		},
	},
};

export const apiMessages = {
	summary: {
		"200": "Success",
		"416": "Please enter a valid YouTube url.",
		"417": "Email or Youtube urls are empty",
		"418": "Please enter a valid email address.",
		"419": "You can only summarize up to 5 videos at a time.",
	},
};

export const featureConfig = {
	features: [
		{
			name: "Time-saving",
			description:
				"No need to watch hours of content. Get key insights quickly with our comprehensive summaries.",
			icon: ClockIcon,
		},
		{
			name: "Unlimited Videos",
			description:
				"Add as many videos as you like and we will summarize them for you.",
			icon: VideoCameraIcon,
		},
		{
			name: "User-friendly",
			description:
				"With a simple and intuitive interface, Briefer is designed to make video summarizing a breeze.",
			icon: UserCircleIcon,
		},
	],
};

export const navigation = [
	{ name: "Youtube Summaries", href: "youtube-summaries" },
];
