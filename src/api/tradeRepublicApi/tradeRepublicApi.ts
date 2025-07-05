import { Cookie, CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios, { AxiosInstance } from 'axios';
import {
  ConnectOptions,
  LoginPayload,
  VerifySmsPinPayload,
} from './tradeRepublicApi.types';
import {
  RECEIVED_COMMAND_TYPES,
  CONNECTION_MESSAGE,
  CONNECTION_STATUS,
  SUBSCRIPTION_TYPES,
} from './tradeRepublicApi.constants';
import WebSocket from 'ws';

export class TradeRepublicAPI {
  private static instance: TradeRepublicAPI;
  private _cookieJar: CookieJar;
  private _client: AxiosInstance;
  private _webSocket: WebSocket | undefined;
  private _sessionToken: string | undefined;
  private _subscriptionId = 1;
  private _subscriptions: { [key: number]: SUBSCRIPTION_TYPES } = {};

  private constructor() {
    this._cookieJar = new CookieJar();
    this._client = axios.create({
      baseURL: process.env.TRADE_REPUBLIC_API_URL,
      withCredentials: true,
    });
    wrapper(this._client);
    this._client.defaults.jar = this._cookieJar;
  }

  public static getInstance(): TradeRepublicAPI {
    if (!TradeRepublicAPI.instance) {
      TradeRepublicAPI.instance = new TradeRepublicAPI();
    }
    return TradeRepublicAPI.instance;
  }

  public static isApiError(error: unknown) {
    return axios.isAxiosError(error);
  }

  public login({ phoneNumber, pin }: LoginPayload) {
    return this._client.post('/api/v1/auth/web/login', {
      phoneNumber,
      pin,
    });
  }

  public async verifySmsPin({ processId, smsPin }: VerifySmsPinPayload) {
    await this._client.post(`/api/v1/auth/web/login/${processId}/${smsPin}`);
    // Get the session token from cookies after login
    const cookies: Cookie[] = await this._cookieJar.getCookies(
      process.env.TRADE_REPUBLIC_API_URL!,
    );
    this._sessionToken = cookies.find(
      (cookie) => cookie.key === 'tr_session',
    )?.value;
  }

  public sendTransactionsMessage(after?: string) {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    const jsonPayload = {
      type: SUBSCRIPTION_TYPES.TRANSACTIONS,
      after,
      token: this._sessionToken,
    };

    this._webSocket.send(
      `sub ${this._subscriptionId} ${JSON.stringify(jsonPayload)}`,
    );
    this._subscriptions[this._subscriptionId] = SUBSCRIPTION_TYPES.TRANSACTIONS;
    this._subscriptionId++;
  }

  public sendTransactionDetailsMessage(transactionId: string) {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    const jsonPayload = {
      type: SUBSCRIPTION_TYPES.TRANSACTION_DETAILS,
      id: transactionId,
      token: this._sessionToken,
    };

    this._webSocket.send(
      `sub ${this._subscriptionId} ${JSON.stringify(jsonPayload)}`,
    );
    this._subscriptions[this._subscriptionId] =
      SUBSCRIPTION_TYPES.TRANSACTION_DETAILS;
    this._subscriptionId++;
  }

  public connect({
    onOpen,
    onClose,
    onConnected,
    onMessage,
    onTransactionMessage,
    onTransactionDetailsMessage,
    onError,
  }: ConnectOptions = {}) {
    this._webSocket = new WebSocket(process.env.TRADE_REPUBLIC_WEBSOCKET_URL!);

    this._webSocket.onopen = async () => {
      this._webSocket!.send(CONNECTION_MESSAGE);
      onOpen?.();
    };

    this._webSocket.onmessage = (event) => {
      const message = event.data.toString();

      if (message === 'connected') {
        onConnected?.(message);
        return;
      }

      let jsonPayload: any;

      const [subscriptionId, command] = message.split(' ', 2);
      let jsonMatch = message.match(/\{.*\}/s);

      try {
        // jsonMatch might be undefined if command is keep-alive
        if (jsonMatch) jsonPayload = JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.warn('Failed to parse JSON payload:', error);
      }

      // Handle transaction messages
      if (
        this._subscriptions[Number(subscriptionId)] ===
        SUBSCRIPTION_TYPES.TRANSACTIONS
      ) {
        onTransactionMessage?.(message, {
          subscriptionId,
          command,
          jsonPayload,
        });
        return;
      }

      // Handle transaction details messages
      if (
        this._subscriptions[Number(subscriptionId)] ===
        SUBSCRIPTION_TYPES.TRANSACTION_DETAILS
      ) {
        onTransactionDetailsMessage?.(message, {
          subscriptionId,
          command,
          jsonPayload,
        });
        return;
      }

      onMessage?.(message, {
        subscriptionId,
        command,
        jsonPayload,
      });
    };

    this._webSocket.onclose = (event) => {
      onClose?.(event);
    };

    this._webSocket.onerror = (event) => {
      onError?.(event);
    };

    this;
  }

  public sendMessage(message: string) {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    // To always include the token if the message has a format like: sub 1 {"type":"availableCash"}
    try {
      const [command, subscriptionId] = message.split(' ', 2);
      let jsonMatch = message.match(/\{.*\}/s);
      if (!jsonMatch) throw new Error('No JSON payload found in message');
      const jsonPayload = JSON.parse(jsonMatch![0]);
      jsonPayload.token = this._sessionToken;
      message = `${command} ${subscriptionId} ${JSON.stringify(jsonPayload)}`;
    } catch (error) {
      console.warn(
        "Could not parse subscription message for token injection. Ensure it's valid JSON.",
        error,
      );
    }

    console.log('Sending message:', message);

    this._webSocket?.send(message);
  }

  public disconnect() {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    this._webSocket.close();
    this._webSocket = undefined;
  }

  public getConnectionStatus() {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    let status = CONNECTION_STATUS.UNKNOWN;
    Object.values(CONNECTION_STATUS).forEach((value) => {
      if (this._webSocket!.readyState === value) {
        status = value;
      }
    });
    return status;
  }
}
