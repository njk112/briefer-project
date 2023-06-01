"use client";
import { useState } from "react";
import UrlsInput from "@components/Dashboard-related/InputBars/UrlsInput";
import { textConfig } from "@/app.config";
import PositiveAlert from "@components/Dashboard-related/Alerts/PositiveAlert/PositiveAlert";
import NegativeAlert from "@components/Dashboard-related/Alerts/NegativeAlert/NegativeAlert";
import EmailInput from "@components/Dashboard-related/InputBars/EmailInput";
import { classNames } from "@/utils/ClassNames";

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
					disabled={youtubeUrlList.length === 0 || email === null}
					className={classNames(
						youtubeUrlList.length === 0 || email === null
							? "bg-indigo-400"
							: "bg-indigo-600",
						"rounded-md  px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
					)}
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
