import { Cookie, CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  ConnectOptions,
  LoginPayload,
  VerifySmsPinPayload,
} from './tradeRepublicApi.types';
import { CONNECTION_STATUS } from './tradeRepublicApi.constants';
import WebSocket from 'ws';

export class TradeRepublicAPI {
  private static instance: TradeRepublicAPI;
  private _cookieJar: CookieJar;
  private _client: AxiosInstance;
  private _webSocket: WebSocket | undefined;
  private _sessionToken: string | undefined;

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

  public connect({
    onOpen,
    onClose,
    onConnected,
    onMessage,
    onError,
  }: ConnectOptions = {}) {
    this._webSocket = new WebSocket(process.env.TRADE_REPUBLIC_WEBSOCKET_URL!);

    this._webSocket.onopen = async () => {
      this._webSocket!.send(
        'connect 31 {"locale":"en","platformId":"webtrading","platformVersion":"Chrome/136.0.0.0","clientId":"app.traderepublic.com","clientVersion":"3.282.0"}',
      );
      onOpen?.();
    };

    this._webSocket.onmessage = (event) => {
      const message = event.data.toString();
      if (message === 'connected') {
        onConnected?.(message);
        return;
      }
      onMessage?.(message);
    };

    this._webSocket.onclose = (event) => {
      onClose?.(event);
    };

    this._webSocket.onerror = (event) => {
      onError?.(event);
    };
  }

  public sendMessage(message: string) {
    if (!this._webSocket) {
      console.warn('WebSocket is not connected.');
      return;
    }

    // To always include the token if the message has a format like: sub 1 {"type":"availableCash"}
    const parts = message.trim().split(' ');
    if (parts.length >= 2 && parts[0].toLowerCase() === 'sub') {
      try {
        const subscriptionId = parts[1];
        const jsonString = parts.slice(2).join(' ');
        const parsedJson = JSON.parse(jsonString);
        parsedJson.token = this._sessionToken;
        message = `sub ${subscriptionId} ${JSON.stringify(parsedJson)}`;
        console.log(message);
      } catch (e) {
        console.warn(
          "Could not parse subscription message for token injection. Ensure it's valid JSON.",
          e,
        );
      }
    }
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
