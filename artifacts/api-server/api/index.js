import app from "../src/app.js";

const handler = (req, res) => {
  return app(req, res);
};

export default handler;
