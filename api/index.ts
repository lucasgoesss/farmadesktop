import app from "../artifacts/api-server/src/app.js";

type RequestLike = {
  method?: unknown;
  url?: unknown;
  headers?: Record<string, unknown>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  send: (body: unknown) => unknown;
};

const handler = (req: RequestLike, res: ResponseLike) => {
  return (app as unknown as (request: RequestLike, response: ResponseLike) => unknown)(req, res);
};

export default handler;
