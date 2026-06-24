// react-native-iap wrapper for the Boost paywall.
//
// Lifecycle on Android (Google Play Billing):
//   1. initConnection() once at app start — opens a connection to Play.
//   2. requestPurchase({ skus: ['parea_boost_48h'] }) — kicks off the
//      native Google Pay dialog.
//   3. purchaseUpdatedListener fires when the user completes (or restores)
//      a purchase. The listener forwards the purchase token + product id
//      to our edge function for server-side validation.
//   4. finishTransaction() acknowledges the purchase to Google. For
//      'consumable' products (Boost is one — they can buy it again every
//      48h) we set isConsumable: true so Play re-grants the SKU.
//
// LAZY LOAD: react-native-iap 15.x is a Nitro-based native module. The
// dev-client APK Daria runs day-to-day doesn't include those native
// modules until she rebuilds it — so importing the module at the top of
// the file crashes the dev-client on launch ('Failed to get NitroModules').
// Wrap require() in a try/catch so the module loads only if the native
// side is present; otherwise the free-Boost path still works and the
// paid path throws a clear error when tapped.

import { Platform } from 'react-native'

export const BOOST_SKU = 'parea_boost_48h'

type ListenerHandle = { remove: () => void }
type Purchase = any
type PurchaseError = any

let _iap: any = null
let _iapLoadError: Error | null = null
function getIap(): any | null {
  if (_iap) return _iap
  if (_iapLoadError) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _iap = require('react-native-iap')
    return _iap
  } catch (e: any) {
    _iapLoadError = e
    console.warn('react-native-iap not available (likely dev-client without the native module yet):', e?.message)
    return null
  }
}

let _started = false
let _purchaseSub: ListenerHandle | null = null
let _errorSub: ListenerHandle | null = null

/**
 * Boot Play Billing once at app start. Idempotent — calling twice is a no-op.
 * onValidated is invoked with the raw Purchase object whenever Google reports
 * a successful purchase; the BoostSheet caller passes a handler that ships
 * the receipt to the Supabase edge function. No-op on web, dev-client
 * builds without the native module, or if initConnection throws.
 */
export async function startIap(handlers: {
  onValidated: (purchase: Purchase) => Promise<void>
  onError?: (e: PurchaseError) => void
}) {
  if (_started || Platform.OS === 'web') return
  const iap = getIap()
  if (!iap) return
  try {
    await iap.initConnection()
    _purchaseSub = iap.purchaseUpdatedListener(async (purchase: Purchase) => {
      try {
        await handlers.onValidated(purchase)
        await iap.finishTransaction({ purchase, isConsumable: true })
      } catch (e: any) {
        console.warn('iap purchase handler error:', e?.message)
      }
    })
    _errorSub = iap.purchaseErrorListener((e: PurchaseError) => {
      if (handlers.onError) handlers.onError(e)
      else console.warn('iap purchase error:', e.message)
    })
    _started = true
  } catch (e: any) {
    console.warn('iap initConnection error:', e?.message)
  }
}

export async function stopIap() {
  const iap = _iap
  try { _purchaseSub?.remove(); _purchaseSub = null } catch {}
  try { _errorSub?.remove(); _errorSub = null } catch {}
  try { if (_started && iap) await iap.endConnection() } catch {}
  _started = false
}

/**
 * Fire the native purchase flow for the Boost product. Returns immediately
 * — the actual receipt arrives on the purchaseUpdatedListener registered
 * in startIap(). Throws a clear error if the native module isn't loaded
 * yet (dev-client without billing) so the caller can surface it to the user.
 *
 * IMPORTANT: react-native-iap 15.x (Nitro) requires getProducts() to be
 * called first so the SKU is loaded into the Billing library's cache,
 * otherwise requestPurchase throws 'Missing purchase request configuration'.
 */
export async function buyBoost(): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('In-app purchases are not available on the web build.')
  }
  const iap = getIap()
  if (!iap) {
    throw new Error('Paid Boost is only available in the Play Store build.')
  }
  // Warm the SKU into the library cache before requesting the purchase.
  // Without this getProducts call, requestPurchase has no product info and
  // Google Play Billing rejects the request with 'Missing purchase request
  // configuration' — even though the product is Active in Play Console.
  let products: any[] = []
  try {
    products = await iap.getProducts({ skus: [BOOST_SKU] })
    console.log('iap.getProducts result:', JSON.stringify(products))
  } catch (e: any) {
    console.warn('iap.getProducts threw:', e?.message, e?.code)
    throw new Error(`Google Play: ${e?.message || 'cannot fetch product'}`)
  }
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error(`Boost product not found. The product may still be propagating on Google Play (can take a few hours after creation). SKU: ${BOOST_SKU}`)
  }
  await iap.requestPurchase({ skus: [BOOST_SKU] })
}
