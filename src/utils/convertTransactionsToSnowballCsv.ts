import { SIGN_TO_CURRENCY_MAP, TRANSACTION_EVENT_TYPE } from '../constants';
import {
  TransactionTableSection,
  Transaction,
  TransactionHeaderSection,
} from '../types';
import { calculateStringNumbers } from './calculateStringNumbers';
import { saveFile } from './saveFile';

const OUTPUT_DIRECTORY = 'build';
const FILE_NAME = 'snowball_transactions.csv';

const HEADERS = [
  'Event',
  'Date',
  'Symbol',
  'Price',
  'Quantity',
  'Currency',
  'FeeTax',
  'Exchange',
  'FeeCurrency',
  'DoNotAdjustCash',
  'Note',
];

export const convertTransactionsToSnowballCsv = (data: Transaction[]): void => {
  if (!data?.length) {
    console.warn(
      'No data provided to convert to CSV. No file will be created.',
    );
    return;
  }

  let csvRows = [];
  csvRows.push(HEADERS.join(','));

  data.forEach((item) => {
    if (item.status === 'CANCELED') return;

    let event = '';
    let date = '';
    let symbol = '';
    let price = '';
    let quantity = '';
    let currency = '';
    let feeTax = '';
    let exchange = '';
    let feeCurrency = '';
    let doNotAdjustCash = '';
    let note = '';

    // Dividends
    if (
      item.eventType ===
      TRANSACTION_EVENT_TYPE.SSP_CORPORATE_ACTION_INVOICE_CASH
    ) {
      event = 'Dividend';
      date = item.timestamp.slice(0, 10);
      symbol = item.icon.split('/')[1];
      exchange = 'F';
      note = item.title;

      item.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const taxSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );
          const totalSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Total',
          );
          // The total doesn't include tax, so we need to add it
          quantity = calculateStringNumbers('add', [
            totalSubSection?.detail?.text?.slice(1),
            taxSubSection?.detail?.text?.slice(1),
          ]);
          // As the pricePerShare can be in another currency,
          // we need to calculate it with the total / shares
          price = calculateStringNumbers('divide', [
            quantity,
            sharesSubSection?.detail?.text,
          ]);
          currency = SIGN_TO_CURRENCY_MAP[totalSubSection?.detail?.text?.[0]!];
          feeTax = taxSubSection?.detail?.text?.slice(1) ?? '';
          feeCurrency = SIGN_TO_CURRENCY_MAP[taxSubSection?.detail?.text?.[0]!];
        }
      });
    }

    // Received stock gifts
    if (item.eventType === TRANSACTION_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY) {
      event = 'Buy';
      date = item.timestamp.slice(0, 10);
      exchange = 'F';
      note = item.title;

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
          price = sharesPriceSubSection?.detail?.text?.slice(1) ?? '';
          quantity = sharesSubSection?.detail?.text ?? '';
          currency =
            SIGN_TO_CURRENCY_MAP[sharesPriceSubSection?.detail?.text?.[0]!];
        }
      });
    }

    // Buy and Sell transactions (trades, savings plans, roundups and 15 euros per month bonus)
    if (
      [
        TRANSACTION_EVENT_TYPE.TRADING_TRADE_EXECUTED,
        TRANSACTION_EVENT_TYPE.TRADING_SAVINGSPLAN_EXECUTED,
        TRANSACTION_EVENT_TYPE.BENEFITS_SPARE_CHANGE_EXECUTION,
        TRANSACTION_EVENT_TYPE.BENEFITS_SAVEBACK_EXECUTION,
      ].includes(item.eventType)
    ) {
      event = item.amount.value < 0 ? 'Buy' : 'Sell';
      date = item.timestamp.slice(0, 10);
      symbol = item.icon.split('/')[1];
      exchange = 'F';
      note = item.title;

      item.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Overview') {
          const tableSection = section as TransactionTableSection;
          const transactionSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Transaction',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );
          price =
            transactionSubSection?.detail?.displayValue?.text?.slice(1) ?? '';
          quantity =
            transactionSubSection?.detail?.displayValue?.prefix?.slice(0, -3) ??
            '';
          currency =
            SIGN_TO_CURRENCY_MAP[
              transactionSubSection?.detail?.displayValue?.text?.[0]!
            ];
          feeTax =
            feeSubSection?.detail?.text === 'Free'
              ? ''
              : (feeSubSection?.detail?.text?.slice(1) ?? '');
          feeCurrency =
            feeSubSection?.detail?.text === 'Free'
              ? ''
              : SIGN_TO_CURRENCY_MAP[feeSubSection?.detail?.text?.[0]!];
        }
      });
    }

    // Interest
    if (item.eventType === TRANSACTION_EVENT_TYPE.INTEREST_PAYOUT) {
      event = 'Cash_Gain';
      date = item.timestamp.slice(0, 10);
      symbol = item.amount.currency;
      note = item.title;
      price = '1';

      item.sections?.forEach((section) => {
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const accruedSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Accrued',
          );
          const taxSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Tax',
          );
          quantity = accruedSubSection?.detail?.text?.slice(1) ?? '';
          currency =
            SIGN_TO_CURRENCY_MAP[accruedSubSection?.detail?.text?.[0]!];
          feeTax = taxSubSection?.detail?.text?.slice(1) ?? '';
          feeCurrency = SIGN_TO_CURRENCY_MAP[taxSubSection?.detail?.text?.[0]!];
        }
      });
    }

    // tax corrections
    if (item.eventType === TRANSACTION_EVENT_TYPE.SSP_TAX_CORRECTION_INVOICE) {
      event = item.amount.value > 0 ? 'Cash_Gain' : 'Cash_Expense';
      date = item.timestamp.slice(0, 10);
      symbol = item.amount.currency;
      note = item.title;
      price = '1';
      quantity = Math.abs(item.amount.value).toString();
      currency = item.amount.currency;
    }

    // Legacy transactions (trades, savings plans)
    if (
      item.eventType ===
        TRANSACTION_EVENT_TYPE.TIMELINE_LEGACY_MIGRATED_EVENTS &&
      item.subtitle !== null &&
      ['Saving executed', 'Sell Order', 'Buy Order'].includes(item.subtitle)
    ) {
      event = item.amount.value < 0 ? 'Buy' : 'Sell';
      date = item.timestamp.slice(0, 10);
      symbol = item.icon.split('/')[1];
      exchange = 'F';
      note = item.title;

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
          price = sharesPriceSubsection?.detail?.text?.slice(1) ?? '';
          quantity = sharesSubsection?.detail?.text ?? '';
          currency =
            SIGN_TO_CURRENCY_MAP[sharesPriceSubsection?.detail?.text?.[0]!];
          feeTax =
            feeSubSection?.detail?.text === 'Free'
              ? ''
              : (feeSubSection?.detail?.text?.slice(1) ?? '');
          feeCurrency =
            feeSubSection?.detail?.text === 'Free'
              ? ''
              : SIGN_TO_CURRENCY_MAP[feeSubSection?.detail?.text?.[0]!];
        }
      });
    }

    // Legacy transactions (Interest)
    if (
      item.eventType ===
        TRANSACTION_EVENT_TYPE.TIMELINE_LEGACY_MIGRATED_EVENTS &&
      item.title === 'Interest' &&
      item.subtitle === null
    ) {
      event = 'Cash_Gain';
      date = item.timestamp.slice(0, 10);
      symbol = item.amount.currency;
      price = '1';
      quantity = item.amount.value.toString();
      currency = item.amount.currency;
      note = item.title;
    }

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
      doNotAdjustCash,
      note,
    ];

    if (row.every((field) => !field)) return;

    csvRows.push(row.map((field) => `"${field}"`).join(','));
  });

  const csvString = csvRows.join('\n');
  saveFile(csvString, FILE_NAME, OUTPUT_DIRECTORY);
};
