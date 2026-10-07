export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

const JUNK_DOMAINS = [
  "github.com",
  "gist.github.com",
  "gitlab.com",
  "zhihu.com",
  "reddit.com",
  "quora.com",
  "pinterest.com",
  "tiktok.com",
  "instagram.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "chat.openai.com",
  "openai.com",
  "csdn.net",
  "bilibili.com",
  "baidu.com",
];

function isJunkUrl(urlStr: string): boolean {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return JUNK_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return true;
  }
}

function getDomainAuthority(urlStr: string, focusMode?: string): number {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();

    // High priority for academic and scientific publications in Academic Nexus mode
    if (focusMode === "academic") {
      if (
        host.includes("arxiv.org") ||
        host.includes("nature.com") ||
        host.includes("science.org") ||
        host.includes("ieee.org") ||
        host.includes("acm.org") ||
        host.includes("jstor.org") ||
        host.includes("sciencedirect.com") ||
        host.includes("springer.com") ||
        host.includes("ncbi.nlm.nih.gov") ||
        host.includes("nih.gov") ||
        host.includes("researchgate.net") ||
        host.includes("scholar.google") ||
        host.endsWith(".edu")
      ) {
        return 110;
      }
    }

    if (
      host.endsWith(".gov") ||
      host.endsWith(".gov.bd") ||
      host.endsWith(".gov.il") ||
      host.endsWith(".edu") ||
      host.endsWith(".mil")
    ) {
      return 100;
    }
    if (host.includes("wikipedia.org") || host.includes("britannica.com")) return 90;
    if (
      host.includes("reuters.com") ||
      host.includes("apnews.com") ||
      host.includes("bbc.com") ||
      host.includes("bbc.co.uk") ||
      host.includes("aljazeera.com")
    ) {
      return 85;
    }
    if (
      host.includes("thedailystar.net") ||
      host.includes("dhakatribune.com") ||
      host.includes("prothomalo.com") ||
      host.includes("timesofisrael.com") ||
      host.includes("haaretz.com")
    ) {
      return 80;
    }
    if (
      host.includes("nytimes.com") ||
      host.includes("theguardian.com") ||
      host.includes("bloomberg.com") ||
      host.includes("cnn.com")
    ) {
      return 75;
    }
    return 50;
  } catch {
    return 0;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

/**
 * Searches DuckDuckGo HTML endpoint with junk filtering.
 */
async function searchDuckDuckGo(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const html = await res.text();
    const results: SearchResult[] = [];
    const blocks = html.split('class="result results_links');

    for (let i = 1; i < blocks.length && results.length < maxResults; i++) {
      const block = blocks[i];
      const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (!titleMatch) continue;

      const rawUrl = titleMatch[1];
      let destUrl = rawUrl;

      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch) {
        destUrl = decodeURIComponent(uddgMatch[1]);
      } else if (rawUrl.startsWith("//")) {
        destUrl = "https:" + rawUrl;
      }

      if (isJunkUrl(destUrl)) continue;

      const rawTitle = titleMatch[2].replace(/<[^>]+>/g, "");
      const rawSnippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, "") : "";

      const title = decodeHtmlEntities(rawTitle);
      const snippet = decodeHtmlEntities(rawSnippet);

      if (title && destUrl && (destUrl.startsWith("http://") || destUrl.startsWith("https://"))) {
        results.push({ title, url: destUrl, snippet });
      }
    }

    return results;
  } catch (err) {
    console.warn("DuckDuckGo search error:", err);
    return [];
  }
}

/**
 * Searches Bing directly with strict junk domain filtering and URL decoding.
 */
