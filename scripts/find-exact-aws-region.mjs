function expandIPv6(ip) {
  const parts = ip.split('::');
  if (parts.length > 2) throw new Error("Invalid IPv6");
  
  const left = parts[0] ? parts[0].split(':') : [];
  const right = parts[1] ? parts[1].split(':') : [];
  
  const missingCount = 8 - (left.length + right.length);
  const middle = Array(missingCount).fill('0000');
  
  const fullParts = [
    ...left.map(x => x.padStart(4, '0')),
    ...middle,
    ...right.map(x => x.padStart(4, '0'))
  ];
  
  return fullParts.join('');
}

async function main() {
  const res = await fetch("https://ip-ranges.amazonaws.com/ip-ranges.json");
  const data = await res.json();
  
  const ipv6_prefixes = data.ipv6_prefixes;
  const targetIp = "2406:da18:167b:f901:5247:8d0f:ea80:27bf";
  const targetHex = expandIPv6(targetIp);
  
  console.log(`Target hex: ${targetHex}`);
  console.log("Searching exact AWS subnet for target IP...");
  for (const prefix of ipv6_prefixes) {
    const cidr = prefix.ipv6_prefix;
    const [pAddress, pBitsStr] = cidr.split('/');
    const pBits = parseInt(pBitsStr, 10);
    
    const prefixHex = expandIPv6(pAddress);
    
    const bitsToCheck = pBits;
    const charsToCheck = Math.floor(bitsToCheck / 4);
    
    if (targetHex.substring(0, charsToCheck) === prefixHex.substring(0, charsToCheck)) {
      console.log(`MATCH: ${cidr} -> Region: ${prefix.region}, Service: ${prefix.service}`);
    }
  }
}

main().catch(console.error);
