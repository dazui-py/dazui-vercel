export class Counter {
  constructor(state, env) {
    this.state = state;
    this.pages = new Map();
    this.state.blockConcurrencyWhile(async () => {
      const raw = await this.state.storage.get("pages");
      if (raw) this.pages = new Map(Object.entries(raw));
    });
  }

  async fetch(request) {
    const url = new URL(request.url);
    const page = (url.searchParams.get("page") || "default").slice(0, 64);

    if (request.method === "POST") {
      const next = (this.pages.get(page) || 0) + 1;
      this.pages.set(page, next);
      await this.state.storage.put("pages", Object.fromEntries(this.pages));
      return this.json({ page, count: next });
    }

    return this.json({ page, count: this.pages.get(page) || 0 });
  }

  json(data) {
    return new Response(JSON.stringify(data), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-max-age": "86400",
        },
      });
    }

    if (url.pathname === "/hit") {
      const id = env.COUNTER.idFromName("fakecrime");
      return env.COUNTER.get(id).fetch(request);
    }

    return new Response("fakecrime views worker", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
