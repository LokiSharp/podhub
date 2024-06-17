import { handleRequest } from './handler'

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;
        if (path === "/") {
            return new Response("Hello, World!", { status: 200 });
        }
        return handleRequest(request);
    }
}
