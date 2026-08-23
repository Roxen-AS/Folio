export type TxStatus = "pending" | "reconciled" | "flagged";

export interface Transaction {
  id: string;
  vendor: string;
  amount: number;
  priorAmount: number | null;
  category: string;
  confidence: number;
  status: TxStatus;
  reason?: string;
}

export interface AnalyzeResponse {
  transactions: Transaction[];
  memo: string[];
}
