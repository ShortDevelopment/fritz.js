import * as v from "@valibot/valibot";
import type {
  FritzGetRequest,
  FritzRequest,
  FritzRequestWithBody,
} from "./request.ts";
import { parse as parseXml } from "@libs/xml";

/**
 * Client to interact with a Fritz!Box device.
 * @example
 * ```ts
 * import { FritzClient } from "@shortdev/fritz";
 * await using client = new FritzClient("http://fritz.box");
 * ```
 */
export class FritzClient {
  public readonly baseUrl: URL;

  /**
   * Creates a new FritzClient instance.
   * @param baseUrl The base URL of the Fritz!Box device.
   */
  constructor(baseUrl: string | URL) {
    this.baseUrl = new URL(baseUrl);
  }

  /**
   * Sends a GET request to the specified endpoint.
   * @param endpoint
   */
  request<Endpoint extends FritzGetRequest>(
    endpoint: Endpoint,
  ): Promise<FritzResponse<Endpoint["response"]>>;

  /**
   * Sends a GET or POST request with payload to the specified endpoint.
   * @param endpoint
   * @param payload The request payload.
   */
  request<Endpoint extends FritzRequestWithBody>(
    endpoint: Endpoint,
    payload: v.InferOutput<Endpoint["request"]>,
  ): Promise<FritzResponse<Endpoint["response"]>>;

  async request<
    Endpoint extends FritzGetRequest | FritzRequestWithBody,
    // deno-lint-ignore ban-types
    TRequest = Endpoint["request"] extends {}
      ? v.InferOutput<Endpoint["request"]>
      : never,
  >(
    endpoint: Endpoint,
    payload?: TRequest,
  ): Promise<FritzResponse<Endpoint["response"]>> {
    const hasRequest = payload !== undefined;
    const method = endpoint.method ?? (hasRequest ? "POST" : "GET");

    const body = new URLSearchParams(
      payload as Record<string, string>, // ToDo: improve typing
    );

    const url = new URL(endpoint.endpoint, this.baseUrl);
    if (endpoint.method === "GET" && hasRequest) {
      for (const [key, value] of body.entries()) {
        url.searchParams.append(key, value);
      }
    }

    const headers = new Headers({
      Accept: "application/json",
    });

    const request = {
      url,
      method,
      headers,
      body: endpoint.method !== "GET" && hasRequest ? body : undefined,
    } satisfies MiddlewareRequest;

    const response = await this.executeRequest(request);
    return new FritzResponse(endpoint.response, response);
  }

  private async executeRequest(request: MiddlewareRequest): Promise<Response> {
    return await fetch(request.url, request);
  }

  async [Symbol.asyncDispose]() {
    // No resources to dispose of currently.
  }

  /**
   * Creates a new FritzClient instance with the specified middleware.
   * @param middleware The middleware function to apply to requests.
   * @returns A new FritzClient instance with the middleware applied.
   */
  use(middleware: Middleware): FritzClient {
    const thisClient = new FritzClient(this.baseUrl);

    // deno-lint-ignore no-this-alias
    const baseClient = this;
    const next = this.executeRequest.bind(this);
    thisClient.executeRequest = (request) =>
      middleware.request(request, next, baseClient);

    const originalDispose = this[Symbol.asyncDispose].bind(this);
    thisClient[Symbol.asyncDispose] = async () => {
      await middleware.dispose?.(baseClient);
      await originalDispose();
    };

    return thisClient;
  }

  /**
   * Creates a test FritzClient instance with a custom request handler.
   * @param baseUrl The base URL of the Fritz!Box device.
   * @param handler The custom request handler function.
   * @returns A new FritzClient instance with the custom request handler.
   */
  static createTestClient(
    baseUrl: string | URL,
    handler: (request: MiddlewareRequest) => Promise<Response> | Response,
  ): FritzClient {
    const client = new FritzClient(baseUrl);
    client.executeRequest = async (request) => {
      return await handler(request);
    };
    return client;
  }
}

