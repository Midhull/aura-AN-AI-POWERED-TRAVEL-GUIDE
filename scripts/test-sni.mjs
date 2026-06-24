import pg from 'pg';
const { Client } = pg;

async function checkSNI() {
  console.log("Connecting using SNI servername...");
  const client = new Client({
    host: '52.74.252.201', // Pooler IPv4
    port: 6543,
    user: 'postgres',
    password: 'Zahra@2312',
    database: 'postgres',
    ssl: {
      servername: 'db.ywfarmatbvuhxbyqymax.supabase.co',
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected via SNI!");
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed via SNI: ${err.message}`);
    return false;
  }
}

checkSNI().catch(console.error);
