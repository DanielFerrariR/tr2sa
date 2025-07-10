import fs from 'fs';
import path from 'path';
import {
  TransactionTableSection,
  Transaction,
  TRANSATION_EVENT_TYPE,
  TransactionHeaderSection,
} from '../../tradeRepublic';

const OUTPUT_DIR = 'build';
const FILENAME = 'snowball_transactions.csv';

const signToCurrency: any = {
  '€': 'EUR',
  $: 'USD',
  '£': 'GBP',
};

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
    'Note',
  ];

  let csvRows = [];
  csvRows.push(headers.join(','));

  data.forEach((item) => {
    if (item.status === 'CANCELED') return;

    // Dividends
    if (
      item.eventType === TRANSATION_EVENT_TYPE.SSP_CORPORATE_ACTION_INVOICE_CASH
    ) {
      const event = 'Dividend';
      const date = item.timestamp.slice(0, 10);
      const symbol = item.icon.split('/')[1];
      const exchange = '';
      const note = item.title;
      let price: string | undefined;
      let quantity: string | undefined;
      let currency: string | undefined;
      let feeTax: string | undefined;
      let feeCurrency: string | undefined;

      item.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const SharesSubsection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const dividendPerShareSubsction = tableSection.data.find(
            (subSection) => subSection.title === 'Dividend per share',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );
          price = dividendPerShareSubsction?.detail?.text?.slice(1);
          quantity = SharesSubsection?.detail?.text;
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
        note,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(','));
    }

    // Received stock gifts
    if (item.eventType === TRANSATION_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY) {
      const event = 'Buy';
      const date = item.timestamp.slice(0, 10);
      const exchange = '';
      const note = item.title;
      const feeTax = '';
      const feeCurrency = '';
      let symbol: string | undefined;
      let price: string | undefined;
      let quantity: string | undefined;
      let currency: string | undefined;

      item.sections?.forEach((section) => {
        if ('title' in section && section.title === 'You accepted your gift') {
          const headerSection = section as TransactionHeaderSection;
          symbol = headerSection?.data?.icon?.split('/')[1];
        }
        if ('title' in section && section.title === 'Overview') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const sharesPriceSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Share price',
          );
          price = sharesPriceSubSection?.detail?.text?.slice(1);
          quantity = sharesSubSection?.detail?.text;
          currency = signToCurrency[sharesPriceSubSection?.detail?.text?.[0]!];
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
        note,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(','));
    }

    // Buy and Sell transactions (trades, savings plans, roundups and 15 euros per month bonus)
    if (
      [
        TRANSATION_EVENT_TYPE.TRADING_TRADE_EXECUTED,
        TRANSATION_EVENT_TYPE.TRADING_SAVINGSPLAN_EXECUTED,
        TRANSATION_EVENT_TYPE.BENEFITS_SPARE_CHANGE_EXECUTION,
        TRANSATION_EVENT_TYPE.BENEFITS_SAVEBACK_EXECUTION,
      ].includes(item.eventType)
    ) {
      const event = item.amount.value < 0 ? 'Buy' : 'Sell';
      const date = item.timestamp.slice(0, 10);
      const symbol = item.icon.split('/')[1];
      const exchange = '';
      const note = item.title;
      let price: string | undefined;
      let quantity: string | undefined;
      let currency: string | undefined;
      let feeTax: string | undefined;
      let feeCurrency: string | undefined;

      item.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Overview') {
          const tableSection = section as TransactionTableSection;
          const transactionSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Transaction',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );
          price = transactionSubSection?.detail?.displayValue?.text?.slice(1);
          quantity = transactionSubSection?.detail?.displayValue?.prefix?.slice(
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
        note,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(','));
    }

    // Interest
    if (item.eventType === TRANSATION_EVENT_TYPE.INTEREST_PAYOUT) {
      const event = 'Cash_Gain';
      const date = item.timestamp.slice(0, 10);
      const symbol = item.amount.currency;
      const exchange = '';
      const note = item.title;
      let price = 1;
      let quantity: string | undefined;
      let currency: string | undefined;
      let feeTax: string | undefined;
      let feeCurrency: string | undefined;

      item.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const accruedSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Accrued',
          );
          const taxSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );
          quantity = accruedSubSection?.detail?.text?.slice(1);
          currency = signToCurrency[accruedSubSection?.detail?.text?.[0]!];
          feeTax = taxSubSection?.detail?.text?.slice(1);
          feeCurrency = signToCurrency[taxSubSection?.detail?.text?.[0]!];
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
        note,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(','));
    }

    // tax corrections
    if (item.eventType === TRANSATION_EVENT_TYPE.SSP_TAX_CORRECTION_INVOICE) {
      const event = item.amount.value > 0 ? 'Cash_Gain' : 'Cash_Expense';
      const date = item.timestamp.slice(0, 10);
      const symbol = item.amount.currency;
      const exchange = '';
      const note = item.title;
      const price = 1;
      const quantity = Math.abs(item.amount.value);
      const currency = item.amount.currency;
      const feeTax = '';
      const feeCurrency = '';

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
        note,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(','));
    }

    // Legacy transactions (trades, savings plans)
    if (
      item.eventType ===
        TRANSATION_EVENT_TYPE.TIMELINE_LEGACY_MIGRATED_EVENTS &&
      item.subtitle !== null &&
      ['Saving executed', 'Sell Order', 'Buy Order'].includes(item.subtitle)
    ) {
      const event = item.amount.value < 0 ? 'Buy' : 'Sell';
      const date = item.timestamp.slice(0, 10);
      const symbol = item.icon.split('/')[1];
      const exchange = '';
      const note = item.title;
      let price: string | undefined;
      let quantity: string | undefined;
      let currency: string | undefined;
      let feeTax: string | undefined;
      let feeCurrency: string | undefined;

      item.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const sharesSubsection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const sharesPriceSubsection = tableSection.data.find(
            (subSection) => subSection.title === 'Share price',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );
          price = sharesPriceSubsection?.detail?.text?.slice(1);
          quantity = sharesSubsection?.detail?.text;
          currency = signToCurrency[sharesPriceSubsection?.detail?.text?.[0]!];
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
        note,
      ];

      csvRows.push(row.map((field) => `"${field}"`).join(','));
    }

    // Legacy transactions (Interest)
    if (
      item.eventType ===
        TRANSATION_EVENT_TYPE.TIMELINE_LEGACY_MIGRATED_EVENTS &&
      item.title === 'Interest' &&
      item.subtitle === null
    ) {
      const event = 'Cash_Gain';
      const date = item.timestamp.slice(0, 10);
      const symbol = item.amount.currency;
      const exchange = '';
      const price = 1;
      const quantity = item.amount.value;
      const currency = item.amount.currency;
      const feeTax = '';
      const feeCurrency = '';
      const note = item.title;

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
        note,
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
