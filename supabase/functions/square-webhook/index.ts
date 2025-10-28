// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SQUARE_SIGNATURE_KEY = Deno.env.get('SQUARE_SIGNATURE_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

console.log('Square Webhook Handler initialized')

Deno.serve(async (req) => {
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get request body
    const body = await req.text()
    const signature = req.headers.get('x-square-hmacsha256-signature')
    
    // Verify Square signature (optional but recommended)
    if (SQUARE_SIGNATURE_KEY && signature) {
      const isValid = await verifySquareSignature(body, signature, SQUARE_SIGNATURE_KEY)
      if (!isValid) {
        console.error('Invalid Square signature')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
    
    const event = JSON.parse(body)
    console.log('Received event:', event.type, event.event_id)
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Log the event
    await supabase.from('payment_events').insert({
      square_event_id: event.event_id,
      event_type: event.type,
      event_data: event.data,
      processed: false,
    })

    // Handle different event types
    let result
    switch (event.type) {
      case 'subscription.created':
      case 'payment.updated':
        result = await handleSubscriptionActivated(event, supabase)
        break
      
      case 'subscription.canceled':
        result = await handleSubscriptionCanceled(event, supabase)
        break
      
      case 'invoice.payment_failed':
        result = await handlePaymentFailed(event, supabase)
        break
      
      default:
        console.log('Unhandled event type:', event.type)
        result = { success: true, message: 'Event logged but not processed' }
    }

    // Mark event as processed
    await supabase.from('payment_events').update({
      processed: true,
      processed_at: new Date().toISOString(),
      error_message: result.error || null,
    }).eq('square_event_id', event.event_id)

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function verifySquareSignature(body: string, signature: string, signatureKey: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(signatureKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(body)
    )
    
    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    const hashBase64 = btoa(String.fromCharCode(...hashArray))
    
    return hashBase64 === signature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

async function handleSubscriptionActivated(event: any, supabase: any) {
  try {
    const subscription = event.data?.object?.subscription
    if (!subscription) {
      return { success: false, error: 'No subscription data in event' }
    }

    const customerId = subscription.customer_id
    
    // Get user_id from custom fields or customer metadata
    const userId = subscription.metadata?.user_id || subscription.custom_fields?.user_id
    
    if (!userId) {
      console.error('No user_id in subscription:', subscription)
      return { success: false, error: 'No user_id in subscription metadata' }
    }

    console.log('Activating premium for user:', userId)

    // Calculate period end (30 days from now)
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() + 30)

    // Update user subscription
    const { error: userError } = await supabase.from('users').update({
      subscription_tier: 'premium',
      subscription_status: 'active',
      subscription_expires_at: periodEnd.toISOString(),
    }).eq('id', userId)

    if (userError) {
      console.error('Error updating user:', userError)
      return { success: false, error: userError.message }
    }

    // Create subscription record
    const { error: subError } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      square_subscription_id: subscription.id,
      square_customer_id: customerId,
      plan_name: 'Premium',
      amount: 10.00,
      currency: 'EUR',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
    }, { onConflict: 'square_subscription_id' })

    if (subError) {
      console.error('Error creating subscription:', subError)
      return { success: false, error: subError.message }
    }

    console.log('Premium activated successfully for user:', userId)
    return { success: true, userId }
  } catch (error) {
    console.error('Error in handleSubscriptionActivated:', error)
    return { success: false, error: error.message }
  }
}

async function handleSubscriptionCanceled(event: any, supabase: any) {
  try {
    const subscription = event.data?.object?.subscription
    if (!subscription) {
      return { success: false, error: 'No subscription data in event' }
    }

    const userId = subscription.metadata?.user_id || subscription.custom_fields?.user_id

    if (!userId) {
      console.error('No user_id in cancelled subscription')
      return { success: false, error: 'No user_id in subscription' }
    }

    console.log('Cancelling subscription for user:', userId)

    await supabase.from('users').update({
      subscription_status: 'cancelled',
    }).eq('id', userId)

    await supabase.from('subscriptions').update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('square_subscription_id', subscription.id)

    console.log('Subscription cancelled for user:', userId)
    return { success: true, userId }
  } catch (error) {
    console.error('Error in handleSubscriptionCanceled:', error)
    return { success: false, error: error.message }
  }
}

async function handlePaymentFailed(event: any, supabase: any) {
  try {
    const invoice = event.data?.object?.invoice
    if (!invoice) {
      return { success: false, error: 'No invoice data in event' }
    }

    const subscriptionId = invoice.subscription_id

    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('square_subscription_id', subscriptionId)
      .single()

    if (data) {
      console.log('Payment failed for user:', data.user_id)
      
      await supabase.from('users').update({
        subscription_status: 'past_due',
      }).eq('id', data.user_id)

      return { success: true, userId: data.user_id }
    }

    return { success: false, error: 'Subscription not found' }
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
    return { success: false, error: error.message }
  }
}
