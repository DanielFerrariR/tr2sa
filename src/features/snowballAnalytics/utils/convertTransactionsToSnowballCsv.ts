import fs from 'fs';
import path from 'path';
import {
  Transaction,
  OverviewSection,
  BUY_AND_SELL_TRANSACTIONS,
  TRANSATION_EVENT_TYPE,
  TransactionSection,
} from '../../tradeRepublic';
import { formatDate } from '../../../utils';

const OUTPUT_DIR = 'build';
const FILENAME = 'snowball_transactions.csv';

export const convertTransactionsToSnowballCsv = (data: Transaction[]) => {
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

  const signToCurrency: any = {
    '€': 'EUR',
    $: 'USD',
    '£': 'GBP',
  };

  let csvRows = [];
  csvRows.push(headers.join(','));

  data.forEach((item) => {
    // Skip canceled transactions
    if (item.status === 'CANCELED') return;

    // Dividends
    if (
      item.eventType === TRANSATION_EVENT_TYPE.SSP_CORPORATE_ACTION_INVOICE_CASH
    ) {
      const event = 'Dividend';
      const date = formatDate(new Date(item.timestamp));
      const symbol = item.icon.split('/')[1];
      const exchange = '';

      let price: string | undefined;
      let quantity: string | undefined;
      let currency: string | undefined;
      let feeTax: string | undefined;
      let feeCurrency: string | undefined;

      item.sections?.forEach((section) => {
        if (section.title === 'Transaction') {
          const transactionSection = section as TransactionSection;
          const SharesSubsection = transactionSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const dividendPerShareSubsction = transactionSection.data.find(
            (subSection) => subSection.title === 'Dividend per share',
          );
          const feeSubSection = transactionSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );
          price = SharesSubsection?.detail?.text;
          quantity = dividendPerShareSubsction?.detail?.text?.slice(1);
          currency =
            signToCurrency[dividendPerShareSubsction?.detail?.text?.[0]!];
          feeTax = feeSubSection?.detail?.text?.slice(1);
          feeCurrency = signToCurrency[feeSubSection?.detail?.text?.[0]!];
        }
      });

      const row = [
        event,
        date,
        symbol,
        price,
        quantity,
        currency,
        feeTax,
        exchange,
        feeCurrency,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(','));
    }

    // Buy and Sell transactions (trades, savings plans, roundups and 15 euros per month)
    if (BUY_AND_SELL_TRANSACTIONS.includes(item.eventType)) {
      const event = item.amount.value < 0 ? 'Buy' : 'Sell';
      const date = formatDate(new Date(item.timestamp));
      const symbol = item.icon.split('/')[1];
      const exchange = '';

      let price: string | undefined;
      let quantity: string | undefined;
      let currency: string | undefined;
      let feeTax: string | undefined;
      let feeCurrency: string | undefined;

      item.sections?.forEach((section) => {
        if (section.title === 'Overview') {
          const overviewSection = section as OverviewSection;
          const transactionSubSection = overviewSection.data.find(
            (subSection) => subSection.title === 'Transaction',
          );
          const feeSubSection = overviewSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );
          price = transactionSubSection?.detail?.displayValue?.text?.slice(1);
          quantity = transactionSubSection?.detail?.displayValue?.prefix.slice(
            0,
            -3,
          );
          currency =
            signToCurrency[
              transactionSubSection?.detail?.displayValue?.text?.[0]!
            ];
          feeTax =
            feeSubSection?.detail?.text === 'Free'
              ? ''
              : feeSubSection?.detail?.text?.slice(1);
          feeCurrency =
            feeSubSection?.detail?.text === 'Free'
              ? ''
              : signToCurrency[feeSubSection?.detail?.text?.[0]!];
        }
      });

      const row = [
        event,
        date,
        symbol,
        price,
        quantity,
        currency,
        feeTax,
        exchange,
        feeCurrency,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(','));
    }
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
