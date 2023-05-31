import { emailValidation } from "@/utils/EmailValidation";
import { useState } from "react";

export type EmailInputProps = {
	email: string | null;
	title: string;
	setEmail: (email: string) => void;
	errorText: string;
};

function EmailInput({ email, setEmail, title, errorText }: EmailInputProps) {
	const [isValidEmail, setIsValidEmail] = useState(true);

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
		setIsValidEmail(emailValidation(e.target.value));
	};
	return (
		<div className="pb-3">
			<label
				htmlFor="email"
				className="block text-sm font-medium leading-6 text-gray-900"
			>
				{title}
			</label>
			<div className="mt-2">
				<input
					type="email"
					name="email"
					id="email"
					value={email || ""}
					onChange={handleEmailChange}
					className="block w-full rounded-md border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
					placeholder="you@example.com"
					aria-describedby="email-description"
				/>
				{!isValidEmail && <div className="text-red-500">{errorText}</div>}
			</div>
		</div>
	);
}
export default EmailInput;
