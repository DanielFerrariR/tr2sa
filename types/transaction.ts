import { TRANSATION_EVENT_TYPE } from '../src/constants/transactions';

interface SectionHeader {
  title: string; // Looks like a generic field like "You invested €101.00"
  data: {
    icon: string;
    subtitleText: null;
    timestamp: string;
    status: string;
  };
  action: {
    payload: string;
    type: string;
    overrideAction: null;
  };
  type: 'header';
}

interface OverviewSection {
  title: 'Overview';
  data: {
    title: string;
    detail:
      | {
          text: string;
          trend: null;
          action: {
            payload: {
              id: string;
              sections: {
                title: string;
                action: null;
                data?: {
                  title: string;
                  detail: {
                    text: string;
                    trend: null;
                    action: null;
                    displayValue: null;
                    type: 'text';
                  };
                  style: 'plain';
                }[];
                type: 'title';
              } | null;
            };
            displayValue?: { text: string; prefix: string };
            type: 'text';
          };
        }
      | {
          text: string; // Header has a generic text like "You invested €101.00"
          functionalStyle: string;
          action: null;
          type: 'status';
        };
    style: 'plain';
  }[];
  action: null;
  type: 'table';
}

interface DocumentsSection {
  title: 'Documents';
  data: {
    title: string;
    detail: null;
    action: {
      payload: string;
      type: string;
      overrideAction: null;
    };
    id: string;
    postboxType: string;
  }[];
  action: null;
  type: 'documents';
}

interface SupportSection {
  title: string;
  data: {
    title: string;
    detail: {
      icon: string;
      action: {
        payload: {
          contextCategory: string;
          contextParams: {
            chat_flow_key: string;
            timelineEventId: string;
            groupId: string;
          };
        };
        type: string;
        overrideAction: null;
      };
      style: string;
      type: string;
    };
    style: 'plain';
  }[];
  action: null;
  type: 'table';
}

type TransactionDetails =
  | SectionHeader
  | OverviewSection
  | DocumentsSection
  | SupportSection;

export interface TransactionDetailsResponse {
  id: string;
  sections: TransactionDetails[];
}

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
  sections?: (
    | SectionHeader
    | OverviewSection
    | DocumentsSection
    | SupportSection
  )[]; // Added later to the transaction
}

export interface TransactionResponse {
  items: Transaction[];
  cursors: { after: string | null; before: string | null };
  startingTransactionId: null;
}
