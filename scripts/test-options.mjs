import pg from 'pg';
const { Client } = pg;

async function check(optionsStr, user = 'postgres') {
  console.log(`Checking connection with user=${user}, options=${optionsStr}`);
  const client = new Client({
    host: '52.74.252.201',
    port: 6543,
    user: user,
    password: 'Zahra@2312',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    options: optionsStr,
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log("SUCCESS!");
    const res = await client.query("SELECT version();");
    console.log(res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed: ${err.message}`);
    return false;
  }
}

async function main() {
  // Try different options formats
  await check('-c sni_hostname=db.ywfarmatbvuhxbyqymax.supabase.co');
  await check('-c external_id=ywfarmatbvuhxbyqymax');
  await check('project=ywfarmatbvuhxbyqymax');
  await check('-c project=ywfarmatbvuhxbyqymax');
}

main().catch(console.error);
