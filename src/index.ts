require('dotenv').config(); // Needs to be at the top to load environment variables
import fs from 'fs';
import inquirer from 'inquirer';
import { login } from './login';
import { connectToWebSocket } from './connectToWebSocket';

import { convertAndSaveSnowballCsv } from './convertAndSaveSnowballCsv';
import { getListOfTransactions } from './getListOfTransactions';

async function main() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        {
          name: 'Connect to WebSocket (interact via prompt)',
          value: 'connectToWebSocket',
        },
        {
          name: 'Download JSON and convert it to Snowball CSV',
          value: 'downloadJSONAndConvertToSnowballCsv',
        },
        {
          name: 'Import existing JSON and convert it to Snowball CSV',
          value: 'importAndConvertToSnowballCsv',
        },
      ],
    },
  ]);

  if (action === 'connectToWebSocket') {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    connectToWebSocket();
    return;
  }

  if (action === 'downloadJSONAndConvertToSnowballCsv') {
    const wasLoginSuccessful = await login();
    if (!wasLoginSuccessful) return;
    const transactions = await getListOfTransactions();
    convertAndSaveSnowballCsv(transactions);
    console.log('Conversion to Snowball CSV completed.');
    return;
  }

  if (action === 'importAndConvertToSnowballCsv') {
    try {
      const jsonFilePath = 'build/all_timeline_transactions.json';
      if (!fs.existsSync(jsonFilePath)) {
        console.error(`Error: ${jsonFilePath} not found.`);
        console.error(
          'Please ensure you have previously saved your transaction data to this file, perhaps from a prior socket interaction.',
        );
        return;
      }
      console.log(`Reading transactions from ${jsonFilePath}...`);
      const transactionsJson = JSON.parse(
        fs.readFileSync(jsonFilePath, 'utf8'),
      );
      convertAndSaveSnowballCsv(transactionsJson);
      console.log('Conversion to Snowball CSV completed.');
    } catch (error) {
      console.error('Error converting to Snowball CSV:', error);
    }
  }
}

main();
