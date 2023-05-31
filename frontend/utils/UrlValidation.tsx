export function isValidYouTubeUrl(url: string) {
	const pattern = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;
	return pattern.test(url);
}
