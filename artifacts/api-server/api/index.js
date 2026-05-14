let cachedApp;

const handler = async (req, res) => {
  if (!cachedApp) {
    const mod = await import("../dist/app.mjs");
    cachedApp = mod.default;
  }

  return cachedApp(req, res);
};

export default handler;
