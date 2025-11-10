import axios from 'axios';
import { parse } from 'node-html-parser';
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

const symbolToExchange: Record<string, string> = {};

// Using Xetra as the default as Lang & Schwarz exchange doesn't provide enough information
// if the trade happened in Xetra or Frankfurt exchange
// if the stock/etf isn't traded in Xetra it will fallback to Frankfurt
const getExchangeFromSymbol = async (symbol: string) => {
  if (symbolToExchange[symbol]) return symbolToExchange[symbol];

  // We don't know if its a etf or stock yet with just the symbol, so we need to check both
  const [stockResponse, etfResponse] = await Promise.allSettled([
    axios.get(`https://www.boerse-frankfurt.de/aktie/${symbol}`),
    axios.get(`https://www.boerse-frankfurt.de/etf/${symbol}`),
  ]);

  const stockData =
    stockResponse.status === 'fulfilled' ? stockResponse.value.data : null;
  const etfData =
    etfResponse.status === 'fulfilled' ? etfResponse.value.data : null;

  const stockExchanges = stockData
    ? parse(stockData).getElementsByTagName('app-widget-exchange-bar')?.[0]
        ?.children
    : null;
  const etfExchanges = etfData
    ? parse(etfData).getElementsByTagName('app-widget-exchange-bar')?.[0]
        ?.children
    : null;

  if (
    stockExchanges?.some((item) => item?.innerText.includes('Xetra')) ||
    etfExchanges?.some((item) => item?.innerText.includes('Xetra'))
  ) {
    symbolToExchange[symbol] = 'XETRA';
    return 'XETRA';
  }

  symbolToExchange[symbol] = 'F';
  return 'F';
};

