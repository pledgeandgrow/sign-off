// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_PLAY_API_KEY = Deno.env.get('GOOGLE_PLAY_API_KEY')
const APPLE_SHARED_SECRET = Deno.env.get('APPLE_SHARED_SECRET')

console.log('IAP Receipt Verification Handler initialized')

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { userId, transactionId, productId, receiptData, platform } = await req.json()

    if (!userId || !transactionId || !productId || !receiptData || !platform) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('Verifying receipt for user:', userId, 'platform:', platform)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Verify receipt based on platform
    let verificationResult
    if (platform === 'ios') {
      verificationResult = await verifyAppleReceipt(receiptData, productId)
    } else if (platform === 'android') {
      verificationResult = await verifyGoogleReceipt(receiptData, productId)
    } else {
      return new Response(JSON.stringify({ error: 'Invalid platform' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!verificationResult.valid) {
      console.error('Receipt verification failed:', verificationResult.error)
      return new Response(JSON.stringify({ 
        valid: false, 
        error: verificationResult.error 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Calculate subscription period
    const periodEnd = new Date()
    if (productId.includes('yearly')) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Update user subscription
    const { error: userError } = await supabase.from('users').update({
      subscription_tier: 'premium',
      subscription_status: 'active',
      subscription_expires_at: periodEnd.toISOString(),
    }).eq('id', userId)

    if (userError) {
      console.error('Error updating user:', userError)
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Failed to update user subscription' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create subscription record
    const { error: subError } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      store_transaction_id: transactionId,
      store_product_id: productId,
      store_platform: platform,
      plan_name: productId.includes('yearly') ? 'Premium Yearly' : 'Premium Monthly',
      amount: productId.includes('yearly') ? 100.00 : 10.00,
      currency: 'EUR',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      receipt_data: receiptData,
    }, { 
      onConflict: 'store_transaction_id' 
    })

    if (subError) {
      console.error('Error creating subscription:', subError)
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Failed to create subscription record' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ Subscription activated for user:', userId)

    return new Response(JSON.stringify({ 
      valid: true,
      expiresAt: periodEnd.toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Receipt verification error:', error)
    return new Response(JSON.stringify({ 
      valid: false,
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

/**
 * Verify Apple App Store receipt
 */
async function verifyAppleReceipt(
  receiptData: string, 
  productId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!APPLE_SHARED_SECRET) {
      return { valid: false, error: 'Apple shared secret not configured' }
    }

    // Try production first
    let response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': APPLE_SHARED_SECRET,
        'exclude-old-transactions': true,
      }),
    })

    let data = await response.json()

    // If sandbox receipt, try sandbox endpoint
    if (data.status === 21007) {
      response = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'receipt-data': receiptData,
          'password': APPLE_SHARED_SECRET,
          'exclude-old-transactions': true,
        }),
      })
      data = await response.json()
    }

    if (data.status !== 0) {
      return { valid: false, error: `Apple verification failed: ${data.status}` }
    }

    // Check if product ID matches
    const latestReceipt = data.latest_receipt_info?.[0]
    if (latestReceipt?.product_id !== productId) {
      return { valid: false, error: 'Product ID mismatch' }
    }

    // Check if subscription is active
    const expiresDate = new Date(parseInt(latestReceipt.expires_date_ms))
    if (expiresDate < new Date()) {
      return { valid: false, error: 'Subscription expired' }
    }

    return { valid: true }
  } catch (error) {
    console.error('Apple verification error:', error)
    return { valid: false, error: error.message }
  }
}

/**
 * Verify Google Play Store receipt
 */
async function verifyGoogleReceipt(
  purchaseToken: string,
  productId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!GOOGLE_PLAY_API_KEY) {
      return { valid: false, error: 'Google Play API key not configured' }
    }

    // Extract package name from product ID or use environment variable
    const packageName = Deno.env.get('ANDROID_PACKAGE_NAME') || 'com.signoff.app'

    // Call Google Play Developer API
    const response = await fetch(
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}?access_token=${GOOGLE_PLAY_API_KEY}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return { valid: false, error: `Google verification failed: ${error}` }
    }

    const data = await response.json()

    // Check if subscription is active
    // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = pending deferred upgrade/downgrade
    if (data.paymentState !== 1 && data.paymentState !== 2) {
      return { valid: false, error: 'Payment not received' }
    }

    // Check if not expired
    const expiryTime = parseInt(data.expiryTimeMillis)
    if (expiryTime < Date.now()) {
      return { valid: false, error: 'Subscription expired' }
    }

    // Check if not canceled
    if (data.cancelReason !== undefined) {
      return { valid: false, error: 'Subscription canceled' }
    }

    return { valid: true }
  } catch (error) {
    console.error('Google verification error:', error)
    return { valid: false, error: error.message }
  }
}
