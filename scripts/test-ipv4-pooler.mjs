import pg from 'pg';
const { Client } = pg;

async function check() {
  const configs = [
    { host: '52.74.252.201', user: 'postgres.ywfarmatbvuhxbyqymax', port: 6543, ssl: { rejectUnauthorized: false } },
    { host: '52.74.252.201', user: 'postgres.ywfarmatbvuhxbyqymax', port: 5432, ssl: { rejectUnauthorized: false } },
  ];

  for (const c of configs) {
    console.log(`Trying host=${c.host}, user=${c.user}, port=${c.port}, ssl=rejectUnauthorized:false`);
    const client = new Client({
      host: c.host,
      port: c.port,
      user: c.user,
      password: 'Zahra@2312',
      database: 'postgres',
      ssl: c.ssl,
      connectionTimeoutMillis: 5000
    });
    try {
      await client.connect();
      console.log("SUCCESS!");
      const res = await client.query("SELECT version();");
      console.log(res.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }
}

check().catch(console.error);
