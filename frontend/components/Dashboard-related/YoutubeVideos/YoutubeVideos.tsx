"use client";
import { useState } from "react";
import EmailInput from "../InputBars/EmailInput";
import UrlsInput from "../InputBars/UrlsInput";
import { textConfig } from "@/text.config";
import PositiveAlert from "../Alerts/PositiveAlert/PositiveAlert";
import NegativeAlert from "../Alerts/NegativeAlert/NegativeAlert";

export default function AddVideos() {
	const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
	const [youtubeUrlList, setYoutubeUrlList] = useState<string[]>([]);
	const [email, setEmail] = useState<string | null>(null);
	const [showAlert, setShowAlert] = useState<boolean>(false);
	const [isErrorAlert, setIsErrorAlert] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSendRequest = async () => {
		const res = await fetch("/api/summary", {
			method: "POST",
			body: JSON.stringify({
				email: email,
				youtubeUrls: youtubeUrlList,
			}),
		});
		const data = await res.json();
		if (data.status === 200) {
			console.log("Success");
			setYoutubeUrlList([]);
		} else {
			setIsErrorAlert(true);
			setErrorMessage(data.message);
		}

		setShowAlert(true);
	};

	const handleAlert = () => {
		setShowAlert(false);
		setIsErrorAlert(false);
	};

	return (
		<div>
			<EmailInput
				email={email}
				setEmail={setEmail}
				{...textConfig.dashboard.emailInput}
			/>
			<UrlsInput
				youtubeUrl={youtubeUrl}
				setYoutubeUrl={setYoutubeUrl}
				youtubeUrlList={youtubeUrlList}
				setYoutubeUrlList={setYoutubeUrlList}
				{...textConfig.dashboard.urlsInput}
			/>

			{!showAlert && (
				<button
					onClick={handleSendRequest}
					type="button"
					className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				>
					{textConfig.dashboard.dashboard.sendButton}
				</button>
			)}
			{showAlert && !isErrorAlert && (
				<PositiveAlert
					callback={handleAlert}
					{...textConfig.dashboard.positiveAlert}
				/>
			)}
			{showAlert && isErrorAlert && (
				<NegativeAlert
					callback={handleAlert}
					errorMessage={errorMessage}
					{...textConfig.dashboard.negativeAlert}
				/>
			)}
		</div>
	);
}
