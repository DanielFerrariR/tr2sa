import { TRANSATION_EVENT_TYPE } from '../../tradeRepublicApi/constants';

export interface Action {
  type: string;
  payload: any;
  overrideAction?: any;
}

export interface Detail {
  text?: string;
  action?: Action;
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

export interface DataObject {
  title: string;
  detail: Detail;
  style: string;
  action?: Action;
  id?: string;
  postboxType?: string;
}

export interface HeaderSection {
  title: string;
  data: {
    icon: string;
    timestamp: string;
    status: string;
    subtitleText?: string | null;
  };
  type: 'header';
  action?: Action;
}

export interface TableSection {
  title?: string;
  data: DataObject[];
  type: 'table';
}

export interface NoteSection {
  data: {
    text: string;
  };
  type: 'note';
}

export interface Step {
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

export interface StepsSection {
  title: string;
  steps: Step[];
  type: 'steps';
}

export interface Document {
  title: string;
  action: Action;
  id: string;
  postboxType: string;
  detail?: null;
}

export interface DocumentsSection {
  title: string;
  data: Document[];
  type: 'documents';
}

export interface BannerSection {
  title: string;
  description: string;
  type: 'banner';
  actionableTitle?: {
    title: string;
    action: Action;
  };
  button?: {
    title: string;
    action: Action;
  };
}

export type Section =
  | HeaderSection
  | TableSection
  | NoteSection
  | StepsSection
  | DocumentsSection
  | BannerSection;

export interface TransactionDetailsResponse {
  id: string;
  sections: Section[];
}

export interface Amount {
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
  amount: Amount;
  subAmount: any;
  status: string;
  action: Action;
  eventType: TRANSATION_EVENT_TYPE;
  cashAccountNumber: string | null;
  hidden: boolean;
  deleted: boolean;
  sections?: Section[]; // Added later to the transaction
}

export interface TransactionResponse {
  items: Transaction[];
  cursors: { after: string | null; before: string | null };
  startingTransactionId: null;
}
