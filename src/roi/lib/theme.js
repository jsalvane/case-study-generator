export const TOKENS = {
  color: {
    brand: '#c8102e',
    brandDark: '#a50e25',
    brandBg: 'rgba(200,16,46,0.08)',
    brandBandFill: 'rgba(200,16,46,0.10)',
    text: '#1c1c1e',
    muted: '#6e6e73',
    placeholder: '#9a9a9f',
    line: '#ebebed',
    lineSoft: '#e5e5ea',
    surface: '#ffffff',
    subtle: '#f5f5f7',
    success: '#15803d',
    successFill: 'rgba(21,128,61,0.14)',
    danger: '#c8102e',
    dangerBg: '#fdf0f2',
  },
  radius: { sm: '8px', md: '10px', lg: '12px', xl: '16px' },
  font: { family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" },
  shadow: {
    card: '0 1px 3px rgba(0,0,0,0.06)',
    lift: '0 24px 64px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)',
    mobile: '0 -8px 32px rgba(0,0,0,0.08)',
  },
}

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$',   locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€',   locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£',   locale: 'en-GB' },
  CAD: { code: 'CAD', symbol: 'CA$', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'A$',  locale: 'en-AU' },
  JPY: { code: 'JPY', symbol: '¥',   locale: 'ja-JP' },
  BRL: { code: 'BRL', symbol: 'R$',  locale: 'pt-BR' },
  MXN: { code: 'MXN', symbol: 'MX$', locale: 'es-MX' },
}

export const CURRENCY_OPTIONS = Object.keys(CURRENCIES).map(code => ({ value: code, label: code }))
