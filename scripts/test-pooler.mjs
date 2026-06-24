import pg from 'pg';
const { Client } = pg;

async function checkConfig(user, port, ssl) {
  const host = 'aws-0-ap-southeast-1.pooler.supabase.com';
  console.log(`Checking config: user=${user}, port=${port}, ssl=${ssl}`);
  const client = new Client({
    host: host,
    port: port,
    user: user,
    password: 'Zahra@2312',
    database: 'postgres',
    ssl: ssl ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS: Connected! user=${user}, port=${port}, ssl=${ssl}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed: ${err.message}`);
    return false;
  }
}

async function main() {
  const configs = [
    { user: 'postgres.ywfarmatbvuhxbyqymax', port: 6543, ssl: true },
    { user: 'postgres.ywfarmatbvuhxbyqymax', port: 6543, ssl: false },
    { user: 'postgres.ywfarmatbvuhxbyqymax', port: 5432, ssl: true },
    { user: 'postgres.ywfarmatbvuhxbyqymax', port: 5432, ssl: false },
    { user: 'postgres', port: 6543, ssl: true },
    { user: 'postgres', port: 5432, ssl: true }
  ];

  for (const c of configs) {
    const ok = await checkConfig(c.user, c.port, c.ssl);
    if (ok) break;
  }
}

main().catch(console.error);
