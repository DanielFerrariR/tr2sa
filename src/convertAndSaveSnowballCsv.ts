import fs from 'fs';
import path from 'path';
import { Transaction } from '../types';
import {
  INVESTMENT_TRANSACTIONS,
  TRADE_REPUBLIC_TRANSACTION_FEE,
  TRANSACTIONS_WITH_FEE,
} from './constants';
import { formatDate } from './utils';

const OUTPUT_DIR = 'build';
const FILENAME = 'snowball_transactions.csv';

export const convertAndSaveSnowballCsv = (data: Transaction[]) => {
  if (!data?.length) {
    console.warn(
      'No data provided to convert to CSV. No file will be created.',
    );
    return;
  }

  const headers = [
    'Event',
    'Date',
    'Symbol',
    'Price',
    'Quantity',
    'Currency',
    'FeeTax',
    'Exchange',
    'FeeCurrency',
  ];

  let csvRows = [];
  csvRows.push(headers.join(','));

  data.forEach((item) => {
    // For now we are only interested in investment transactions
    if (!INVESTMENT_TRANSACTIONS.includes(item.eventType)) return;

    const event = item.amount.value < 0 ? 'Buy' : 'Sell';
    const date = formatDate(new Date(item.timestamp));
    const symbol = item.icon.split('/')[1];
    const price = item.amount.value;
    const quantity = '';
    const currency = item.amount.currency;
    const feeTax = TRANSACTIONS_WITH_FEE.includes(item.eventType)
      ? TRADE_REPUBLIC_TRANSACTION_FEE
      : '';
    const exchange = '';
    const feeCurrenty = '';

    const row = [
      event,
      date,
      symbol,
      price,
      quantity,
      currency,
      feeTax,
      exchange,
      feeCurrenty,
    ];

    csvRows.push(row.map((field) => `"${field}"`).join(','));
  });

  const csvString = csvRows.join('\n');
  const filePath = path.join(process.cwd(), `${OUTPUT_DIR}/${FILENAME}`);

  if (!fs.existsSync('build')) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFile(filePath, csvString, (error) => {
    if (error) {
      console.error(`Error saving CSV file "${FILENAME}".`, error);
    } else {
      console.log(`CSV file "${FILENAME}" successfully saved to ${filePath}.`);
    }
  });
};
