import { apiMessages } from "@/app.config";
import { emailValidation } from "@/utils/EmailValidation";
import { isValidYouTubeUrl } from "@/utils/UrlValidation";
import { NextRequest, NextResponse } from "next/server";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL as string,
	token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

const ratelimit = new Ratelimit({
	redis: redis,
	limiter: Ratelimit.fixedWindow(2, "15 m"),
});

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
	const limiter = await ratelimit.limit(email);
	if (limiter.success === false) {
		return NextResponse.json(
			{ message: apiMessages.summary["415"] },
			{ status: 429 }
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
	try {
		const backendRes = await fetch(
			`${process.env.BACKEND_ENDPOINT}/youtube/queue`,
			{
				method: "POST",
				body: JSON.stringify({ userEmail: email, urls: youtubeUrls }),
				headers: {
					"Content-Type": "application/json",
					Authorization: `${process.env.BACKEND_TOKEN}`,
				},
			}
		);
		const response = await backendRes.json();
		const data = {
			message: response.message,
			status: 200,
			headers: {
				"X-RateLimit-Limit": `${limiter.limit}`,
				"X-RateLimit-Remaining": `${limiter.remaining}`,
			},
		};
		return NextResponse.json(data);
	} catch (error) {
		return NextResponse.json(
			{ message: apiMessages.summary["500"] },
			{ status: 500 }
		);
	}
}
