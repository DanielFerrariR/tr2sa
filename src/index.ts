require('dotenv').config(); // Needs to be at the top to load environment variables
import fs from 'fs';
import inquirer from 'inquirer';
import {
  login,
  getTransactions,
  interactiveSocketConnection,
  convertTransactionsToSnowballCsv,
} from './features';

const MENU_OPTIONS = {
  INTERACTIVE_SOCKET_CONNECTION: 'interactiveSocketConnection',
  DOWNLOAD_JSON_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV:
    'downloadJSONAndConvertToSnowballCsv',
  IMPORT_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV:
    'importAndConvertToSnowballCsv',
};

async function main() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Connect to WebSocket (interact via prompt)',
          value: MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION,
        },
        {
          name: 'Download JSON and convert it to Snowball CSV',
          value:
            MENU_OPTIONS.DOWNLOAD_JSON_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV,
        },
        {
          name: 'Import existing JSON and convert it to Snowball CSV',
          value: MENU_OPTIONS.IMPORT_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV,
        },
      ],
    },
  ]);

  if (action === MENU_OPTIONS.INTERACTIVE_SOCKET_CONNECTION) {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    interactiveSocketConnection();
    return;
  }

  if (
    action ===
    MENU_OPTIONS.DOWNLOAD_JSON_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV
  ) {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    const transactions = await getTransactions();
    convertTransactionsToSnowballCsv(transactions);
    console.log('Conversion to Snowball CSV completed.');
    return;
  }

  if (action === MENU_OPTIONS.IMPORT_AND_CONVERT_TRANSACTIONS_TO_SNOWBALL_CSV) {
    try {
      const jsonFilePath = 'build/transactions_with_details.json';
      if (!fs.existsSync(jsonFilePath)) {
        console.error(`Error: ${jsonFilePath} not found.`);
        console.error(
          'Please ensure you have previously saved your transaction with details data to this file, perhaps from a prior socket interaction.',
        );
        return;
      }
      console.log(`Reading transactions with details from ${jsonFilePath}...`);
      const transactionsJson = JSON.parse(
        fs.readFileSync(jsonFilePath, 'utf8'),
      );
      convertTransactionsToSnowballCsv(transactionsJson);
      console.log('Conversion to Snowball CSV completed.');
    } catch (error) {
      console.error('Error converting to Snowball CSV:', error);
    }
  }
}

main();
