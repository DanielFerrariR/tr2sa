import WebSocket from 'ws';
import readline from 'readline';
import { CONNECT_MESSAGE, TR_WEBSOCKET_URL } from './constants/api';

export function connectToTRSocket(trSessionToken: string): WebSocket {
  console.log('Attempting to connect to Trade Republic WebSocket...');
  const websocket = new WebSocket(TR_WEBSOCKET_URL);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Enter message to send: ',
  });

  websocket.onopen = async () => {
    console.log('WebSocket connection opened.');
    console.log('Sending initial WebSocket connect message:', CONNECT_MESSAGE);
    websocket.send(CONNECT_MESSAGE);
  };

  websocket.onmessage = async (event) => {
    const message = event.data.toString();

    // Check for the "connected" message and display the important logs
    if (message === 'connected') {
      // Clear line and move cursor before printing the connection message
      // to ensure it appears cleanly above the prompt if any.
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);

      console.log('Received "connected" message from server.');
      console.log('\n--- WebSocket Ready ---');
      console.log(
        'You can now type messages to send. The number at the beginning of the message is the subscription ID and needs to be unique for each subscription.'
      );
      // Example with correct token interpolation and double quotes for JSON
      console.log(
        `Example: sub 1 {"type":"availableCash", "token": "${trSessionToken}"}`
      );
      console.log('Type "exit" to close the connection.');
      rl.prompt(true); // Display the prompt after the welcome messages
    } else {
      // For any other message, clear the current line and re-prompt
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      console.log('Received WebSocket message:', message);
      rl.prompt(true); // Re-display the prompt after the message
    }
  };

  websocket.onclose = (event) => {
    console.log(
      `WebSocket connection closed: Code ${event.code}, Reason: ${event.reason}`
    );
    rl.close();
    process.exit(0);
  };

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
    rl.close();
    process.exit(1);
  };

  rl.on('line', (line) => {
    if (websocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not open. Cannot send message.');
      rl.prompt();
      return;
    }

    const messageToSend = line;

    if (messageToSend.toLowerCase() === 'exit') {
      console.log('Closing WebSocket connection...');
      websocket.close();
      return;
    }

    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(messageToSend);
      console.log('Message sent:', messageToSend);
    } else {
      console.warn('WebSocket is not ready to send messages yet.');
    }
    rl.prompt();
  }).on('close', () => {
    console.log('Readline interface closed.');
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.close();
    }
  });

  return websocket;
}
