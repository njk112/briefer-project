import { apiMessages } from "@/text.config";
import { emailValidation } from "@/utils/EmailValidation";
import { isValidYouTubeUrl } from "@/utils/UrlValidation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { email, youtubeUrls } = await request.json();
	if (!email || !youtubeUrls) {
		return NextResponse.json(
			{ message: apiMessages.summary["417"] },
			{ status: 417 }
		);
	}
	if (emailValidation(email) === false) {
		return NextResponse.json(
			{ message: apiMessages.summary["418"] },
			{ status: 418 }
		);
	}
	if (youtubeUrls.length > 5) {
		return NextResponse.json(
			{ message: apiMessages.summary["419"] },
			{ status: 419 }
		);
	}
	youtubeUrls.forEach((url: string) => {
		if (!isValidYouTubeUrl(url)) {
			return NextResponse.json(
				{ message: apiMessages.summary["416"] },
				{ status: 416 }
			);
		}
	});
	const data = { message: "Hello World!", status: 200 };

	return NextResponse.json(data);
}
