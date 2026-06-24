async function main() {
  const res = await fetch("https://ip-ranges.amazonaws.com/ip-ranges.json");
  const data = await res.json();
  
  const ipv6_prefixes = data.ipv6_prefixes;
  const targetIp = "2406:da18:167b:f901:5247:8d0f:ea80:27bf";
  
  console.log("Searching AWS prefixes...");
  for (const prefix of ipv6_prefixes) {
    if (prefix.ipv6_prefix.startsWith("2406:da18")) {
      console.log(`Found candidate prefix: ${prefix.ipv6_prefix} in region: ${prefix.region} for service: ${prefix.service}`);
    }
  }
}

main().catch(console.error);
