import { TRANSATION_EVENT_TYPE } from '../src/constants/transactions';

export interface Transaction {
  id: string;
  timestamp: string;
  title: string;
  icon: string;
  badge: string | null;
  subtitle: string;
  amount: {
    currency: string;
    value: number;
    fractionDigits: number;
  };
  subAmount: {
    currency: string;
    value: number;
    fractionDigits: number;
  } | null;
  status: string;
  action: {
    type: string;
    payload: string;
  };
  eventType: TRANSATION_EVENT_TYPE;
  cashAccountNumber: string;
  hidden: boolean;
  deleted: boolean;
}

export interface TransactionResponse {
  items: Transaction[];
  cursors: { after: string | null; before: string | null };
  startingTransactionId: null;
}
