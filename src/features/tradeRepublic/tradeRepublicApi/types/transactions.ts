import { TRANSATION_EVENT_TYPE } from '../../tradeRepublicApi/constants';

export interface SectionHeader {
  title: string; // "You invested €11.32"
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

export interface OverviewSection {
  title: 'Overview';
  data: (
    | {
        title: 'Round up';
        detail: {
          text: string;
          functionalStyle: string;
          type: 'status';
        };
        style: 'plain';
      }
    | {
        title: 'Event';
        detail: {
          text: string;
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Asset';
        detail: {
          text: string;
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Transaction';
        detail: {
          text: '';
          displayValue: {
            text: string; // "€82.39"
            prefix: string; // "0.137395 x "
          };
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Fee';
        detail: {
          text: string; // "Free" or "€0.00"
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Total';
        detail: {
          text: string; // "€11.32"
          type: 'text';
        };
        style: 'highlighted';
      }
  )[];
  action: null;
  type: 'table';
}

// This only exists in TRANSATION_EVENT_TYPE.TIMELINE_LEGACY_MIGRATED_EVENTS,
// so maybe it will be removed in the future
export interface LegacySavingsPlanSection {
  title: 'Savings plan';
  data: [
    {
      title: string;
      detail: {
        title: string;
        timestamp: string;
        amount: string;
        icon: string;
        status: string;
        action: {
          type: string;
          payload: {
            savingsPlanId: string;
          };
        };
        subtitle: string;
        type: string;
      };
      style: 'plain';
    },
  ];
  action: null;
}

// This only exists in TRANSATION_EVENT_TYPE.TIMELINE_LEGACY_MIGRATED_EVENTS,
// so maybe it will be removed in the future
export interface LegagyTrasactionSection {
  title: 'Transaction';
  data: (
    | {
        title: 'Shares';
        detail: {
          text: string; // "0.373692"
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Share price';
        detail: {
          text: string; // "€133.80"
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Fee';
        detail: {
          text: string; // "Free" or "€0.00"
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Total';
        detail: {
          text: string; // "€50.00"
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'highlighted';
      }
  )[];
  action: null;
  type: 'table';
}

// This only exists in TRANSATION_EVENT_TYPE.TIMELINE_LEGACY_MIGRATED_EVENTS,
// so maybe it will be removed in the future
export interface LegacyPerformanceSection {
  title: 'Performance';
  data: [
    {
      title: 'Profit';
      detail: {
        text: string; // "5.37 %"
        trend: string; // "positive"
        action: null;
        displayValue: null;
        type: 'text';
      };
      style: 'plain';
    },
    {
      title: 'Gain';
      detail: {
        text: string; // "€19.61"
        trend: string; // "positive"
        action: null;
        displayValue: null;
        type: 'text';
      };
      style: 'plain';
    },
  ];
  action: null;
  type: 'horizontalTable';
}

export interface DocumentsSection {
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

export interface StatusSection {
  title: 'Status';
  steps: [
    {
      leading: {
        avatar: { status: string; type: string };
        connection: { order: string };
      };
      content: {
        title: string;
        timestamp: string;
      };
    },
    {
      leading: {
        avatar: { status: string; type: string };
        connection: { order: string };
      };
      content: {
        title: string;
        timestamp: string;
      };
    },
  ];
  type: 'steps';
}

export interface TransactionSection {
  title: 'Transaction';
  data: (
    | {
        title: 'Shares';
        detail: {
          text: string; // 12.944137
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Dividend per share';
        detail: {
          text: string; // $0.27
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Tax';
        detail: {
          text: string; // €0.45
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'plain';
      }
    | {
        title: 'Total';
        detail: {
          text: string; // €2.55'
          trend: null;
          action: null;
          displayValue: null;
          type: 'text';
        };
        style: 'plain';
      }
  )[];
  type: 'table';
}

export interface SupportSection {
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

export interface MoreSetion {
  title: 'More';
  data: [
    {
      title: string;
      detail: {
        icon: string;
        action: {
          type: string;
          payload: {
            link: string;
          };
        };
        style: string;
        type: string;
      };
      style: 'plain';
    },
  ];
  type: 'table';
}

export type TransactionDetails =
  | SectionHeader
  | OverviewSection
  | DocumentsSection
  | StatusSection
  | TransactionSection
  | MoreSetion
  | SupportSection
  | LegacySavingsPlanSection
  | LegagyTrasactionSection
  | LegacyPerformanceSection;

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
  status: 'EXECUTED' | 'CANCELED';
  action: {
    type: string;
    payload: string;
  };
  eventType: TRANSATION_EVENT_TYPE;
  cashAccountNumber: string;
  hidden: boolean;
  deleted: boolean;
  sections?: TransactionDetails[]; // Added later to the transaction
}

export interface TransactionResponse {
  items: Transaction[];
  cursors: { after: string | null; before: string | null };
  startingTransactionId: null;
}
