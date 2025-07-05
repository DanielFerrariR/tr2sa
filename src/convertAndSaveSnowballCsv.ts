import fs from 'fs';
import path from 'path';
import { Transaction } from '../types/transactions';
import { TRANSATION_EVENT_TYPE } from './constants/transactions';

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const transactionsWithFee = [TRANSATION_EVENT_TYPE.TRADING_TRADE_EXECUTED];

const tradeRepublicFee = 1.0;

export const convertAndSaveSnowballCsv = (
  data: Transaction[],
  filename = 'snowball_transactions.csv',
) => {
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
    const event = item.amount.value < 0 ? 'Buy' : 'Sell';
    const date = formatDate(new Date(item.timestamp));
    const symbol = '';
    const price = item.amount.value;
    const quantity = '';
    const currency = item.amount.currency;
    const feeTax = transactionsWithFee.includes(item.eventType)
      ? tradeRepublicFee
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

    csvRows.push(row.map((field) => `"${String(field)}"`).join(','));
  });

  const csvString = csvRows.join('\n');
  const filePath = path.join(process.cwd(), `build/${filename}`);

  if (!fs.existsSync('build')) fs.mkdirSync('build');

  fs.writeFile(filePath, csvString, (error) => {
    if (error) {
      console.error(`Error saving CSV file "${filename}".`, error);
    } else {
      console.log(`CSV file "${filename}" successfully saved to ${filePath}.`);
    }
  });
};
