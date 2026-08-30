import { describe, expect, it } from "vitest";
import { TavilySearchAdapter } from "../../src/modules/research/search-provider";
import {
  classifySourceType,
  compareEvidenceRank,
  extractPublisher,
  getSourceTypeRank,
} from "../../src/modules/research/source-classifier";

describe("Search & Source Classifier Unit Tests", () => {
  describe("Source Type Classification & Ranking Hierarchy", () => {
    it("correctly classifies government/regulator domains as rank 1", () => {
      expect(classifySourceType("https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx")).toBe("government_regulator");
      expect(classifySourceType("https://www.sebi.gov.in/legal/circulars")).toBe("government_regulator");
      expect(classifySourceType("https://incometaxindia.gov.in/pages/rules")).toBe("government_regulator");
      expect(classifySourceType("https://pfrda.org.in/guidelines")).toBe("government_regulator");
      expect(classifySourceType("https://epfindia.gov.in/circulars")).toBe("government_regulator");
      expect(getSourceTypeRank("government_regulator")).toBe(1);
    });

    it("correctly classifies exchange official filings as rank 2", () => {
      expect(classifySourceType("https://www.nseindia.com/market-data")).toBe("exchange_official_filing");
      expect(classifySourceType("https://bseindia.com/corporates")).toBe("exchange_official_filing");
      expect(getSourceTypeRank("exchange_official_filing")).toBe(2);
    });

    it("correctly classifies official providers as rank 3", () => {
      expect(classifySourceType("https://www.amfiindia.com/research-information")).toBe("official_provider");
      expect(classifySourceType("https://npstrust.org.in/returns")).toBe("official_provider");
      expect(classifySourceType("https://licindia.in/plans")).toBe("official_provider");
      expect(classifySourceType("https://www.camsonline.com/investor")).toBe("official_provider");
      expect(getSourceTypeRank("official_provider")).toBe(3);
    });

    it("correctly classifies structured finance APIs as rank 4", () => {
      expect(classifySourceType("https://api.marketdata.com/v1/rates")).toBe("structured_finance_api");
      expect(getSourceTypeRank("structured_finance_api")).toBe(4);
    });

    it("correctly classifies reputable publications as rank 5", () => {
      expect(classifySourceType("https://www.livemint.com/money/personal-finance")).toBe("reputable_publication");
      expect(classifySourceType("https://economictimes.indiatimes.com/wealth/tax")).toBe("reputable_publication");
      expect(classifySourceType("https://www.moneycontrol.com/news/business")).toBe("reputable_publication");
      expect(classifySourceType("https://www.reuters.com/business/finance")).toBe("reputable_publication");
      expect(getSourceTypeRank("reputable_publication")).toBe(5);
    });

    it("defaults other sources to community with rank 6", () => {
      expect(classifySourceType("https://randomblog.com/investing-tips")).toBe("community");
      expect(getSourceTypeRank("community")).toBe(6);
    });

    it("extracts clean publisher names from URLs", () => {
      expect(extractPublisher("https://www.rbi.org.in/press")).toBe("rbi.org.in");
      expect(extractPublisher("https://livemint.com/news")).toBe("livemint.com");
    });

    it("sorts evidence by source rank, then confidence desc, then createdAt asc", () => {
      const now = new Date();
      const evCommunity = {
        sourceType: "community",
        confidence: "0.95",
        createdAt: new Date(now.getTime() + 1000),
      };
      const evGov = {
        sourceType: "government_regulator",
        confidence: "0.80",
        createdAt: new Date(now.getTime() + 2000),
      };
      const evGovHighConf = {
        sourceType: "government_regulator",
        confidence: "0.99",
        createdAt: new Date(now.getTime() + 3000),
      };
      const evPub = {
        sourceType: "reputable_publication",
        confidence: "0.90",
        createdAt: new Date(now.getTime() + 500),
      };

      const list = [evCommunity, evPub, evGov, evGovHighConf];
      list.sort(compareEvidenceRank);

      expect(list[0]).toBe(evGovHighConf); // Gov rank 1, conf 0.99
      expect(list[1]).toBe(evGov); // Gov rank 1, conf 0.80
      expect(list[2]).toBe(evPub); // Publication rank 5
      expect(list[3]).toBe(evCommunity); // Community rank 6
    });
  });

  describe("Tavily Search Adapter", () => {
    it("normalizes Tavily search response candidates properly", async () => {
      const mockFetch = async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                url: "https://rbi.org.in/press/repo-rate-2026",
                title: "Monetary Policy Statement",
                content: "Repo rate remains at 6.5%.",
                score: 0.92,
                published_date: "2026-08-01T00:00:00Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );

      const adapter = new TavilySearchAdapter({
        apiKey: "fake-key",
        baseUrl: "https://api.tavily.com",
        fetchTransport: mockFetch as any,
      });

      const results = await adapter.search("current rbi repo rate");
      expect(results).toHaveLength(1);
      expect(results[0].url).toBe("https://rbi.org.in/press/repo-rate-2026");
      expect(results[0].title).toBe("Monetary Policy Statement");
      expect(results[0].score).toBe(0.92);
      expect(results[0].publishedDate).toBe("2026-08-01T00:00:00Z");
    });
  });
});
