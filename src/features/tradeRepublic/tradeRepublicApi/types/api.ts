import { CloseEvent, ErrorEvent } from 'ws';
import { SUBSCRIPTION_TYPES } from '../constants';

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
  jsonPayload?: PayloadType;
  subscriptionType?: SUBSCRIPTION_TYPES;
};

export type ConnectOptions = {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onConnected?: (message: string) => void;
  onMessage?: (message: string, splitMessage: SplitMessage) => void;
  onError?: (event: ErrorEvent) => void;
};
