import { CloseEvent, ErrorEvent } from 'ws';

export type LoginPayload = {
  phoneNumber: string;
  pin: string;
};

export type VerifySmsPinPayload = {
  processId: string;
  smsPin: string;
};

export type ConnectOptions = {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onConnected?: (message: string) => void;
  onMessage?: (message: string) => void;
  onError?: (event: ErrorEvent) => void;
};
