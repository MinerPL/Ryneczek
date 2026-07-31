interface TransferData {
	provider: "skillhost" | "icehost" | "pshost";
	account: string;
	amount: number;
	acceptUrl: string;
}

interface IncomingData {
  provider: "skillhost" | "icehost" | "pshost";
  account: string;
  amount: number;
}

export type { TransferData, IncomingData };
