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

## How to import cash?

Currently, cash isn't supported (as TR is also a bank, the account movements can make Snowball Analytics data get messy, which isn't the purpose of this library).

If you want to import your cash balance change your portfolio accounting to 'Current Balance' and add the value manually at https://snowball-analytics.com/cash

## What is currently supported

- Connect to WebSocket (interact via prompt)
  - Known supported commands (token is already added to the messages):
    - Transactions: {"type": "timelineTransactions"} // can add 'after' with the previous response to get the next list
    - Transaction Details: {"type": "timelineDetailV2", "id": timeline_id } // timeline_id is the transaction id
    - Activity Log: {"type": "timelineActivityLog" } // can add 'after' with the previous response to get the next list
    - Can get more of options from https://github.com/pytr-org/pytr/blob/master/pytr/api.py code, but this project isn't supporting and explaining how to use the others for now
- Download JSON and convert it to Snowball CSV
- Import existing JSON and convert it to Snowball CSV (connection to Trade Republic api isn't needed)

## Steps

1 - Install Node 20.19.0 (use the exact version to avoid errors)

2 - npm install

3 - npm start

## Tip

If you liked this project and want me to keep it updated. Consider to tip any amount to:
https://streamlabs.com/danielferrarir/tip
