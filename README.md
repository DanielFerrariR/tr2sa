# tr2sa: Convert Trade Republic Transactions History to Snowball Analytics CSV

This library only purpose is to generate a CSV file for Snowball Analytics.

Currently supported transactions:

- trades
- savings plans
- roundups
- 15 euros per month bonus
- dividends
- interest
- transfers (in progress, partially done)

Missing

- Some cash related transactions events (transfers, tax correction, refunds, payments)
  - INCOMING_TRANSFER_DELEGATION // incoming transfer delegation
  - card_successful_transaction // card successful transaction
  - OUTGOING_TRANSFER_DELEGATION // outgoing transfer delegation
  - card_refund // card refund
  - ssp_tax_correction_invoice // tax correction
  - OUTGOING_TRANSFER // outgoing transfer
  - INCOMING_TRANSFER // income transfer
  - card_order_billed // money spend in a new Trade Republic card
  - GIFTER_TRANSACTION // Send stock gift to a friend

## What is currently supported

- Connect to WebSocket (interact via prompt)
  - Known supported commands (token is already added to the messages):
    - {"type": "timelineTransactions"} // can add 'after' with the previous response to get the next list
    - {"type": "timelineDetailV2", "id": timeline_id } // timeline_id is the transaction id
    - Can get more of options from https://github.com/pytr-org/pytr/blob/master/pytr/api.py code, but this project isn't supporting and explaining how to use the others for now
- Download JSON and convert it to Snowball CSV
- Import existing JSON and convert it to Snowball CSV (connection to Trade Republic api isn't needed)

## Steps

1 - Install Node 20.19.0

2 - npm install

3 - Create a .env file (check .env.example)

4 - npm run cli

## License

Want to use this project? Awesome! Here's the deal:

You're welcome to use it for personal, non-commercial projects without any cost. Feel free to explore, learn, and create!

For commercial use, please reach out to me. We can discuss licensing options.

If you'd like to support my work and help me continue creating, you can always chip in here: https://streamlabs.com/danielferrarir

Thanks for your interest!
