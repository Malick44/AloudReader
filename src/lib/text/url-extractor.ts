/**
 * URL text extractor — fetches a URL and parses HTML with htmlparser2
 * then falls back to Jina Reader API for JS-rendered / blocked pages.
 *
 * Extraction strategy (in priority order):
 *  1. Static HTML parse: <article> → <main> → JSON-LD → embedded JSON → <body>
 *  2. Jina Reader API (r.jina.ai) — handles JS-rendered SPAs, paywalls, etc.
 *     Free, no API key, returns clean markdown text.
 *
 * Design choice: htmlparser2 is used because @mozilla/readability requires a
 * browser-compatible DOMParser that is unavailable in React Native.
 */
import { parseDocument } from 'htmlparser2';

import { TextExtractionError } from './errors';
import { UrlExtractResult } from './types';

// Tags that are always skipped regardless of context.
const ALWAYS_SKIP = new Set([
  'script', 'style', 'noscript', 'meta', 'link',
  'iframe', 'svg', 'path', 'canvas', 'picture', 'source',
]);

// Tags that are skipped only during full-body fallback extraction (noisy).
const BODY_SKIP_EXTRA = new Set([
  'nav', 'aside', 'form', 'button', 'input', 'select', 'textarea',
]);

// Block-level tags — emit a newline before and after.
const BLOCK_TAGS = new Set([
  'p', 'div', 'article', 'section', 'blockquote',
  'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'pre', 'br', 'tr', 'td', 'th', 'main', 'header', 'footer',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectText(nodes: any[], out: string[], extraSkip?: Set<string>): void {
  for (const node of nodes) {
    if (node.type === 'text') {
      if (node.data?.trim()) out.push(node.data as string);
    } else if (node.type === 'tag') {
      const tag: string = node.name?.toLowerCase() ?? '';
      if (ALWAYS_SKIP.has(tag)) continue;
      if (extraSkip?.has(tag)) continue;
      if (BLOCK_TAGS.has(tag)) out.push('\n');
      collectText(node.children ?? [], out, extraSkip);
      if (BLOCK_TAGS.has(tag)) out.push('\n');
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findByTag(nodes: any[], tagName: string): any | null {
  for (const node of nodes) {
    if (node.type === 'tag') {
      if (node.name?.toLowerCase() === tagName) return node;
      const found = findByTag(node.children ?? [], tagName);
      if (found) return found;
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTitle(nodes: any[]): string {
  const titleNode = findByTag(nodes, 'title');
  if (!titleNode) return '';
  return (titleNode.children ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => (c.type === 'text' ? c.data : ''))
    .join('')
    .trim();
}

/** Extract <meta name="description"> / og:description content. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
function findMetaDescription(nodes: any[]): string {
  for (const node of nodes) {
    if (node.type === 'tag') {
      const tag = node.name?.toLowerCase();
      if (tag === 'meta') {
        const name = (node.attribs?.name ?? node.attribs?.property ?? '').toLowerCase();
        const content = node.attribs?.content ?? '';
        if ((name === 'description' || name === 'og:description') && content.trim()) {
          return content.trim();
        }
      }
      const found = findMetaDescription(node.children ?? []);
      if (found) return found;
    }
  }
  return '';
}

/** Try to pull articleBody out of JSON-LD structured data. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractJsonLd(nodes: any[]): string {
  for (const node of nodes) {
    if (
      node.type === 'tag' &&
      node.name?.toLowerCase() === 'script' &&
      node.attribs?.type === 'application/ld+json'
    ) {
      const src = (node.children ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => (c.type === 'text' ? c.data : ''))
        .join('');
      try {
        const data = JSON.parse(src);
        const candidates = Array.isArray(data) ? data : [data];
        for (const obj of candidates) {
          if (obj?.articleBody && typeof obj.articleBody === 'string') {
            return obj.articleBody.trim();
          }
        }
      } catch {
        // ignore malformed JSON-LD
      }
    }
    if (node.children) {
      const found = extractJsonLd(node.children);
      if (found) return found;
    }
  }
  return '';
}

/**
 * Fetches a URL and extracts the readable text content.
 *
 * @param url       - The URL to fetch
 * @param timeoutMs - Request timeout in milliseconds (default 15 000)
 */
export async function extractTextFromUrl(
  url: string,
  timeoutMs = 15_000
): Promise<UrlExtractResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let html: string;
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        // Mimic a real browser to avoid bot-blocking
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!response.ok) {
      throw new TextExtractionError(
        'URL_FETCH_FAILED',
        `HTTP ${response.status} ${response.statusText}`
      );
    }
    html = await response.text();
  } catch (err) {
    if (err instanceof TextExtractionError) throw err;
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    throw new TextExtractionError(
      isTimeout ? 'URL_TIMEOUT' : 'URL_FETCH_FAILED',
      isTimeout ? `Request timed out after ${timeoutMs}ms` : String(err)
    );
  } finally {
    clearTimeout(timer);
  }

  const doc = parseDocument(html, { decodeEntities: true });
  const title = findTitle(doc.children);

  // ── Strategy 1: <article> element ───────────────────────────────────────
  const articleNode = findByTag(doc.children, 'article');
  if (articleNode) {
    const parts: string[] = [];
    collectText(articleNode.children ?? [], parts);
    const text = parts.join('').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length > 100) {
      __DEV__ && console.log(`[url-extractor] extracted via <article>: ${text.length} chars`);
      return { type: 'url', url, title, text };
    }
  }

  // ── Strategy 2: <main> element ──────────────────────────────────────────
  const mainNode = findByTag(doc.children, 'main');
  if (mainNode) {
    const parts: string[] = [];
    collectText(mainNode.children ?? [], parts);
    const text = parts.join('').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length > 100) {
      __DEV__ && console.log(`[url-extractor] extracted via <main>: ${text.length} chars`);
      return { type: 'url', url, title, text };
    }
  }

  // ── Strategy 3: JSON-LD articleBody ────────────────────────────────────
  const jsonLdText = extractJsonLd(doc.children);
  if (jsonLdText.length > 100) {
    __DEV__ && console.log(`[url-extractor] extracted via JSON-LD: ${jsonLdText.length} chars`);
    return { type: 'url', url, title, text: jsonLdText };
  }

  // ── Strategy 4: Full body with noise filtering ──────────────────────────
  const parts: string[] = [];
  collectText(doc.children, parts, BODY_SKIP_EXTRA);
  const bodyText = parts.join('').replace(/\n{3,}/g, '\n\n').trim();
  if (bodyText.length > 200) {
    __DEV__ && console.log(`[url-extractor] extracted via full body: ${bodyText.length} chars`);
    return { type: 'url', url, title, text: bodyText };
  }

  // ── Strategy 5: Jina Reader API — handles JS-rendered / blocked pages ──
  // Free, no API key needed. Converts any URL to clean readable markdown.
  __DEV__ && console.log('[url-extractor] static parse yielded too little; trying Jina Reader');
  return extractViaJinaReader(url, timeoutMs);
}

/**
 * Fetches clean readable text via Jina Reader (r.jina.ai).
 * Works on JS-rendered SPAs, paywalled news sites, etc.
 */
async function extractViaJinaReader(
  url: string,
  timeoutMs: number
): Promise<UrlExtractResult> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let raw: string;
  try {
    const response = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
    });
    if (!response.ok) {
      throw new TextExtractionError(
        'URL_FETCH_FAILED',
        `Jina Reader returned HTTP ${response.status}`
      );
    }
    raw = await response.text();
  } catch (err) {
    if (err instanceof TextExtractionError) throw err;
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    throw new TextExtractionError(
      isTimeout ? 'URL_TIMEOUT' : 'URL_FETCH_FAILED',
      isTimeout ? `Jina Reader timed out after ${timeoutMs}ms` : String(err)
    );
  } finally {
    clearTimeout(timer);
  }

  // Jina returns a markdown document. Extract title from "Title: ..." header.
  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? '';

  // Strip the Jina metadata header block (lines before "Markdown Content:").
  const contentMarker = raw.indexOf('Markdown Content:');
  const text = (contentMarker !== -1 ? raw.slice(contentMarker + 17) : raw).trim();

  if (!text) {
    throw new TextExtractionError(
      'URL_NO_CONTENT',
      'No readable text found. The site may block automated access.'
    );
  }

  __DEV__ && console.log(`[url-extractor] Jina Reader success: ${text.length} chars`);
  return { type: 'url', url, title, text };
}
