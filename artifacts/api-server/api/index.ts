import app from "../src/app.js";

type VercelRequest = {
  method?: unknown;
  url?: unknown;
  headers?: Record<string, unknown>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  send: (body: unknown) => unknown;
};

const handler = (req: VercelRequest, res: VercelResponse) => {
  return (app as unknown as (request: VercelRequest, response: VercelResponse) => unknown)(req, res);
};

export default handler;
