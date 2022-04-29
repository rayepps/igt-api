/**
 * 23      -> $23
 * 458     -> $458
 * 800.50  -> $800.50
 * 12345   -> $12,345
 * 1452.02 -> $1,452.02
 */
export const formatPrice = (price: number): string => {
  if (!price) return null
  const withCommas = price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')
  const withoutEmptyDecimals = withCommas.replace(/\.00$/, '')
  return `$${withoutEmptyDecimals}`
}

export default {
  price: formatPrice
}