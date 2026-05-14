let cachedApp;

const handler = async (req, res) => {
  try {
    if (!cachedApp) {
      const mod = await import("../dist/app.mjs");
      cachedApp = mod.default;
    }

    return cachedApp(req, res);
  } catch (err) {
    console.error("[api-server] function invocation failed", err);
    return res
      .status(500)
      .send({
        error: "Function invocation failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
  }
};

export default handler;
