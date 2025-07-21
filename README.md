# tr2sa: Convert Trade Republic Transactions History to Snowball Analytics CSV

This library only purpose is to generate a CSV file for Snowball Analytics. It is not affiliated with Trade Republic Bank GmbH.

Currently supported transactions:

- trades
- savings plans
- roundups
- 15 euros per month bonus
- dividends
- interests
- tax corrections
- received stock gift

## Import cash balance

You need to manually add your current cash balance in Snowball Analytics.

1 - Go to the current portfolio settings and change 'Cash accounting' to 'All cash movements'
2 - Import the CSV
3 - Go to the portfolio settings again and change 'Cash accounting' to 'Current balance'
4 - Go to the cash balance => click in the currency => three dots button => Edit balance
5 - Put your real cash balance from Trade Republic.

Note, importing a CSV with 'Cash accounting' as 'Current balance' will remove your cash balance. You can do all these steps again to re-add it or go to https://snowball-analytics.com/cash to add it there as the mobile application doesn't have this option.

## What is currently supported

- Download JSON and convert it to Snowball CSV
- Import existing JSON and convert it to Snowball CSV (connection to Trade Republic api isn't needed)
- Connect to WebSocket (interact via prompt)
  - Known supported commands (token is already added to the messages):
    - Transactions: {"type": "timelineTransactions"} // list of transactions with optional 'after' option to get the next list of transactions (after needs the hash from the previous call)
    - Transaction Details: {"type": "timelineDetailV2", "id": timeline_id } // extra details of a transactions with required timeline_id that is id of a transaction
    - Activity Log: {"type": "timelineActivityLog" } // list of activies with optional 'after' option to get the next list of activities (after needs the hash from the previous call)
    - Available cash: {"type": "availableCash" } // current cash balance
    - Can get more of options from https://github.com/pytr-org/pytr/blob/master/pytr/api.py code, but this project isn't supporting and explaining how to use the others for now

## Steps

1 - Install Node 20.19.0 (use the exact version to avoid errors)

2 - npm install

3 - npm start

## Tip

If you liked this project and want me to keep it updated. Consider to tip any amount to:
https://streamlabs.com/danielferrarir/tip

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/DanielFerrariR/tr2sa/blob/master/LICENSE) file for details.
