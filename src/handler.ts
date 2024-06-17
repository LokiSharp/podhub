import { Backend } from './backend'

const PROXY_HEADER_ALLOW_LIST: string[] = ["accept", "user-agent", "accept-encoding"]

const ORG_NAME_BACKEND:{ [key: string]: string; } = {
  "gcr": "https://gcr.io",
  "k8sgcr": "https://k8s.gcr.io",
  "quay": "https://quay.io",
}

const DEFAULT_BACKEND_HOST: string = "https://registry-1.docker.io"


export async function handleRequest(request: Request): Promise<Response> {
    return handleRegistryRequest(request)
}

async function handleRegistryRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const orgName = orgNameFromRequest(url.pathname);
    const pathname = rewritePathByOrg(orgName, url.pathname)
    const host = hostByOrgName(orgName)
    const backend = new Backend(host)
    const headers = copyProxyHeaders(request.headers)
    return backend.proxy(pathname, {method: request.method,headers: request.headers, body: request.body})
}

function orgNameFromRequest(pathname: string): string | null {
    const splitedPath: string[] = pathname.split("/");
    if (splitedPath.length === 3 && splitedPath[0] === "" && splitedPath[1] === "v2") {
        return splitedPath[2].toLowerCase();
    }
    return null;
}

function rewritePathByOrg(orgName: string | null, pathname: string): string {
    if (orgName === null || !(orgName in ORG_NAME_BACKEND)) {
        return pathname;
    }
    const splitedPath: string[] = pathname.split("/");
    const cleanSplitedPath = splitedPath.filter(function(value: string, index: number) {
        return value !== orgName || index !== 2;
    });
    return cleanSplitedPath.join("/");
}

function hostByOrgName(orgName: string|null): string {
    if (orgName !== null && orgName in ORG_NAME_BACKEND) {
        return ORG_NAME_BACKEND[orgName]
    }
    return DEFAULT_BACKEND_HOST
}

function copyProxyHeaders(inputHeaders: Headers) : Headers {
    const headers = new Headers;
    for(const pair of inputHeaders.entries()) {
        if (pair[0].toLowerCase() in PROXY_HEADER_ALLOW_LIST) {
        headers.append(pair[0], pair[1])
        }
    }
    return headers
}