import { app } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';

connectDb()
  .then(() => app.listen(env.PORT, () => console.log(`CivicPulse API listening on :${env.PORT}`)))
  .catch((e) => { console.error('Failed to start:', (e as Error).message); process.exit(1); });
