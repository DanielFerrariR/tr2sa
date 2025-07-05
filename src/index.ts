// import { login } from './login';
// import { connectToTRSocket } from './connectToTRSocket';
// import fs from 'fs';
import json from '../all_timeline_transactions.json';

import { convertAndSaveSnowballCsv } from './convertAndSaveSnowballCsv';

async function main() {
  // const trSessionToken = await login();
  // if (!trSessionToken) {
  //   console.error('Login failed. Exiting.');
  //   return;
  // }
  // try {
  //   const transactions = await connectToTRSocket(trSessionToken);
  //   fs.writeFileSync(
  //     'all_timeline_transactions.json',
  //     JSON.stringify(transactions)
  //   );
  //   console.log('Transactions:', transactions);
  // } catch (error) {
  //   console.error('Error fetching transactions:', error);
  // }
  convertAndSaveSnowballCsv(json as any);
}

main();
