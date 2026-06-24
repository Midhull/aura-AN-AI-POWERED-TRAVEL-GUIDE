import pg from 'pg';
const { Client } = pg;

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2',
  'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'eu-west-1', 'eu-west-2', 'eu-west-3',
  'eu-central-1', 'eu-central-2', 'eu-north-1',
  'sa-east-1', 'ca-central-1', 'me-central-1',
  'af-south-1'
];

async function checkRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new Client({
    host: host,
    port: 6543,
    user: 'postgres.ywfarmatbvuhxbyqymax',
    password: 'Zahra@2312',
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`SUCCESS: Connected to ${region}!`);
    await client.end();
    return true;
  } catch (err) {
    if (err.message.includes('password authentication failed')) {
      console.log(`AUTH ERROR (Region matches but password wrong?): ${region} - ${err.message}`);
    } else if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      // not the right region
    } else {
      console.log(`Region ${region} failed with: ${err.message}`);
    }
    return false;
  }
}

async function main() {
  console.log("Checking all regions...");
  for (const region of regions) {
    const success = await checkRegion(region);
    if (success) {
      console.log(`Found active region: ${region}`);
      break;
    }
  }
}

main().catch(console.error);
