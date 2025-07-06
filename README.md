# jstr: Use TradeRepublic in terminal

This is a library for the private API of the Trade Republic online brokerage. It is not affiliated with Trade Republic Bank GmbH.

You can get some information how this works from https://github.com/J05HI/pytr, but this documentation looks a bit outdated (Ex. timelineDetail doesn't work anymore and needs to use timelineDetailV2 instead).

Supported features:

- Interactive Socket connection
- Known supported commands (token is already added to the messages):
  - {"type": "timelineTransactions"} // can add 'after' with the previous response to get the next list
  - {"type": "timelineDetailV2", "id": timeline_id } // timeline_id is the transaction id
  - Can get more of options from https://github.com/pytr-org/pytr/blob/master/pytr/api.py code, but this project isn't supporting and explaining how to use the others for now
- Get Transactions list
- Convert Transactions list to Snowball Analytics CSV

## Steps

1 - Install Node 20.19.0

2 - npm install

2 - Create a .env file (check .env.example)

3 - npm run cli