async function searchBing(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const html = await res.text();
    const blocks = html.split('<li class="b_algo"');
    const results: SearchResult[] = [];

    for (let i = 1; i < blocks.length && results.length < maxResults; i++) {
      const block = blocks[i];
      const h2Match = block.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      const pMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

      if (h2Match) {
        const rawUrl = h2Match[1].replace(/&amp;/g, "&");
        let destUrl = rawUrl;

        // Decode Bing redirect tracking parameter
        const uMatch = rawUrl.match(/[?&]u=a1([a-zA-Z0-9_-]+)/);
        if (uMatch) {
          try {
            const b64 = uMatch[1].replace(/-/g, "+").replace(/_/g, "/");
            const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
            destUrl = Buffer.from(b64 + pad, "base64").toString("utf8");
          } catch {}
        }

        if (isJunkUrl(destUrl)) continue;

        const title = decodeHtmlEntities(h2Match[2].replace(/<[^>]+>/g, "").trim());
        const snippet = pMatch ? decodeHtmlEntities(pMatch[1].replace(/<[^>]+>/g, "").trim()) : "";

        if (title && destUrl && (destUrl.startsWith("http://") || destUrl.startsWith("https://"))) {
          results.push({ title, url: destUrl, snippet });
        }
      }
    }

    return results;
  } catch (err) {
    console.warn("Bing search error:", err);
    return [];
  }
}

/**
 * Searches Wikipedia OpenSearch API as tertiary fallback.
 */
