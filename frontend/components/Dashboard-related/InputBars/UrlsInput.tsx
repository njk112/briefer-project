import { isValidYouTubeUrl } from "@/utils/UrlValidation";
import { useState } from "react";

export type UrlsInputProps = {
	youtubeUrl: string | null;
	youtubeUrlList: string[];
	setYoutubeUrl: React.Dispatch<React.SetStateAction<string | null>>;
	setYoutubeUrlList: React.Dispatch<React.SetStateAction<string[]>>;
	title: string;
};

function UrlsInput({
	youtubeUrl,
	youtubeUrlList,
	setYoutubeUrl,
	setYoutubeUrlList,
	title,
}: UrlsInputProps) {
	const [error, setError] = useState<string | null>(null);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setYoutubeUrl(e.target.value);
	};

	const handleEnterKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && youtubeUrl && youtubeUrl !== "") {
			if (isValidYouTubeUrl(youtubeUrl)) {
				setYoutubeUrlList([...youtubeUrlList, youtubeUrl]);
				setYoutubeUrl("");
				setError(null);
			} else {
				setError("The URL is not a valid YouTube URL.");
			}
		}
	};

	const handleDeleteClick = (index: number) => {
		setYoutubeUrlList(youtubeUrlList.filter((_, i) => i !== index));
	};
	return (
		<div className="pb-3">
			<label
				htmlFor="youtubeUrls"
				className="block text-sm font-medium leading-6 text-gray-900"
			>
				{title}
			</label>
			<input
				className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
				value={youtubeUrl || ""}
				name="youtubeUrls"
				placeholder="Add a youtube url and press enter"
				onChange={handleInputChange}
				onKeyDown={handleEnterKeyPress}
				type="text"
			/>
			{error && <p className="text-red-500">{error}</p>}
			{youtubeUrlList.map((str, index) => (
				<div key={index}>
					<span
						className="mr-1 cursor-pointer"
						onClick={() => handleDeleteClick(index)}
					>
						✖️
					</span>
					{str}
				</div>
			))}
		</div>
	);
}
export default UrlsInput;
