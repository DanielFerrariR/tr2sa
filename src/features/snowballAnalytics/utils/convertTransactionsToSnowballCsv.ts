import fs from 'fs';
import path from 'path';
import {
  Transaction,
  INVESTMENT_TRANSACTIONS,
  OverviewSection,
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

  let csvRows = [];
  csvRows.push(headers.join(','));

  data.forEach((item) => {
    // For now we are only interested in investment transactions
    if (!INVESTMENT_TRANSACTIONS.includes(item.eventType)) return;

    const event = item.amount.value < 0 ? 'Buy' : 'Sell';
    const date = formatDate(new Date(item.timestamp));
    const symbol = item.icon.split('/')[1];
    const currency = item.amount.currency;
    const exchange = '';
    const feeCurrenty = '';

    // These only exist inside transaction details
    let price: string | undefined;
    let quantity: string | undefined;
    let feeTax: string | undefined;
    item.sections?.forEach((section) => {
      if (section.title === 'Overview') {
        const overviewSection = section as OverviewSection;
        const transactionSubSection = overviewSection.data.find(
          (subSection) => subSection.title === 'Transaction',
        );
        const feeSubSection = overviewSection.data.find(
          (subSection) => subSection.title === 'Fee',
        );
        price = transactionSubSection?.detail?.displayValue?.text?.replace(
          '€',
          '',
        );
        quantity = transactionSubSection?.detail?.displayValue?.prefix
          ?.replace(' × ', '')
          .replace(' x ', '');
        feeTax =
          feeSubSection?.detail?.text === 'Free'
            ? ''
            : feeSubSection?.detail?.text?.replace('€', '');
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
