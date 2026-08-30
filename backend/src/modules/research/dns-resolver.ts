import dns from "node:dns/promises";

export type DnsLookupFn = (hostname: string) => Promise<string[]>;

export const defaultDnsLookup: DnsLookupFn = async (hostname: string): Promise<string[]> => {
  try {
    const results = await dns.lookup(hostname, { all: true });
    return results.map((r) => r.address);
  } catch {
    return [];
  }
};
