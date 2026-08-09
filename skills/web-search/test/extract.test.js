import test from "node:test";
import assert from "node:assert/strict";

import { parseHtmlToContent } from "../lib/extract.js";

test("parseHtmlToContent extracts title and text", async () => {
  const html = `<!doctype html>
  <html><head><title>Hello</title></head>
  <body><article><h1>Hello World</h1><p>This is a test.</p></article></body></html>`;

  const out = await parseHtmlToContent(html, "https://example.com", true);

  assert.ok(out.title.length > 0);
  assert.match(out.content, /Hello World/);
  assert.match(out.content, /This is a test/);
});

test("parseHtmlToContent preserves structured Markdown", async () => {
  const html = `<!doctype html><html><head><title>Guide</title></head><body><main>
    <h1>Guide</h1><pre><code class="language-bash">herdr --help</code></pre>
    <table><thead><tr><th>Action</th><th>Key</th></tr></thead>
    <tbody><tr><td>Split right</td><td>prefix+v</td></tr></tbody></table>
  </main></body></html>`;

  const out = await parseHtmlToContent(html, "https://example.com/guide", false);

  assert.match(out.content, /```bash\nherdr --help\n```/);
  assert.match(out.content, /\| Action \| Key \|/);
  assert.match(out.content, /\| Split right \| prefix\+v \|/);
});

test("parseHtmlToContent truncates by default", async () => {
  const longText = "x".repeat(4000);
  const html = `<!doctype html><html><head><title>Long</title></head><body><p>${longText}</p></body></html>`;
  const out = await parseHtmlToContent(html, "https://example.com", true);
  assert.ok(out.content.length <= 2100);
  assert.match(out.content, /truncated/);
});

test("parseHtmlToContent does not truncate when truncate=false", async () => {
  const longText = "x".repeat(4000);
  const html = `<!doctype html><html><head><title>Long</title></head><body><p>${longText}</p></body></html>`;
  const out = await parseHtmlToContent(html, "https://example.com", false);
  assert.ok(out.content.length >= 3900);
  assert.doesNotMatch(out.content, /truncated/);
});
