import "isomorphic-fetch"
import "regenerator-runtime/runtime"

import { isEmpty } from "lodash"
import { version as ReactionVersion } from "package.json"
import RelayClientSSR from "react-relay-network-modern-ssr/node8/client"
import RelayServerSSR from "react-relay-network-modern-ssr/node8/server"
import { Environment, RecordSource, RelayNetwork, Store } from "relay-runtime"
import { data as sd } from "sharify"

import {
  cacheMiddleware,
  errorMiddleware,
  loggerMiddleware,
  RelayNetworkLayer,
  urlMiddleware,
} from "react-relay-network-modern/node8"
import { metaphysicsErrorHandlerMiddleware } from "./middleware/metaphysicsErrorHandlerMiddleware"
import { metaphysicsExtensionsLoggerMiddleware } from "./middleware/metaphysicsExtensionsLoggerMiddleware"
import { principalFieldErrorHandlerMiddleware } from "./middleware/principalFieldErrorHandlerMiddleware"
import { searchBarImmediateResolveMiddleware } from "./middleware/searchBarImmediateResolveMiddleware"

const isServer = typeof window === "undefined"
const isDevelopment =
  (isServer ? process.env.NODE_ENV : sd.NODE_ENV) === "development"

// Only log on the client during development
const loggingEnabled = isDevelopment && !isServer

const METAPHYSICS_ENDPOINT = isServer
  ? process.env.METAPHYSICS_ENDPOINT
  : sd.METAPHYSICS_ENDPOINT

const USER_AGENT = `Reaction/${ReactionVersion}`

interface Config {
  cache?: object
  user?: User
  checkStatus?: boolean
  relayNetwork?: RelayNetwork
  userAgent?: string
}

export interface RelaySSREnvironment extends Environment {
  relaySSRMiddleware: RelayClientSSR | RelayServerSSR
  toggleFetching?: (isFetching) => void
}

export function createRelaySSREnvironment(config: Config = {}) {
  const { cache = {}, checkStatus, user, relayNetwork, userAgent } = config

  const relaySSRMiddleware = isServer
    ? new RelayServerSSR()
    : new RelayClientSSR(cache)

  relaySSRMiddleware.debug = false

  const headers = {
    "Content-Type": "application/json",
    /**
     * Chrome still doesn’t support setting the `User-Agent` header, but as this
     * isn’t critical information either we’re not going to work around it by
     * adding e.g. a `X-User-Agent` header, for now.
     *
     * See https://bugs.chromium.org/p/chromium/issues/detail?id=571722
     */
    "User-Agent": userAgent ? `${userAgent}; ${USER_AGENT}` : USER_AGENT,
  }

  let timeZone
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    headers["X-TIMEZONE"] = timeZone
  } catch (error) {
    console.warn("Browser does not support i18n API, not setting TZ header.")
  }

  const middlewares = [
    searchBarImmediateResolveMiddleware(),
    urlMiddleware({
      url: METAPHYSICS_ENDPOINT,
      headers: !!user
        ? {
            ...headers,
            "X-USER-ID": user && user.id,
            "X-ACCESS-TOKEN": user && user.accessToken,
          }
        : headers,
    }),
    relaySSRMiddleware.getMiddleware(),
    cacheMiddleware({
      size: 100, // max 100 requests
      ttl: 900000, // 15 minutes
      onInit: queryResponseCache => {
        if (!isServer) {
          hydrateCacheFromSSR(queryResponseCache)
        }
      },
    }),
    principalFieldErrorHandlerMiddleware(),
    metaphysicsErrorHandlerMiddleware({ checkStatus }),
    loggingEnabled && loggerMiddleware(),
    loggingEnabled && metaphysicsExtensionsLoggerMiddleware(),
    loggingEnabled && errorMiddleware({ disableServerMiddlewareTip: true }),
  ]

  // TODO: The `noThrow` option is used since we do our own error handling,
  // and don't want the default behavior of throwing when `result.errors` exists.
  // https://github.com/relay-tools/react-relay-network-modern#advanced-options-2nd-argument-after-middlewares
  // This is still 'experimental' and might be removed.
  const network =
    relayNetwork || new RelayNetworkLayer(middlewares, { noThrow: true })

  const source = new RecordSource()
  const store = new Store(source)

  const environment = new Environment({
    network,
    store,
  }) as RelaySSREnvironment

  environment.relaySSRMiddleware = relaySSRMiddleware

  return environment
}

/**
 * During the client-side rehydration phase take SSR cache and add to Relay's
 * QueryResponseCache, which is used inside of cacheMiddleware.
 *
 * @param cache RelayQueryResponseCache
 */
export function hydrateCacheFromSSR(queryResponseCache) {
  const ssrData = JSON.parse(window.__RELAY_BOOTSTRAP__ || "{}")

  if (!isEmpty(ssrData)) {
    try {
      ssrData.forEach(request => {
        const [key, json] = request
        const { queryID, variables } = JSON.parse(key)
        queryResponseCache.set(queryID, variables, json) // See: https://facebook.github.io/relay/docs/en/network-layer.html#caching
      })
    } catch (error) {
      console.error("Relay/createEnvironment", error)
    }
  }
}
