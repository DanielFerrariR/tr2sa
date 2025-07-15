import { CloseEvent, ErrorEvent } from 'ws';
import { SUBSCRIPTION_TYPES } from '../constants';

export interface LoginPayload {
  phoneNumber: string;
  pin: string;
}

export interface VerifySmsPinPayload {
  processId: string;
  smsPin: string;
}

export interface Subscription {
  id?: string;
  after?: string;
  type: SUBSCRIPTION_TYPES;
  token?: string;
}

export interface SplitMessage {
  command: string;
  jsonPayload?: Object;
  subscription?: Subscription;
}

export interface ConnectOptions {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onConnected?: (message: string) => void;
  onMessage?: (message: string, splitMessage: SplitMessage) => void;
  onError?: (event: ErrorEvent) => void;
}
