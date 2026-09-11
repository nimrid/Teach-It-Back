import { AddressBook } from '@nimiq/utils/address-book'

/**
 * Format a Nimiq address with clean 4-character grouping
 */
export function formatAddress(address: string): string {
  if (!address) return ''
  const clean = address.replace(/\s+/g, '').toUpperCase()
  return clean.match(/.{1,4}/g)?.join(' ') || address
}

/**
 * Shorten an address for mobile display (e.g. NQ07 0000 ... 0000)
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return ''
  const clean = formatAddress(address)
  if (clean.length <= chars * 4) return clean
  const parts = clean.split(' ')
  if (parts.length <= 3) return clean
  return `${parts[0]} ${parts[1]} ... ${parts[parts.length - 1]}`
}

/**
 * Check if an address belongs to a known mining pool, exchange, or shared deposit
 * using @nimiq/utils/address-book.
 * Returns the label if recognized, null otherwise.
 */
export function checkKnownAddressLabel(address: string): string | null {
  try {
    const formatted = formatAddress(address)
    const label = AddressBook.getLabel(formatted)
    return label || null
  } catch (err) {
    console.warn('AddressBook lookup error:', err)
    return null
  }
}

/**
 * Convert Luna to NIM display
 */
export function lunaToNim(luna: number): string {
  const nim = luna / 100_000
  return nim.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 5,
  })
}
