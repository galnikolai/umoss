enum METHODS {
  GET = "GET",
  PUT = "PUT",
  POST = "POST",
  DELETE = "DELETE",
}

type FetchInit = {
  method: string;
  headers: Record<string, string>;
  credentials: RequestCredentials;
  signal: AbortSignal;
  body: null | FormData | string;
};

function queryStringify(data: any) {
  if (!data || typeof data !== "object") return "";
  const params = Object.keys(data)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join("&");
  return params ? `?${params}` : "";
}

export class HTTPTransport {
  baseUrl: string;
  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  get(url: string, options: any = {}) {
    return this.request(
      url,
      { ...options, method: METHODS.GET },
      options.timeout
    );
  }

  put(url: string, options: any = {}) {
    return this.request(
      url,
      { ...options, method: METHODS.PUT },
      options.timeout
    );
  }

  post(url: string, options: any = {}) {
    return this.request(
      url,
      { ...options, method: METHODS.POST },
      options.timeout
    );
  }

  delete(url: string, options: any = {}) {
    return this.request(
      url,
      { ...options, method: METHODS.DELETE },
      options.timeout
    );
  }

  async request(
    url: string,
    options: any = { method: METHODS.GET, content_type: "json" },
    timeout = 10000
  ) {
    const {
      data,
      headers = {},
      method = METHODS.GET,
      content_type = "json",
    } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const isGet = method === METHODS.GET;
    const fullUrl = `${this.baseUrl}${url}${
      isGet && data ? queryStringify(data) : ""
    }`;

    const init: FetchInit = {
      method,
      headers: { ...headers },
      credentials: "include",
      signal: controller.signal,
      body: null,
    };

    if (!isGet && typeof data !== "undefined") {
      if (content_type === "multipart/form-data" && data instanceof FormData) {
        init.body = data;
      } else if (content_type === "json") {
        init.headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(data);
      } else {
        init.body = data;
      }
    }

    try {
      const response = await fetch(fullUrl, init);
      clearTimeout(id);
      if (!response.ok) {
        const message = `HTTP ${response.status} ${response.statusText}`;
        throw new Error(message);
      }
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return response.json();
      }

      return { success: true };
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }
}

export const http = new HTTPTransport("/api");
