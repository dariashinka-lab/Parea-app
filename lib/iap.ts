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
// Keep all IAP code in one file so the BoostSheet caller stays small.

import { Platform } from 'react-native'
import {
  initConnection,
  endConnection,
  requestPurchase,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap'

export const BOOST_SKU = 'parea_boost_48h'

type ListenerHandle = { remove: () => void }

let _started = false
let _purchaseSub: ListenerHandle | null = null
let _errorSub: ListenerHandle | null = null

/**
 * Boot Play Billing once at app start. Idempotent — calling twice is a no-op.
 * onValidated is invoked with the raw Purchase object whenever Google reports
 * a successful purchase; the BoostSheet caller passes a handler that ships
 * the receipt to the Supabase edge function.
 */
export async function startIap(handlers: {
  onValidated: (purchase: Purchase) => Promise<void>
  onError?: (e: PurchaseError) => void
}) {
  if (_started || Platform.OS === 'web') return
  try {
    await initConnection()
    _purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      try {
        await handlers.onValidated(purchase)
        await finishTransaction({ purchase, isConsumable: true })
      } catch (e: any) {
        console.warn('iap purchase handler error:', e?.message)
      }
    })
    _errorSub = purchaseErrorListener((e: PurchaseError) => {
      if (handlers.onError) handlers.onError(e)
      else console.warn('iap purchase error:', e.message)
    })
    _started = true
  } catch (e: any) {
    console.warn('iap initConnection error:', e?.message)
  }
}

export async function stopIap() {
  try { _purchaseSub?.remove(); _purchaseSub = null } catch {}
  try { _errorSub?.remove(); _errorSub = null } catch {}
  try { if (_started) await endConnection() } catch {}
  _started = false
}

/**
 * Fire the native purchase flow for the Boost product. Returns immediately
 * — the actual receipt arrives on the purchaseUpdatedListener registered
 * in startIap(). The caller should disable the Boost button while a
 * purchase is in flight so a double-tap doesn't open two dialogs.
 */
export async function buyBoost(): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('In-app purchases are not available on the web build.')
  }
  await requestPurchase({ skus: [BOOST_SKU] })
}
