export type Currency = "RUB" | "EUR" | "USD" | "HUF";

export type CreditCardBalance = {
  id: string;
  date: string;
  amountMinor: number;
};

export type CreditCardMinimumPayment = {
  id: string;
  dueDate: string;
  amountMinor: number;
  paid: boolean;
  archivedAt: string;
};

export type CreditCard = {
  id: string;
  name: string;
  currency: Currency;
  gracePeriodEndDate: string | null;
  gracePaid: boolean;
  minPaymentAssignmentDate: string | null;
  minPaymentDueDate: string | null;
  minPaymentAmountMinor: number | null;
  minPaymentPaid: boolean;
  balances: CreditCardBalance[];
  paymentHistory: CreditCardMinimumPayment[];
};

export type CreditCardInput = Omit<CreditCard, "id" | "balances" | "paymentHistory">;
