import { CloseEvent, ErrorEvent } from 'ws';

export type LoginPayload = {
  phoneNumber: string;
  pin: string;
};

export type VerifySmsPinPayload = {
  processId: string;
  smsPin: string;
};

type SplitMessage<PayloadType = any> = {
  command: string;
  jsonPayload?: PayloadType;
  subscription?: any;
};

export type ConnectOptions = {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onConnected?: (message: string) => void;
  onMessage?: (message: string, splitMessage: SplitMessage) => void;
  onError?: (event: ErrorEvent) => void;
};
