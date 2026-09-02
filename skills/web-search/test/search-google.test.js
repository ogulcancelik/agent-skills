import test from "node:test";
import assert from "node:assert/strict";

import { resolveGoogleResultLink } from "../lib/search.js";

test("resolveGoogleResultLink keeps direct and legacy result links", async () => {
  const context = {
    request: {
      get: () => {
        throw new Error("unexpected redirect request");
      },
    },
  };

  assert.equal(
    await resolveGoogleResultLink(context, "https://example.com/page"),
    "https://example.com/page",
  );
  assert.equal(
    await resolveGoogleResultLink(context, "/url?q=https%3A%2F%2Fexample.org%2Fpage"),
    "https://example.org/page",
  );
});

test("resolveGoogleResultLink follows opaque Google redirects", async () => {
  let requestedUrl;
  let requestedOptions;
  const context = {
    request: {
      get: async (url, options) => {
        requestedUrl = url;
        requestedOptions = options;
        return {
          headers: () => ({ location: "https://openai.com/news/" }),
        };
      },
    },
  };

  const result = await resolveGoogleResultLink(context, "/goto?url=opaque-token");

  assert.equal(result, "https://openai.com/news/");
  assert.equal(requestedUrl, "https://www.google.com/goto?url=opaque-token");
  assert.equal(requestedOptions.maxRedirects, 0);
});

test("resolveGoogleResultLink rejects Google-internal redirect targets", async () => {
  const context = {
    request: {
      get: async () => ({
        headers: () => ({ location: "https://www.google.com/search?q=other" }),
      }),
    },
  };

  assert.equal(await resolveGoogleResultLink(context, "/goto?url=opaque-token"), null);
});
