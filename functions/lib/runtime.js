/**
 * Cloudflare Pages Functions run in the Workers runtime. The `@supabase/*`
 * packages ship a browser build that probes localStorage/window at import
 * time, which crashes in a non-browser environment unless a `globalThis`
 * document exists. A permissive stub satisfies those probes; nothing in the
 * server path uses DOM APIs.
 */
if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    get cookie() {
      return '';
    },
    set cookie(_value) {},
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
    head: { appendChild() {} },
    body: { appendChild() {} },
    documentElement: {},
    addEventListener() {},
    removeEventListener() {},
  };
}
if (typeof globalThis.location === 'undefined') {
  globalThis.location = { href: 'https://localhost/', origin: 'https://localhost', protocol: 'https:', host: 'localhost' };
}
if (typeof globalThis.addEventListener === 'undefined') {
  globalThis.addEventListener = () => {};
  globalThis.removeEventListener = () => {};
}
