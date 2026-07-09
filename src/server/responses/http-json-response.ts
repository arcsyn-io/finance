export type HttpJsonResponseBody = {
  readonly status?: string;
  readonly error?: string;
  readonly redirectTo?: string;
};

export type HttpJsonResponse<TBody extends HttpJsonResponseBody> = {
  readonly status: number;
  readonly body: TBody;
};
