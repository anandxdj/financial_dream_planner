import { describe, expect, it } from "vitest";
import {
  canonicalizeUrl,
  isPrivateIpv4,
  isPrivateIpv6,
  safeFetchDocument,
  stripHtmlToText,
  validateSafeUrl,
} from "../../src/modules/research/safe-fetcher";

describe("Safe Fetcher & SSRF Prevention", () => {
  describe("URL canonicalization", () => {
    it("normalizes scheme, lowercases host, strips default 443 port, and strips tracking query parameters", () => {
      const input = "HTTPS://EXAMPLE.com:443/foo//bar/?utm_source=google&b=2&utm_medium=cpc&a=1#section";
      const canonical = canonicalizeUrl(input);
      expect(canonical).toBe("https://example.com/foo/bar/?a=1&b=2");
    });

    it("preserves non-tracking query parameters in sorted order", () => {
      const input = "https://example.com/search?z=9&a=1&fbclid=123&m=5";
      const canonical = canonicalizeUrl(input);
      expect(canonical).toBe("https://example.com/search?a=1&m=5&z=9");
    });
  });

  describe("IP validation rules", () => {
    it("correctly identifies private/reserved IPv4 addresses", () => {
      expect(isPrivateIpv4("127.0.0.1")).toBe(true); // Loopback
      expect(isPrivateIpv4("127.255.255.255")).toBe(true);
      expect(isPrivateIpv4("10.0.0.1")).toBe(true); // Private A
      expect(isPrivateIpv4("10.255.0.1")).toBe(true);
      expect(isPrivateIpv4("172.16.0.1")).toBe(true); // Private B
      expect(isPrivateIpv4("172.31.255.255")).toBe(true);
      expect(isPrivateIpv4("192.168.1.1")).toBe(true); // Private C
      expect(isPrivateIpv4("169.254.169.254")).toBe(true); // Link-local
      expect(isPrivateIpv4("0.0.0.0")).toBe(true); // Current network
      expect(isPrivateIpv4("100.64.0.1")).toBe(true); // CGNAT
      expect(isPrivateIpv4("100.127.255.255")).toBe(true);
      expect(isPrivateIpv4("192.0.2.1")).toBe(true); // TEST-NET-1
      expect(isPrivateIpv4("198.51.100.1")).toBe(true); // TEST-NET-2
      expect(isPrivateIpv4("203.0.113.1")).toBe(true); // TEST-NET-3
      expect(isPrivateIpv4("224.0.0.1")).toBe(true); // Multicast
      expect(isPrivateIpv4("240.0.0.1")).toBe(true); // Reserved
      expect(isPrivateIpv4("255.255.255.255")).toBe(true);

      // Public IPs
      expect(isPrivateIpv4("8.8.8.8")).toBe(false);
      expect(isPrivateIpv4("1.1.1.1")).toBe(false);
      expect(isPrivateIpv4("104.244.42.1")).toBe(false);
    });

    it("correctly identifies private/reserved IPv6 addresses", () => {
      expect(isPrivateIpv6("::1")).toBe(true); // Loopback
      expect(isPrivateIpv6("::")).toBe(true); // Unspecified
      expect(isPrivateIpv6("fc00::1")).toBe(true); // Unique local
      expect(isPrivateIpv6("fd12:3456:789a::1")).toBe(true);
      expect(isPrivateIpv6("fe80::1")).toBe(true); // Link-local
      expect(isPrivateIpv6("ff02::1")).toBe(true); // Multicast
      expect(isPrivateIpv6("2001:db8::1")).toBe(true); // Documentation
      expect(isPrivateIpv6("::ffff:127.0.0.1")).toBe(true); // IPv4-mapped loopback
      expect(isPrivateIpv6("::ffff:192.168.1.1")).toBe(true); // IPv4-mapped private

      // Public IPv6
      expect(isPrivateIpv6("2606:4700:4700::1111")).toBe(false);
    });
  });

  describe("SSRF URL validation", () => {
    const publicDns = async () => ["93.184.216.34"];
    const privateDns = async () => ["127.0.0.1"];

    it("rejects non-HTTPS schemes", async () => {
      await expect(validateSafeUrl("http://example.com", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("ftp://example.com", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("file:///etc/passwd", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("gopher://example.com", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
    });

    it("rejects credentials in URL", async () => {
      await expect(
        validateSafeUrl("https://admin:password@example.com", publicDns),
      ).rejects.toMatchObject({ code: "UNSAFE_SOURCE_URL" });
    });

    it("rejects non-default ports", async () => {
      await expect(validateSafeUrl("https://example.com:8080/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("https://example.com:80/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("https://example.com:22/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
    });

    it("rejects IP literals directly in hostname", async () => {
      await expect(validateSafeUrl("https://127.0.0.1/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("https://10.0.0.1/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("https://[::1]/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("https://169.254.169.254/latest/meta-data", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
    });

    it("rejects local and internal hostnames", async () => {
      await expect(validateSafeUrl("https://localhost/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("https://service.local/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(validateSafeUrl("https://db.internal/test", publicDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
      await expect(
        validateSafeUrl("https://metadata.google.internal/computeMetadata/v1", publicDns),
      ).rejects.toMatchObject({ code: "UNSAFE_SOURCE_URL" });
    });

    it("rejects hostnames resolving to private IP addresses (DNS rebinding / internal routing)", async () => {
      await expect(validateSafeUrl("https://public-looking-domain.com", privateDns)).rejects.toMatchObject({
        code: "UNSAFE_SOURCE_URL",
      });
    });

    it("accepts valid public HTTPS domain", async () => {
      const url = await validateSafeUrl("https://example.com/article", publicDns);
      expect(url.hostname).toBe("example.com");
    });
  });

  describe("HTML sanitization and text extraction", () => {
    it("strips scripts, styles, header, footer, and active content while preserving clean text", () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>RBI Monetary Policy</title>
            <script>alert('xss');</script>
            <style>body { color: red; }</style>
          </head>
          <body>
            <header><nav><a href="/">Home</a></nav></header>
            <main>
              <h1>Repo Rate Update</h1>
              <p>The Reserve Bank of India has kept the policy repo rate unchanged at 6.50% &amp; inflation projection steady.</p>
            </main>
            <footer><p>&copy; 2026 RBI</p></footer>
          </body>
        </html>
      `;

      const result = stripHtmlToText(html);
      expect(result.title).toBe("RBI Monetary Policy");
      expect(result.text).toContain("Repo Rate Update");
      expect(result.text).toContain("Reserve Bank of India has kept the policy repo rate unchanged at 6.50% & inflation projection steady.");
      expect(result.text).not.toContain("alert('xss')");
      expect(result.text).not.toContain("body { color: red; }");
    });
  });

  describe("Safe document fetch execution with mock transport", () => {
    const publicDns = async () => ["93.184.216.34"];

    it("fetches and parses safe HTML document cleanly", async () => {
      const mockFetch = async () =>
        new Response("<html><head><title>Test Page</title></head><body><p>Clean factual content.</p></body></html>", {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });

      const result = await safeFetchDocument("https://example.com/test", {
        dnsLookup: publicDns,
        fetchTransport: mockFetch as any,
      });

      expect(result.title).toBe("Test Page");
      expect(result.excerpt).toBe("Clean factual content.");
      expect(result.canonicalUrl).toBe("https://example.com/test");
      expect(result.contentHash).toHaveLength(64);
    });

    it("detects redirect loops and rejects", async () => {
      const mockFetch = async (url: string) => {
        if (url === "https://example.com/a") {
          return new Response(null, { status: 302, headers: { Location: "https://example.com/b" } });
        }
        return new Response(null, { status: 302, headers: { Location: "https://example.com/a" } });
      };

      await expect(
        safeFetchDocument("https://example.com/a", {
          dnsLookup: publicDns,
          fetchTransport: mockFetch as any,
        }),
      ).rejects.toMatchObject({ code: "UNSAFE_SOURCE_URL" });
    });

    it("rejects DNS answers that change between validation and dispatch", async () => {
      let lookupCount = 0;
      const rebindingDns = async () => {
        lookupCount += 1;
        return lookupCount < 3 ? ["93.184.216.34"] : ["127.0.0.1"];
      };
      const mockFetch = async () => new Response("must not be fetched", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
      await expect(safeFetchDocument("https://example.com", {
        dnsLookup: rebindingDns,
        fetchTransport: mockFetch as any,
      })).rejects.toMatchObject({ code: "UNSAFE_SOURCE_URL" });
    });

    it("rejects cross-scheme redirect to HTTP", async () => {
      const mockFetch = async () =>
        new Response(null, { status: 302, headers: { Location: "http://example.com/insecure" } });

      await expect(
        safeFetchDocument("https://example.com/start", {
          dnsLookup: publicDns,
          fetchTransport: mockFetch as any,
        }),
      ).rejects.toMatchObject({ code: "UNSAFE_SOURCE_URL" });
    });

    it("rejects documents with unsupported content-type", async () => {
      const mockFetch = async () =>
        new Response("binary payload", {
          status: 200,
          headers: { "Content-Type": "application/octet-stream" },
        });

      await expect(
        safeFetchDocument("https://example.com/file.bin", {
          dnsLookup: publicDns,
          fetchTransport: mockFetch as any,
        }),
      ).rejects.toMatchObject({ code: "UNSUPPORTED_CONTENT_TYPE" });
    });

    it("rejects oversized documents", async () => {
      const oversizedBuffer = Buffer.alloc(600 * 1024); // 600 KB > 512 KB limit
      const mockFetch = async () =>
        new Response(oversizedBuffer, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });

      await expect(
        safeFetchDocument("https://example.com/huge.txt", {
          dnsLookup: publicDns,
          fetchTransport: mockFetch as any,
          maxBytes: 512 * 1024,
        }),
      ).rejects.toMatchObject({ code: "DOCUMENT_TOO_LARGE" });
    });
  });
});
