interface WwwAuthenticate {
    realm: string
    service: string
    scope: string
}

interface ResponseToken {
    token: string
    access_token: string
    expires_in: number
    issued_at: string
}

interface Token {
    token: string
    expires_in: number
}

function parseAuthenticateStr(authenticateStr: string): WwwAuthenticate {
    const bearer = authenticateStr.split(/\s+/, 2)
    if (bearer.length != 2 && bearer[0].toLowerCase() !== "bearer") {
        throw new Error(`Invalid Www-Authenticate ${authenticateStr}`)
    }
    const params = bearer[1].split(",")
    let get_param = function (name: string): string {
        for (const param of params) {
            const kvPair = param.split("=", 2)
            if (kvPair.length !== 2 || kvPair[0] !== name) {
                continue
            }
            return kvPair[1].replace(/['"]+/g, '')
        }
        return ""
    }
    return {
        realm: get_param("realm"),
        service: get_param("service"),
        scope: get_param("scope"),
    };
}

class TokenProvider {
    private async fetchToken(wwwAuthenticate: WwwAuthenticate): Promise<Token> {
        const url = new URL(wwwAuthenticate.realm)
        if (wwwAuthenticate.service.length) {
            url.searchParams.set("service", wwwAuthenticate.service)
        }
        if (wwwAuthenticate.scope.length) {
            url.searchParams.set("scope", wwwAuthenticate.scope)
        }
        const response = await fetch(url.toString(), { method: "GET", headers: {} })
        if (response.status !== 200) {
            throw new Error(`Unable to fetch token from ${url.toString()} status code ${response.status}`)
        }
        const body = await response.json() as ResponseToken
        return { token: body.token, expires_in: body.expires_in }
    }

    async token(authenticateStr: string): Promise<Token> {
        const wwwAuthenticate: WwwAuthenticate = parseAuthenticateStr(authenticateStr)
        return await this.fetchToken(wwwAuthenticate)
    }
}

export { TokenProvider }
export type { Token }
