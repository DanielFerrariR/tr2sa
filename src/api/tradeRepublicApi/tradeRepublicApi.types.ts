import { CloseEvent, ErrorEvent } from 'ws';
import {
  TransactionDetailsResponse,
  TransactionResponse,
} from '../../../types';

export type LoginPayload = {
  phoneNumber: string;
  pin: string;
};

export type VerifySmsPinPayload = {
  processId: string;
  smsPin: string;
};

type SplitMessage<PayloadType = any> = {
  subscriptionId: string;
  command: string;
  jsonPayload: PayloadType;
};

export type ConnectOptions = {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onConnected?: (message: string) => void;
  onMessage?: (message: string, splitMessage: SplitMessage) => void;
  onTransactionMessage?: (
    message: string,
    splitMessage: SplitMessage<TransactionResponse>,
  ) => void;
  onTransactionDetailsMessage?: (
    message: string,
    splitMessage: SplitMessage<TransactionDetailsResponse>,
  ) => void;
  onError?: (event: ErrorEvent) => void;
};
