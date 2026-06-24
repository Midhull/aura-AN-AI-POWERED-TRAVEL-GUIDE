import pg from 'pg';
const { Client } = pg;

async function checkDirect(port) {
  console.log(`Connecting to [2406:da18:167b:f901:5247:8d0f:ea80:27bf]:${port}...`);
  const client = new Client({
    host: '2406:da18:167b:f901:5247:8d0f:ea80:27bf',
    port: port,
    user: 'postgres',
    password: 'Zahra@2312',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log(`SUCCESS: Connected on port ${port}!`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed on port ${port}: ${err.message}`);
    return false;
  }
}

async function main() {
  await checkDirect(5432);
  await checkDirect(6543);
}

main().catch(console.error);
