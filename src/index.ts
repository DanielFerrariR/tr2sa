import { login } from './login';
import { connectToTRSocket } from './connectToTRSocket';
import fs from 'fs';
import inquirer from 'inquirer';

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
          name: 'Connect to TR Socket (interact via prompt)',
          value: 'connectToTRSocket',
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

  if (action === 'connectToTRSocket') {
    const trSessionToken = await login();
    if (!trSessionToken) {
      console.error('Login failed. Exiting.');
      return;
    }
    connectToTRSocket(trSessionToken);
    return;
  }

  if (action === 'downloadJSONAndConvertToSnowballCsv') {
    const trSessionToken = await login();
    if (!trSessionToken) {
      console.error('Login failed. Exiting.');
      return;
    }
    const transactions = await getListOfTransactions(trSessionToken);
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
      if (error instanceof SyntaxError) {
        console.error(
          'It seems like all_timeline_transactions.json might be malformed JSON.',
        );
      }
    }
  }
}

main();
