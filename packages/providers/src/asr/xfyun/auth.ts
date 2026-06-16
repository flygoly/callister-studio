import { createHash, createHmac } from 'crypto'

/** WebSocket IAT auth (HMAC-SHA256) per iFlytek voice dictation API. */
export function buildIatAuthUrl(hostUrl: string, apiKey: string, apiSecret: string): string {
  const url = new URL(hostUrl)
  const host = url.host
  const date = new Date().toUTCString()
  const requestLine = `GET ${url.pathname} HTTP/1.1`
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`
  const signature = createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64')
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authorizationOrigin).toString('base64')

  url.searchParams.set('authorization', authorization)
  url.searchParams.set('date', date)
  url.searchParams.set('host', host)
  return url.toString()
}

/** LFASR REST signa: HmacSHA1(MD5(app_id + ts), apiSecret) base64 */
export function buildLfasrSigna(appId: string, apiSecret: string, ts?: number): {
  ts: string
  signa: string
} {
  const timestamp = String(ts ?? Math.floor(Date.now() / 1000))
  const baseString = `${appId}${timestamp}`
  const md5 = createHash('md5').update(baseString).digest('hex')
  const signa = createHmac('sha1', apiSecret).update(md5).digest('base64')
  return { ts: timestamp, signa }
}
