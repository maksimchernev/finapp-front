export type ProgressHandler = (progress: number, message: string) => void;

export type TransactionType = "expense" | "income";

export type AmountCandidate = {
  amount: number;
  currency: string;
  hasDecimal: boolean;
  hasExplicitSign: boolean;
  inferredDecimal: boolean;
  source: string;
};

export type LineAmountCandidate = AmountCandidate & {
  index: number;
};