/**
 * Request type for middleware.
 */
export type MiddlewareRequest = {
  url: string | URL;
} & RequestInit;

/**
 * Middleware for handling requests and responses.
 */
export type Middleware = {
  /**
   * Handles an outgoing request.
   */
  request(
    request: MiddlewareRequest,
    next: (request: MiddlewareRequest) => Promise<Response>,
    nextClient: FritzClient,
  ): Promise<Response>;

  /**
   * Optional asynchronous disposal method for cleaning up resources.
   */
  dispose?(base: FritzClient): Promise<void> | void;
};

/**
 * Options for fetching response data.
 */
export type ResponseDataOptions = {
  /**
   * Whether to throw an error if the response status is not OK.
   * @default true
   */
  throwOnError?: boolean;
};

/**
 * Response wrapper for Fritz!Box responses.
 * @example
 * ```ts
 * import { FritzClient } from "@shortdev/fritz";
 * import { RequestSid } from "@shortdev/fritz/client/protocol/login-sid.ts";
 *
 * const client = new FritzClient("http://fritz.box");
 * const response = await client.request(RequestSid);
 * const data = await response.data();
 * console.log(data.sid);
 * ```
 */
export class FritzResponse<ResponseSchema extends FritzRequest["response"]> {
  constructor(
    private readonly schema: ResponseSchema,
    private readonly response: Response,
  ) {}

  /**
   * Indicates whether the response status is OK.
   */
  get ok(): boolean {
    return this.response.ok;
  }

  /**
   * Throws an error if the response status is not OK.
   */
  async throwOnError(): Promise<void> {
    if (this.response.ok) return;

    const { status, statusText } = this.response;
    const data = await this.rawData({ throwOnError: false });
    throw new FritzError(
      `Request failed with status ${this.response.status}`,
      {
        cause: undefined,
        status,
        statusText,
        data,
      },
    );
  }

  /**
   * Returns the raw response data without validation.
   * @returns The raw response data.
   */
  async rawData(options?: ResponseDataOptions): Promise<unknown> {
    if (options?.throwOnError ?? true) {
      await this.throwOnError();
    }

    // Content-Type: text/plain; charset=utf-8
    // Content-Type: text/xml; charset=utf-8

    const contentType = this.response.headers
      .get("content-type")
      ?.split(";")[0]
      .trim()
      .toLocaleLowerCase();

    switch (contentType) {
      case "text/json":
      case "application/json":
        return await this.response.json();

      case "text/xml":
      case "application/xml":
        // ToDo: Can we stream this?
        return parseXml(await this.response.text());

      default:
        return await this.response.text();
    }
  }

  /**
   * Parses and validates the response data.
   * @returns The parsed response data.
   */
  async data(
    options?: ResponseDataOptions,
  ): Promise<v.InferOutput<ResponseSchema>> {
    const data = await this.rawData(options);
    return v.parse(this.schema, data);
  }

  /**
   * Returns the raw response data without validation.
   * @returns The raw response json.
   */
  async rawJson(options?: ResponseDataOptions): Promise<unknown> {
    if (options?.throwOnError ?? true) {
      await this.throwOnError();
    }

    return await this.response.json();
  }

  /**
   * Returns the raw response text.
   * @returns The raw response text.
   */
  async rawText(options?: ResponseDataOptions): Promise<string> {
    if (options?.throwOnError ?? true) {
      await this.throwOnError();
    }

    return await this.response.text();
  }

  async [Symbol.asyncDispose]() {
    const { body } = this.response;
    if (!body) {
      return;
    }

    if (body.locked) {
      return;
    }

    await body.cancel();
  }
}

/**
 * Error class for FRITZ!Box errors.
 */
export class FritzError extends Error {
  constructor(
    message: string,
    options?: ErrorOptions & {
      status?: number;
      statusText?: string;
      data?: unknown;
    },
  ) {
    super(message, options);
    this.name = "FritzError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FritzError);
    }
  }
}

export * from "./request.ts";
