import { Defuddle } from "defuddle/node";
import { JSDOM, VirtualConsole } from "jsdom";

const jsdomVirtualConsole = new VirtualConsole();
jsdomVirtualConsole.on("jsdomError", (err) => {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("Could not parse CSS stylesheet")) return;
});

export async function parseHtmlToContent(html, url, truncate = true) {
  let dom;
  try {
    dom = new JSDOM(html, { url, virtualConsole: jsdomVirtualConsole });
  } catch {
    dom = new JSDOM(html, { url, runScripts: "outside-only", virtualConsole: jsdomVirtualConsole });
  }

  try {
    const result = await Defuddle(dom.window.document, url, {
      markdown: true,
      useAsync: false,
    });
    let content = result.content.trim();

    if (truncate && content.length > 2000) {
      const cutPoint = content.lastIndexOf("\n\n", 2000);
      const end = cutPoint > 1000 ? cutPoint : 2000;
      content = content.slice(0, end) + "\n\n[... truncated, use --full for complete content ...]";
    }

    return {
      title: result.title || dom.window.document.title || "",
      content,
    };
  } finally {
    dom.window.close();
  }
}
