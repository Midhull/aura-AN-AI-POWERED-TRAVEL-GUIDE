import dns from 'dns';
import pg from 'pg';
const { Client } = pg;

const originalLookup = dns.lookup;

dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname === 'db.ywfarmatbvuhxbyqymax.supabase.co') {
    if (options.all) {
      return callback(null, [{ address: '52.74.252.201', family: 4 }], 4);
    }
    return callback(null, '52.74.252.201', 4);
  }
  return originalLookup(hostname, options, callback);
};

async function checkUser(user) {
  console.log(`Checking user: ${user}`);
  const client = new Client({
    host: 'db.ywfarmatbvuhxbyqymax.supabase.co',
    port: 6543,
    user: user,
    password: 'Zahra@2312',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS: Connected as user ${user}!`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed for user ${user}: ${err.message}`);
    return false;
  }
}

async function main() {
  await checkUser('postgres');
  await checkUser('postgres.ywfarmatbvuhxbyqymax');
}

main().catch(console.error);
