import readlineSync from 'readline-sync';
import { TradeRepublicAPI } from '../tradeRepublicApi';

export async function login(): Promise<boolean> {
  console.log('Starting Trade Republic login process...');

  const phoneNumber = readlineSync.question(
    'Please enter your telephone number (with country code, e.g., +491234567890): ',
  );
  const pin = readlineSync.question('Please enter your 4-digit PIN: ');

  let processId: string;

  try {
    console.log('Sending initial login request...');
    const response = await TradeRepublicAPI.getInstance().login({
      phoneNumber,
      pin,
    });

    if (response.data && response.data.processId) {
      processId = response.data.processId;
      console.log(`Initial login successful. Process ID: ${processId}`);
      console.log(
        `Countdown for SMS PIN: ${response.data.countdownInSeconds} seconds`,
      );
      console.log(`2FA Method: ${response.data['2fa']}`);
    } else {
      console.error(
        'Initial login response did not contain processId. Response:',
        response.data,
      );
      return false;
    }
  } catch (error) {
    if (TradeRepublicAPI.isApiError(error)) {
      console.error(`Error during initial login: ${error.message}`);
      console.error('Response data:', error.response?.data);
    } else {
      console.error(
        'An unexpected error occurred during initial login:',
        error,
      );
    }
    return false;
  }

  const smsPin = readlineSync.question(
    'Please enter the 4-digit PIN you received via SMS: ',
  );

  try {
    console.log(`Verifying SMS PIN for process ID: ${processId}...`);
    await TradeRepublicAPI.getInstance().verifySmsPin({ processId, smsPin });
    console.log('SMS PIN verification successful.');
    console.error('Login sucessful.');
    return true;
  } catch (error) {
    if (TradeRepublicAPI.isApiError(error)) {
      console.error(`Error during SMS PIN verification: ${error.message}`);
      console.error('Response data:', error.response?.data);
      console.error('Ensure the SMS PIN is correct and entered promptly.');
    } else {
      console.error(
        'An unexpected error occurred during SMS PIN verification:',
        error,
      );
    }
    console.error('Login failed. Exiting.');
    return false;
  }
}
