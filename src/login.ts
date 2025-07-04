import axios, { AxiosInstance } from 'axios';
import readlineSync from 'readline-sync';
import { Cookie, CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

export const TR_API_URL = 'https://api.traderepublic.com';

export async function login(): Promise<string | undefined> {
  const BASE_URL = TR_API_URL;
  const cookieJar = new CookieJar();

  const client: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
  });

  wrapper(client);
  client.defaults.jar = cookieJar;

  console.log('Starting Trade Republic login process...');

  const phoneNumber = readlineSync.question(
    'Please enter your phone number (e.g., +491234567890): '
  );
  const pin = readlineSync.question('Please enter your 4-digit PIN: ', {
    hideEchoBack: true,
  });

  let processId: string;
  try {
    console.log('Sending initial login request...');
    const response = await client.post('/api/v1/auth/web/login', {
      phoneNumber: phoneNumber,
      pin: pin,
    });

    if (response.data && response.data.processId) {
      processId = response.data.processId;
      console.log(`Initial login successful. Process ID: ${processId}`);
      console.log(
        `Countdown for SMS PIN: ${response.data.countdownInSeconds} seconds`
      );
      console.log(`2FA Method: ${response.data['2fa']}`);
    } else {
      console.error(
        'Initial login response did not contain processId. Response:',
        response.data
      );
      return undefined;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error during initial login: ${error.message}`);
      console.error('Response data:', error.response?.data);
    } else {
      console.error(
        'An unexpected error occurred during initial login:',
        error
      );
    }
    return undefined;
  }

  const smsPin = readlineSync.question(
    'Please enter the 4-digit PIN you received via SMS: '
  );

  try {
    console.log(`Verifying SMS PIN for process ID: ${processId}...`);
    const smsVerificationUrl = `/api/v1/auth/web/login/${processId}/${smsPin}`;
    await client.post(smsVerificationUrl);

    console.log('SMS PIN verification successful.');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error during SMS PIN verification: ${error.message}`);
      console.error('Response data:', error.response?.data);
      console.error('Ensure the SMS PIN is correct and entered promptly.');
    } else {
      console.error(
        'An unexpected error occurred during SMS PIN verification:',
        error
      );
    }
    return;
  }

  try {
    const cookies: Cookie[] = await cookieJar.getCookies(TR_API_URL);
    const trSessionCookie = cookies.find(
      (cookie) => cookie.key === 'tr_session'
    );

    if (trSessionCookie) {
      const trSessionToken = trSessionCookie.value;
      console.log('Extracted tr_session token.');
      return trSessionToken;
    } else {
      console.error('Error: tr_session cookie not found after login.');
      return;
    }
  } catch (error) {
    console.error('Error extracting cookies:', error);
    return;
  }
}
