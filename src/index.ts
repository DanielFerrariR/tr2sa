import { login } from './login';
import { connectToTRSocket } from './connectToTRSocket';

async function main() {
  const trSessionToken = await login();

  if (!trSessionToken) {
    console.error('Login failed. Exiting.');
    return;
  }

  connectToTRSocket(trSessionToken);
}

main();