async function searchWikipedia(query: string, maxResults = 3): Promise<SearchResult[]> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${maxResults}&namespace=0&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];

    const data = await res.json();
    const titles: string[] = data[1] || [];
    const descriptions: string[] = data[2] || [];
    const links: string[] = data[3] || [];

    const results: SearchResult[] = [];
    for (let i = 0; i < titles.length; i++) {
      if (titles[i] && links[i] && !isJunkUrl(links[i])) {
        results.push({
          title: titles[i],
          url: links[i],
          snippet: descriptions[i] || `Wikipedia article about ${titles[i]}`,
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Decomposes multi-part or compound questions into targeted sub-queries.
 * e.g. "who is the current pm on bangladesh and israel" -> ["current prime minister bangladesh 2024", "current prime minister israel"]
 */
function decomposeQuery(query: string): string[] {
  const q = query.trim();
  const lower = q.toLowerCase();

  if (/\b(and|vs|versus)\b/i.test(lower)) {
    let role = "";
    if (/\b(pm|prime minister)\b/i.test(lower)) role = "prime minister";
    else if (/\b(president)\b/i.test(lower)) role = "president";
    else if (/\b(capital)\b/i.test(lower)) role = "capital";
    else if (/\b(ceo)\b/i.test(lower)) role = "ceo";
    else if (/\b(price)\b/i.test(lower)) role = "price";

    const cleaned = lower
      .replace(/^(who is|who are|what is|tell me|current|the|on|of|in|\?)+/gi, "")
      .replace(/\b(pm|prime minister|president|capital|ceo|price)\b/gi, "")
      .trim();

    const parts = cleaned
      .split(/\band\b|\bvs\b|\bversus\b/i)
      .map((s) => s.trim().replace(/\?+$/, ""))
      .filter(Boolean);

    if (parts.length >= 2) {
      return parts.map((part) => `${role ? role + " " : ""}${part} 2024`);
    }
  }

  return [q];
}

/**
 * Resilient multi-provider search pipeline with query decomposition and domain authority ranking.
 */
export async function searchWeb(
  query: string,
  maxResults = 5,
  focusMode?: string
): Promise<SearchResult[]> {
  const cleanQuery = query.trim().replace(/\s+/g, " ");
  if (!cleanQuery) return [];

  let subQueries = decomposeQuery(cleanQuery);

  // If Academic focus mode, ensure scholarly query expansion
  if (focusMode === "academic") {
    subQueries = subQueries.flatMap((sq) => [
      sq,
      `${sq} arxiv research paper OR scholarly journal`,
    ]);
  }

  const collected: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const sq of subQueries) {
    // 1. DuckDuckGo primary
    let res = await searchDuckDuckGo(sq, 4);

    // 2. Bing fallback if DDG returned 0
    if (res.length === 0) {
      res = await searchBing(sq, 4);
    }

    // 3. Wikipedia fallback if still 0
    if (res.length === 0) {
      res = await searchWikipedia(sq, 2);
    }

    for (const r of res) {
      if (!seenUrls.has(r.url) && !isJunkUrl(r.url)) {
        seenUrls.add(r.url);
        collected.push(r);
      }
    }
  }

  // Sort by domain authority (weighting academic publications higher in academic mode)
  return collected
    .sort((a, b) => getDomainAuthority(b.url, focusMode) - getDomainAuthority(a.url, focusMode))
    .slice(0, maxResults);
}

export interface QueryIntent {
  shouldSearch: boolean;
  route: "MODEL" | "WEB_SEARCH";
  reason: string;
  category: string;
  confidence: number;
}

/**
 * Intelligent Dual-Engine Intent Classifier:
 * High-precision algorithm determining whether a query should route directly to the
 * base model's internal parametric weights or trigger real-time internet search grounding.
 */
export function classifyQueryIntent(prompt: string): QueryIntent {
  const p = prompt.trim().toLowerCase();
  if (!p) {
    return {
      shouldSearch: false,
      route: "MODEL",
      reason: "Empty prompt",
      category: "empty",
      confidence: 1.0,
    };
  }

  // --------------------------------------------------------------------------
  // Stage 1: Explicit Search Command Overrides
  // --------------------------------------------------------------------------
  if (
    p.startsWith("/search") ||
    p.startsWith("search:") ||
    /\b(search the (web|internet) for|google for|look up online|browse online for|find on the internet)\b/.test(p)
  ) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Explicit user web search command",
      category: "explicit_command",
      confidence: 0.99,
    };
  }

  // --------------------------------------------------------------------------
  // Stage 2: Strict Model Parametric Knowledge Domains (NO Web Search)
  // --------------------------------------------------------------------------

  // A. Casual greetings, pleasantries & meta conversation
  if (
    /^(hi|hello|hey|yo|greetings|good\s+(morning|afternoon|evening|night)|howdy|sup|how\s+are\s+you|who\s+are\s+you|what\s+can\s+you\s+do|thanks|thank\s+you|help\s+me)[.!?]?$/.test(p)
  ) {
    return {
      shouldSearch: false,
      route: "MODEL",
      reason: "Conversational greeting or pleasantry",
      category: "conversation",
      confidence: 0.98,
    };
  }

  // B. Creative writing, editing, translation & textual transformation
  const isCreativeOrTextTask =
    /\b(write\s+(a\s+|an\s+)?(poem|story|haiku|sonnet|song|essay|speech|email|cover\s+letter|memo|letter|script|dialogue|joke|riddle|limerick))\b/.test(p) ||
    /\b(rewrite|paraphrase|rephrase|proofread|critique|edit|summarize\s+this|improve\s+this|make\s+it\s+(shorter|longer|formal|casual|funny))\b/.test(p) ||
    /\b(translate\s+(this\s+|the\s+following\s+)?to\s+(spanish|french|german|japanese|chinese|arabic|bengali|hindi|russian|italian|portuguese))\b/.test(p) ||
    /\b(convert\s+(this\s+)?(to|into)\s+(json|yaml|markdown|csv|html|xml|table))\b/.test(p);

  if (isCreativeOrTextTask) {
    return {
      shouldSearch: false,
      route: "MODEL",
      reason: "Creative, linguistic synthesis, or text transformation task",
      category: "creative_synthesis",
      confidence: 0.95,
    };
  }

  // C. Mathematics, formal logic, calculation & brain teasers
  const isMathOrLogic =
    /\b(calculate|solve\s+for|derivative\s+of|integral\s+of|matrix\s+multiplication|eigenvalue|quadratic\s+formula|pythagorean|fibonacci|factorial|prime\s+number|permutation|combination|truth\s+table|syllogism|deductive\s+reasoning|bayes\s+theorem|standard\s+deviation)\b/.test(p) ||
    /^(what\s+is|evaluate|calculate|solve)\s+[\d\(\)\.\+\-\*\/\^\=x\s]{3,}\??$/.test(p);

  if (isMathOrLogic) {
    return {
      shouldSearch: false,
      route: "MODEL",
      reason: "Mathematical calculation, algebraic reasoning, or formal logic",
      category: "math_logic",
      confidence: 0.96,
    };
  }

  // D. Programming, software engineering, algorithms & data structures (without 2025/2026 breaking news)
  const isPureCode =
    /\b(write\s+(a\s+|an\s+)?(function|script|algorithm|regex|sql\s+query|component|hook|class|decorator|middleware|test\s+suite|dockerfile))\b/.test(p) ||
    /\b(how\s+to\s+(implement|code|build|refactor|debug|optimize|sort|traverse|reverse|invert))\b/.test(p) ||
    /\b(binary\s+tree|linked\s+list|hash\s+map|trie|graph\s+traversal|dijkstra|quicksort|merge\s+sort|dynamic\s+programming|big\s+o|memoization|recursion)\b/.test(p) ||
    /\b(typescript|javascript|python|rust|c\+\+|golang|java|c#|sql|html|css|tailwind|bash|zsh|git\s+rebase|git\s+merge|docker|kubernetes)\b/.test(p);

  const hasRecentTechReleaseMarker =
    /\b(2025|2026|claude\s*3\.7|gpt-4o|o1|o3|deepseek\s*v3|deepseek\s*r1|gemini\s*2|react\s*19|next\.?js\s*15|ios\s*18|blackwell|rtx\s*5090)\b/.test(p);

  if (isPureCode && !hasRecentTechReleaseMarker) {
    return {
      shouldSearch: false,
      route: "MODEL",
      reason: "Software engineering, algorithmic logic, or programming implementation",
      category: "software_engineering",
      confidence: 0.94,
    };
  }

  // E. Timeless / Canonical Science, Humanities, History & Philosophy
  const isCanonicalScienceOrHumanities =
    /\b(photosynthesis|mitochondria|mitosis|meiosis|dna|rna|cellular\s+respiration|general\s+relativity|quantum\s+entanglement|superposition|schrodinger|thermodynamics|gravity|speed\s+of\s+light|plate\s+tectonics|electromagnetism|newtonian\s+mechanics)\b/.test(p) ||
    /\b(julius\s+caesar|alexander\s+the\s+great|napoleon|abraham\s+lincoln|george\s+washington|winston\s+churchill|cleopatra|marcus\s+aurelius|socrates|plato|aristotle|immanuel\s+kant|friedrich\s+nietzsche|stoicism|existentialism|utilitarianism)\b/.test(p) ||
    /\b(renaissance|french\s+revolution|world\s+war\s+(1|2|i|ii)|ancient\s+(rome|greece|egypt)|industrial\s+revolution|magna\s+carta|cold\s+war)\b/.test(p) ||
    /\b(shakespeare|hamlet|macbeth|odyssey|iliad|dante|inferno|don\s+quixote|war\s+and\s+peace|1984\s+by\s+george\s+orwell)\b/.test(p);

  if (isCanonicalScienceOrHumanities && !/\b(today|yesterday|this\s+year|latest|news|2024|2025|2026)\b/.test(p)) {
    return {
      shouldSearch: false,
      route: "MODEL",
      reason: "Canonical scientific principles, historical figures, or philosophical literature",
      category: "canonical_knowledge",
      confidence: 0.93,
    };
  }

  // --------------------------------------------------------------------------
  // Stage 3: Positive Triggers for Live Internet Grounding (Web Search)
  // --------------------------------------------------------------------------

  // A. Temporal recency, live time indicators
  if (
    /\b(news|breaking\s+news|today|yesterday|this\s+week|this\s+month|this\s+year|recently|latest\s+update|current\s+status|right\s+now|currently\s+happening|live\s+stream|schedule\s+for\s+(2025|2026))\b/.test(p)
  ) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Temporal recency or breaking live information indicator",
      category: "temporal_recency",
      confidence: 0.94,
    };
  }

  // B. Specific future/recent years beyond common training horizons
  if (/\b(2025|2026)\b/.test(p)) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Query references post-cutoff calendar year (2025/2026)",
      category: "future_year",
      confidence: 0.92,
    };
  }

  // C. Live financial tickers, crypto, exchange rates & commodities
  if (
    /\b(stock\s+price|share\s+price|market\s+cap|crypto\s+price|bitcoin\s+price|btc\s+price|eth\s+price|solana\s+price|exchange\s+rate|dollar\s+rate|taka\s+rate|gold\s+price|crude\s+oil\s+price|nasdaq|s&p\s*500)\b/.test(p) ||
    /\b(how\s+much\s+is\s+(bitcoin|btc|eth|sol|gold|oil)\s+(today|now|worth))\b/.test(p)
  ) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Live financial market, commodity, or cryptocurrency pricing",
      category: "financial_markets",
      confidence: 0.96,
    };
  }

  // D. Live meteorological / weather conditions
  if (
    /\b(weather\s+in|temperature\s+in|forecast\s+for|will\s+it\s+rain\s+today|cyclone\s+warning|hurricane\s+tracker|air\s+quality\s+index\s+in)\b/.test(p)
  ) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Real-time weather observation or environmental forecast",
      category: "live_weather",
      confidence: 0.95,
    };
  }

  // E. Live sports tournaments, fixtures & results
  if (
    /\b(match\s+score|who\s+won\s+(the\s+match|yesterday|today)|ipl\s+standings|premier\s+league\s+table|world\s+cup\s+qualifier|champions\s+league\s+score|olympic\s+medal\s+tally)\b/.test(p)
  ) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Live sports fixtures, scores, or tournament rankings",
      category: "live_sports",
      confidence: 0.95,
    };
  }

  // F. Dynamic real-world political leadership, elections & cabinet transitions
  if (
    /\b(current\s+(prime\s+minister|pm|president|ceo|chancellor|head\s+of\s+state|chief\s+adviser))\b/.test(p) ||
    /\b(who\s+is\s+(the\s+)?(current\s+)?(prime\s+minister|pm|president|ceo|chief\s+adviser)\s+of)\b/.test(p) ||
    /\b(interim\s+government|muhammad\s+yunus|election\s+results|cabinet\s+reshuffle|who\s+won\s+the\s+election)\b/.test(p)
  ) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Dynamic political leadership, head of state, or government transition",
      category: "political_leadership",
      confidence: 0.96,
    };
  }

  // G. Frontier AI models, recent hardware announcements & breaking tech
  if (
    /\b(claude\s*3\.7|deepseek\s*v3|deepseek\s*r1|gpt-4o|o1-preview|o3-mini|gemini\s*2\.0|llama\s*3\.3|blackwell\s*gpu|rtx\s*5090|iphone\s*16|iphone\s*17|galaxy\s*s25)\b/.test(p)
  ) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Frontier AI model release, modern hardware, or breaking tech specs",
      category: "frontier_tech",
      confidence: 0.93,
    };
  }

  // H. Regional live queries (e.g., Bengali live queries)
  if (
    /\b(ajker\s+khobor|dam\s+koto|ajke\s+ki\s+hoyeche|ekhon\s+kar\s+somoy)\b/.test(p) ||
    (/[\u0980-\u09FF]/.test(p) && /\b(আজকের|খবর|দাম|বর্তমান)\b/.test(p))
  ) {
    return {
      shouldSearch: true,
      route: "WEB_SEARCH",
      reason: "Regional live inquiries requiring current localized data",
      category: "regional_news",
      confidence: 0.93,
    };
  }

  // --------------------------------------------------------------------------
  // Stage 4: Default Stance — Route to Model
  // --------------------------------------------------------------------------
  // For conceptual, explanatory, architectural, or historical inquiries that
  // lack explicit temporal markers, the base LLM provides substantially superior
  // coherence, deeper synthesis, and faster response times than raw web snippets.
  return {
    shouldSearch: false,
    route: "MODEL",
    reason: "Conceptual or general inquiry suited for internal parametric model reasoning",
    category: "general_knowledge",
    confidence: 0.85,
  };
}

/**
 * High-accuracy Smart Router:
 * Returns boolean whether real-time web search should be executed for the prompt.
 */
export function shouldSearchWeb(prompt: string): boolean {
  return classifyQueryIntent(prompt).shouldSearch;
}
