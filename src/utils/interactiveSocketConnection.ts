import readline from 'readline';
import { TradeRepublicAPI } from '../api';
import { CONNECTION_STATUS } from '../constants';

export const interactiveSocketConnection = (): void => {
  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Enter message to send: ',
  });

  TradeRepublicAPI.getInstance().connect({
    onOpen: () => {
      console.log('WebSocket connection opened.');
    },
    onConnected: () => {
      console.log('\n--- WebSocket Ready ---');
      console.log(
        'You can now type messages to send. The number at the beginning of the message is the subscription ID and needs to be unique for each subscription.',
      );
      console.log(`Example: sub 1 {"type":"cash"}`);
      console.log('Type "exit" to close the connection.');
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      readlineInterface.prompt(true);
    },
    onMessage: (message) => {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      console.log('Received WebSocket message:', message);
      readlineInterface.prompt(true);
    },
    onClose: (event) => {
      console.log(
        `WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`,
      );
      readlineInterface.close();
      process.exit(0);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      readlineInterface.close();
      process.exit(1);
    },
  });

  readlineInterface
    .on('line', (line) => {
      if (
        TradeRepublicAPI.getInstance().getConnectionStatus() !==
        CONNECTION_STATUS.OPEN
      ) {
        console.warn('WebSocket is not open. Cannot send message.');
        readlineInterface.prompt();
        return;
      }

      let messageToSend = line;

      // Handle special case for 'exit' command
      if (messageToSend.toLowerCase() === 'exit') {
        console.log('Closing WebSocket connection...');
        TradeRepublicAPI.getInstance().disconnect();
        return;
      }

      TradeRepublicAPI.getInstance().sendMessage(messageToSend);
      console.log('Message sent:', messageToSend);
      readlineInterface.prompt();
    })
    .on('close', () => {
      console.log('Readline interface closed.');
      if (
        TradeRepublicAPI.getInstance().getConnectionStatus() ===
        CONNECTION_STATUS.OPEN
      ) {
        TradeRepublicAPI.getInstance().disconnect();
      }
    });
};
