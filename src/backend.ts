interface ProxyArgs {
    method: string,
    headers: Headers,
    body: ReadableStream<any> | null,
}

class Backend {
    private host: string;
    
    constructor(host: string) {
        this.host = host;
    }

    async proxy(pathname: string, args: ProxyArgs): Promise<Response> {
        const url = new URL(this.host);
        url.pathname = pathname;
        const request = new Request(url.toString(), {method: args.method, headers: args.headers, body: args.body, redirect: "follow"});
        const response = await fetch(request);
        return new Response(response.body ? response.body as ReadableStream<Uint8Array>: null,
            {  status: response.status, statusText: response.statusText, headers: response.headers });
    }
}

export { Backend }