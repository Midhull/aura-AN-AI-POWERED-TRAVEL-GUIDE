import pg from 'pg';
const { Client } = pg;

async function checkCustomLookup() {
  console.log("Connecting using custom DNS lookup...");
  const client = new Client({
    host: 'db.ywfarmatbvuhxbyqymax.supabase.co', // Use the tenant hostname
    port: 6543,
    user: 'postgres',
    password: 'Zahra@2312',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    // Custom lookup maps the tenant hostname to the pooler's IPv4 address
    lookup: (hostname, options, callback) => {
      console.log(`Intercepted lookup for: ${hostname}`);
      callback(null, '52.74.252.201', 4);
    },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log("SUCCESS: Connected via Custom DNS Lookup!");
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed via Custom DNS: ${err.message}`);
    return false;
  }
}

checkCustomLookup().catch(console.error);
