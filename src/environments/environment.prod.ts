const base_url = new URL(document.baseURI)

export const environment = {
  production: true,
  apiBaseUrl: document.baseURI + '',
  apiVersion: '3',
  appTitle: 'Digital Work',
  version: '2.0.1-dev',
  webSocketHost: window.location.host,
  webSocketProtocol: window.location.protocol == 'http:' ? 'wss:' : 'ws:',
  webSocketBaseUrl: base_url.pathname + 'ws/',
}
