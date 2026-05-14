import app from "../dist/app.mjs";

const handler = async (req, res) => {
  try {
    return app(req, res);
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
