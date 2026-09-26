import { AppError } from "../../shared/errors/app-error";

export interface SearchCandidate {
  url: string;
  title: string;
  content: string;
  score?: number;
  publishedDate?: string;
}

export interface SearchOptions {
  maxResults?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface SearchProvider {
  readonly providerName: string;
  search(query: string, options?: SearchOptions): Promise<SearchCandidate[]>;
}

export interface TavilyConfig {
  apiKey?: string;
  baseUrl?: string;
  fetchTransport?: (url: string, init?: RequestInit) => Promise<Response>;
}

export class TavilySearchAdapter implements SearchProvider {
  readonly providerName = "tavily";
  private apiKey: string;
  private baseUrl: string;
  private fetchTransport: (url: string, init?: RequestInit) => Promise<Response>;

  constructor(config: TavilyConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.TAVILY_API_KEY ?? "";
    this.baseUrl = (config.baseUrl ?? process.env.TAVILY_BASE_URL ?? "https://api.tavily.com").replace(/\/+$/, "");
    this.fetchTransport = config.fetchTransport ?? fetch;
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchCandidate[]> {
    if (!this.apiKey || this.apiKey.trim() === "") {
      throw new AppError(
        502,
        "SEARCH_PROVIDER_ERROR",
        "Tavily search provider is not configured: TAVILY_API_KEY is missing or empty. Please set TAVILY_API_KEY in backend/.env",
      );
    }

    const maxResults = options.maxResults ?? 5;
    const timeoutMs = options.timeoutMs ?? 10000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchTransport(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          max_results: maxResults,
          search_depth: "basic",
          include_answer: false,
          include_raw_content: false,
        }),
        signal: options.signal ?? controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new AppError(
            502,
            "SEARCH_PROVIDER_ERROR",
            "Tavily search failed with status 401 (Unauthorized). Please check that TAVILY_API_KEY in backend/.env is valid.",
          );
        }
        throw new AppError(502, "SEARCH_PROVIDER_ERROR", `Tavily search failed with status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const results: SearchCandidate[] = [];

      if (data && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item && typeof item.url === "string" && typeof item.content === "string") {
            results.push({
              url: item.url,
              title: item.title || "",
              content: item.content,
              score: typeof item.score === "number" ? item.score : undefined,
              publishedDate: item.published_date || undefined,
            });
          }
        }
      }

      return results;
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      if (err.name === "AbortError") {
        throw new AppError(504, "SEARCH_TIMEOUT", "Search provider timed out");
      }
      throw new AppError(502, "SEARCH_PROVIDER_ERROR", "Search provider request failed");
    } finally {
      clearTimeout(timer);
    }
  }
}