export const convertTransactionsToSnowballCsv = async (
  data: Transaction[],
): Promise<void> => {
  if (!data?.length) {
    console.warn(
      'No data provided to convert to CSV. No file will be created.',
    );
    return;
  }

  let csvRows = [];
  csvRows.push(HEADERS.join(','));

  for (const item of data) {
    if (item.status === 'CANCELED') continue;

    if (!item.eventType) continue;

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
      [TRANSACTION_EVENT_TYPE.SSP_CORPORATE_ACTION_INVOICE_CASH].includes(
        item.eventType,
      )
    ) {
      event = 'Dividend';
      date = item.timestamp.slice(0, 10);
      symbol = item.icon.split('/')[1];
      exchange = await getExchangeFromSymbol(symbol);
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
          feeTax =
            (taxSubSection?.detail?.displayValue?.text[0] === '-'
              ? taxSubSection?.detail?.displayValue?.text?.slice(2)
              : taxSubSection?.detail?.displayValue?.text?.slice(1)) ?? '';
          feeCurrency =
            SIGN_TO_CURRENCY_MAP[
              taxSubSection?.detail?.displayValue?.text[0] === '-'
                ? taxSubSection?.detail?.displayValue?.text?.[1]!
                : taxSubSection?.detail?.displayValue?.text?.[0]!
            ];
          // The total doesn't include tax, so we need to add it
          quantity = calculateStringNumbers('add', [
            totalSubSection?.detail?.displayValue?.text?.slice(1),
            feeTax,
          ]);
          currency =
            SIGN_TO_CURRENCY_MAP[
              totalSubSection?.detail?.displayValue?.text?.[0]!
            ];
          // As the pricePerShare can be in another currency,
          // we need to calculate it with the total / shares
          price = calculateStringNumbers('divide', [
            quantity,
            sharesSubSection?.detail?.displayValue?.text,
          ]);
        }
      });
    }

    // Received Stock gifts when opening an account
    if ([TRANSACTION_EVENT_TYPE.STOCK_PERK_REFUNDED].includes(item.eventType)) {
      event = 'Stock_As_Dividend';
      date = item.timestamp.slice(0, 10);
      note = item.title;

      item.sections?.forEach((section) => {
        if ('title' in section && section.type === 'header') {
          const headerSection = section as TransactionHeaderSection;
          symbol = headerSection?.data?.icon?.split('/')[1];
        }
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const sharesPriceSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Share price',
          );
          price = '0';
          quantity = sharesSubSection?.detail?.text ?? '';
          currency =
            SIGN_TO_CURRENCY_MAP[sharesPriceSubSection?.detail?.text?.[0]!];
        }
      });

      exchange = await getExchangeFromSymbol(symbol);
    }

    // Received stock gifts from a friend
    if (
      [TRANSACTION_EVENT_TYPE.GIFTING_RECIPIENT_ACTIVITY].includes(
        item.eventType,
      )
    ) {
      event = 'Stock_As_Dividend';
      date = item.timestamp.slice(0, 10);
      note = item.title;

      item.sections?.forEach((section) => {
        if ('title' in section && section.type === 'header') {
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
          price = '0';
          quantity = sharesSubSection?.detail?.text ?? '';
          currency =
            SIGN_TO_CURRENCY_MAP[sharesPriceSubSection?.detail?.text?.[0]!];
        }
      });

      exchange = await getExchangeFromSymbol(symbol);
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
      exchange = await getExchangeFromSymbol(symbol);
      note = item.title;

      item.sections?.forEach((section) => {
        // Check for "Transaction" section (newer format)
        if ('title' in section && section.title === 'Transaction') {
          const tableSection = section as TransactionTableSection;
          const sharesSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Shares',
          );
          const sharePriceSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Share price',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );

          quantity = sharesSubSection?.detail?.text ?? '';
          price = sharePriceSubSection?.detail?.text?.slice(1) ?? '';
          currency =
            SIGN_TO_CURRENCY_MAP[sharePriceSubSection?.detail?.text?.[0]!];
          feeTax =
            feeSubSection?.detail?.text === 'Free'
              ? ''
              : (feeSubSection?.detail?.text?.slice(1) ?? '');
          feeCurrency =
            feeSubSection?.detail?.text === 'Free'
              ? ''
              : SIGN_TO_CURRENCY_MAP[feeSubSection?.detail?.text?.[0]!];
        }

        // Check for "Overview" section with Transaction subsection (older format)
        if ('title' in section && section.title === 'Overview') {
          const tableSection = section as TransactionTableSection;
          const transactionSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Transaction',
          );
          const feeSubSection = tableSection.data.find(
            (subSection) => subSection.title === 'Fee',
          );

          // Only use this if we haven't already found data in Transaction section
          if (transactionSubSection && !price) {
            price =
              transactionSubSection?.detail?.displayValue?.text?.slice(1) ?? '';
            quantity =
              transactionSubSection?.detail?.displayValue?.prefix?.slice(
                0,
                -3,
              ) ?? '';
            currency =
              SIGN_TO_CURRENCY_MAP[
                transactionSubSection?.detail?.displayValue?.text?.[0]!
              ];
          }

          if (feeSubSection && !feeTax) {
            feeTax =
              feeSubSection?.detail?.text === 'Free'
                ? ''
                : (feeSubSection?.detail?.text?.slice(1) ?? '');
            feeCurrency =
              feeSubSection?.detail?.text === 'Free'
                ? ''
                : SIGN_TO_CURRENCY_MAP[feeSubSection?.detail?.text?.[0]!];
          }
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
    if (
      [TRANSACTION_EVENT_TYPE.SSP_TAX_CORRECTION_INVOICE].includes(
        item.eventType,
      )
    ) {
      event = item.amount.value > 0 ? 'Cash_Gain' : 'Cash_Expense';
      date = item.timestamp.slice(0, 10);
      symbol = item.amount.currency;
      note = item.title;
      price = '1';
      quantity = Math.abs(item.amount.value).toString();
      currency = item.amount.currency;
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

    if (row.every((field) => !field)) continue;

    // Log transactions with undefined values
    const hasUndefined = row.some((field) => field === undefined);
    if (hasUndefined) {
      console.warn(
        `Transaction with undefined values detected:`,
        `\n  ID: ${item.id}`,
        `\n  Title: ${item.title}`,
        `\n  EventType: ${item.eventType}`,
        `\n  Row data: ${JSON.stringify({
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
        })}`,
      );
    }

    csvRows.push(row.map((field) => `"${field ?? ''}"`).join(','));
  }

  const csvString = csvRows.join('\n');
  saveFile(csvString, FILE_NAME, OUTPUT_DIRECTORY);
};
