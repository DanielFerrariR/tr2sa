import { TRANSATION_EVENT_TYPE } from '../../tradeRepublicApi/constants';

export interface TransactionAction {
  type: string;
  payload: any;
  overrideAction?: any;
}

export interface TransactionDetail {
  text?: string;
  action?: TransactionAction;
  type: string;
  icon?: string;
  style?: string;
  functionalStyle?: string;
  displayValue?: {
    text: string;
    prefix: string;
  };
  title?: string;
  timestamp?: string;
  amount?: string;
  status?: string;
  subtitle?: string;
  content?: {
    type: string;
    title: string;
    truncate: boolean;
  };
  trailing?: {
    type: string;
  };
}

export interface TransactionDataObject {
  title: string;
  detail: TransactionDetail;
  style: string;
  action?: TransactionAction;
  id?: string;
  postboxType?: string;
}

export interface TransactionHeaderSection {
  title: string;
  data: {
    icon: string;
    timestamp: string;
    status: string;
    subtitleText?: string | null;
  };
  type: 'header';
  action?: TransactionAction;
}

export interface TransactionTableSection {
  title?: string;
  data: TransactionDataObject[];
  type: 'table';
}

export interface TransactionNoteSection {
  data: {
    text: string;
  };
  type: 'note';
}

export interface TransactionStep {
  leading: {
    avatar: {
      status: string;
      type: string;
    };
    connection: {
      order: string;
    };
  };
  content: {
    title: string;
    subtitle: string | null;
    timestamp: string;
    cta: any;
  };
}

export interface TransactionStepsSection {
  title: string;
  steps: TransactionStep[];
  type: 'steps';
}

export interface TransactionDocument {
  title: string;
  action: TransactionAction;
  id: string;
  postboxType: string;
  detail?: null;
}

export interface TransactionDocumentsSection {
  title: string;
  data: Document[];
  type: 'documents';
}

export interface TransactionBannerSection {
  title: string;
  description: string;
  type: 'banner';
  actionableTitle?: {
    title: string;
    action: TransactionAction;
  };
  button?: {
    title: string;
    action: TransactionAction;
  };
}

export type TransactionSection =
  | TransactionHeaderSection
  | TransactionTableSection
  | TransactionNoteSection
  | TransactionStepsSection
  | TransactionDocumentsSection
  | TransactionBannerSection;

export interface TransactionDetailsResponse {
  id: string;
  sections: TransactionSection[];
}

export interface TransactionAmount {
  currency: string;
  value: number;
  fractionDigits: number;
}

export interface Transaction {
  id: string;
  timestamp: string;
  title: string;
  icon: string;
  badge: any;
  subtitle: string | null;
  amount: TransactionAmount;
  subAmount: any;
  status: string;
  action: TransactionAction;
  eventType: TRANSATION_EVENT_TYPE;
  cashAccountNumber: string | null;
  hidden: boolean;
  deleted: boolean;
  sections?: TransactionSection[]; // Added later to the transaction
}

export interface TransactionResponse {
  items: Transaction[];
  cursors: { after: string | null; before: string | null };
  startingTransactionId: null;
}
