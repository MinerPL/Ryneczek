interface TransferData {
	provider: "skillhost" | "icehost";
	account: string;
	amount: number;
	acceptUrl: string;
}

export type { TransferData };
