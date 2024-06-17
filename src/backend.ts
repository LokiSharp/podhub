import { Token, TokenProvider } from "./token";

interface ProxyArgs {
    method: string,
    headers: Headers,
    body: ReadableStream<any> | null,
}

class Backend {
    private host: string;
    private tokenProvider: TokenProvider | undefined;

    constructor(host: string, tokenProvider: TokenProvider | undefined) {
        this.host = host;
        this.tokenProvider = tokenProvider;
    }

    async proxy(pathname: string, args: ProxyArgs): Promise<Response> {
        const url = new URL(this.host);
        url.pathname = pathname;
        const request = new Request(url.toString(), { method: args.method, headers: args.headers, body: args.body, redirect: "follow" });
        const response = await fetch(request);
        if (this.tokenProvider === undefined) {
            return response
        }
        if (response.status !== 401) {
            return response
        }

        const authenticateStr = response.headers.get("Www-Authenticate")
        if (authenticateStr === null || this.tokenProvider === undefined) {
            return response
        }
        const token: Token = await this.tokenProvider.token(authenticateStr)
        const authenticatedHeaders = new Headers(args.headers)
        authenticatedHeaders.append("Authorization", `Bearer ${token.token}`)
        return await fetch(url.toString(), { method: "GET", headers: authenticatedHeaders, redirect: "follow" })
    }
}

export { Backend }