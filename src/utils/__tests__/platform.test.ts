import { describe, expect, test } from 'vitest'
import { buildSafariDeepLink, detectPlatform } from '../platform'

const IPHONE_CHROME_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1'
const IPHONE_SAFARI_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPAD_OS_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15'
const ANDROID_CHROME_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const MAC_CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

describe('detectPlatform', () => {
  test('detects iPhone regardless of browser', () => {
    expect(detectPlatform(IPHONE_CHROME_UA, 5)).toBe('ios')
    expect(detectPlatform(IPHONE_SAFARI_UA, 5)).toBe('ios')
  })

  test('detects iPadOS masquerading as Mac by its touch screen', () => {
    expect(detectPlatform(IPAD_OS_UA, 5)).toBe('ios')
  })

  test('detects Android', () => {
    expect(detectPlatform(ANDROID_CHROME_UA, 5)).toBe('android')
  })

  test('detects desktop (Mac without touch)', () => {
    expect(detectPlatform(MAC_CHROME_UA, 0)).toBe('desktop')
  })
})

describe('buildSafariDeepLink', () => {
  test('builds the x-safari-https link over the canonical origin', () => {
    expect(buildSafariDeepLink('https://cabenasala.com/?movel=fogao&l=60')).toBe(
      'x-safari-https://cabenasala.com/?movel=fogao&l=60',
    )
  })

  test('normalizes dev urls (http, ip e porta) para a origem canônica', () => {
    expect(buildSafariDeepLink('http://192.168.1.4:5173/?movel=sofa')).toBe(
      'x-safari-https://cabenasala.com/?movel=sofa',
    )
  })
})
