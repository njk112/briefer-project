import { XCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";

export type NegativeAlertProps = {
	callback: () => void;
	errorMessage: string | null;
	close: string;
};

export default function NegativeAlert({
	callback,
	errorMessage,
	close,
}: NegativeAlertProps) {
	return (
		<div className="rounded-md bg-red-50 p-4">
			<div className="flex">
				<div className="flex-shrink-0">
					<XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
				</div>
				<div className="ml-3">
					<h3 className="text-sm font-medium text-red-800">{errorMessage}</h3>
				</div>
				<div className="ml-auto pl-3">
					<div className="-mx-1.5 -my-1.5">
						<button
							onClick={() => callback()}
							type="button"
							className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
						>
							<span className="sr-only">{close}</span>
							<XMarkIcon className="h-5 w-5" aria-hidden="true" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
