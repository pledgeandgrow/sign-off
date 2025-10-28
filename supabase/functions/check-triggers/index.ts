import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Vault action execution function
async function executeVaultActions(userId: string, supabaseClient: any) {
  try {
    console.log(`🔐 Fetching vaults for user ${userId}`)
    
    // Get all vaults for the user
    const { data: vaults, error: vaultsError } = await supabaseClient
      .from('vaults')
      .select('id, name, category')
      .eq('user_id', userId)

    if (vaultsError) {
      console.error('Error fetching vaults:', vaultsError)
      return
    }

    if (!vaults || vaults.length === 0) {
      console.log('No vaults found for user')
      return
    }

    console.log(`Found ${vaults.length} vaults to process`)

    // Process each vault based on category
    for (const vault of vaults) {
      console.log(`Processing vault ${vault.id} (${vault.category})`)

      switch (vault.category) {
        case 'delete_after_death':
          await deleteVault(vault.id, supabaseClient)
          break
        case 'share_after_death':
          await shareVault(vault.id, supabaseClient)
          break
        case 'handle_after_death':
          await notifyTrustedContact(vault.id, supabaseClient)
          break
        case 'sign_off_after_death':
          await createSignOffTask(vault.id, supabaseClient)
          break
        default:
          console.log(`Unknown vault category: ${vault.category}`)
      }
    }

    console.log(`✅ Completed vault actions for user ${userId}`)
  } catch (error) {
    console.error('Error in executeVaultActions:', error)
  }
}

// Delete vault and all items
async function deleteVault(vaultId: string, supabaseClient: any) {
  try {
    console.log(`🗑️ Deleting vault ${vaultId}`)
    
    // Delete vault items first
    await supabaseClient
      .from('vault_items')
      .delete()
      .eq('vault_id', vaultId)
    
    // Delete vault
    await supabaseClient
      .from('vaults')
      .delete()
      .eq('id', vaultId)
    
    console.log(`✅ Deleted vault ${vaultId}`)
  } catch (error) {
    console.error(`Error deleting vault ${vaultId}:`, error)
  }
}

// Share vault with heirs
async function shareVault(vaultId: string, supabaseClient: any) {
  try {
    console.log(`📤 Sharing vault ${vaultId}`)
    
    // Mark vault as shared
    await supabaseClient
      .from('vaults')
      .update({ is_shared: true })
      .eq('id', vaultId)
    
    // Grant access to heirs
    await supabaseClient
      .from('heir_vault_access')
      .update({
        access_status: 'granted',
        access_granted_at: new Date().toISOString()
      })
      .eq('vault_id', vaultId)
    
    console.log(`✅ Shared vault ${vaultId}`)
  } catch (error) {
    console.error(`Error sharing vault ${vaultId}:`, error)
  }
}

// Notify trusted contact
async function notifyTrustedContact(vaultId: string, supabaseClient: any) {
  try {
    console.log(`📞 Notifying trusted contact for vault ${vaultId}`)
    
    // Update vault with notification flag
    await supabaseClient
      .from('vaults')
      .update({
        death_settings: {
          trusted_contact_notified: true,
          notified_at: new Date().toISOString()
        }
      })
      .eq('id', vaultId)
    
    console.log(`✅ Notified trusted contact for vault ${vaultId}`)
  } catch (error) {
    console.error(`Error notifying trusted contact for vault ${vaultId}:`, error)
  }
}

// Create sign-off task
async function createSignOffTask(vaultId: string, supabaseClient: any) {
  try {
    console.log(`📋 Creating sign-off task for vault ${vaultId}`)
    
    // Update vault with task flag
    await supabaseClient
      .from('vaults')
      .update({
        death_settings: {
          signoff_task_created: true,
          task_created_at: new Date().toISOString(),
          task_status: 'pending'
        }
      })
      .eq('id', vaultId)
    
    console.log(`✅ Created sign-off task for vault ${vaultId}`)
  } catch (error) {
    console.error(`Error creating sign-off task for vault ${vaultId}:`, error)
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 Checking inheritance triggers...')

    // Get all users with global trigger methods
    const { data: users, error: usersError } = await supabaseClient
      .from('users')
      .select('id, global_trigger_method, global_trigger_settings, global_scheduled_date, last_activity')
      .not('global_trigger_method', 'is', null)
      .eq('is_active', true)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    console.log(`📊 Found ${users?.length || 0} users with trigger methods`)

    let triggeredCount = 0

    // Check each user
    for (const user of users || []) {
      let shouldTrigger = false
      let triggerReason = ''

      // Check inactivity
      if (user.global_trigger_method === 'inactivity' && user.last_activity) {
        const lastActivity = new Date(user.last_activity)
        const daysSince = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        const threshold = user.global_trigger_settings?.inactivity_days || 30

        console.log(`👤 User ${user.id}: ${daysSince} days since last activity (threshold: ${threshold})`)

        if (daysSince >= threshold) {
          shouldTrigger = true
          triggerReason = 'inactivity'
          console.log(`⚠️ User ${user.id} meets inactivity threshold!`)
        }
      }

      // Check scheduled date
      if (user.global_trigger_method === 'scheduled' && user.global_scheduled_date) {
        const scheduledDate = new Date(user.global_scheduled_date)
        if (Date.now() >= scheduledDate.getTime()) {
          shouldTrigger = true
          triggerReason = 'scheduled'
          console.log(`⚠️ User ${user.id} scheduled date reached!`)
        }
      }

      // Trigger if conditions met
      if (shouldTrigger) {
        // Check if user has active, non-triggered plans
        const { data: plans, error: plansError } = await supabaseClient
          .from('inheritance_plans')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .eq('is_triggered', false)

        if (plansError) {
          console.error(`Error fetching plans for user ${user.id}:`, plansError)
          continue
        }

        if (!plans || plans.length === 0) {
          console.log(`ℹ️ User ${user.id} has no active plans to trigger`)
          continue
        }

        console.log(`🔥 Triggering ${plans.length} plans for user ${user.id}`)

        // Create trigger records
        const triggerRecords = plans.map(plan => ({
          inheritance_plan_id: plan.id,
          user_id: user.id,
          trigger_reason: triggerReason,
          trigger_metadata: {
            triggered_at: new Date().toISOString(),
            global_trigger_method: user.global_trigger_method,
            global_trigger_settings: user.global_trigger_settings,
          },
          status: 'pending',
          requires_verification: user.global_trigger_method === 'death_certificate',
        }))

        const { error: triggersError } = await supabaseClient
          .from('inheritance_triggers')
          .insert(triggerRecords)

        if (triggersError) {
          console.error(`Error creating triggers for user ${user.id}:`, triggersError)
          continue
        }

        // Mark plans as triggered
        const { error: updateError } = await supabaseClient
          .from('inheritance_plans')
          .update({
            is_triggered: true,
            triggered_at: new Date().toISOString()
          })
          .in('id', plans.map(p => p.id))

        if (updateError) {
          console.error(`Error updating plans for user ${user.id}:`, updateError)
          continue
        }

        // Get heirs and notify them
        for (const plan of plans) {
          const { data: heirs } = await supabaseClient
            .from('heirs')
            .select('*')
            .eq('inheritance_plan_id', plan.id)
            .eq('is_active', true)

          if (heirs && heirs.length > 0) {
            // Send email to each heir
            for (const heir of heirs) {
              try {
                // Get plan details
                const { data: planDetails } = await supabaseClient
                  .from('inheritance_plans')
                  .select('plan_name, instructions_encrypted')
                  .eq('id', plan.id)
                  .single()

                // Send email using Supabase Auth
                const emailHtml = `
                  <h1>Inheritance Plan Activated</h1>
                  <p>Dear ${heir.full_name_encrypted || 'Heir'},</p>
                  <p>An inheritance plan has been activated: <strong>${planDetails?.plan_name || 'Unnamed Plan'}</strong></p>
                  <p><strong>Instructions from the deceased:</strong></p>
                  <p>${planDetails?.instructions_encrypted || 'No instructions provided'}</p>
                  <hr>
                  <p><strong>Next Steps:</strong></p>
                  <ol>
                    <li>Log in to the Sign-Off app</li>
                    <li>Verify your identity</li>
                    <li>Access your granted vaults</li>
                  </ol>
                  <p>This is an automated notification. Please do not reply to this email.</p>
                `

                // Note: Supabase doesn't have a direct email API in edge functions
                // We'll log for now and implement via database trigger or external service
                console.log(`📧 Would send email to: ${heir.email_encrypted}`)
                console.log(`Subject: Inheritance Plan Activated - ${planDetails?.plan_name}`)
              } catch (emailError) {
                console.error(`Error preparing email for heir ${heir.id}:`, emailError)
              }
            }

            // Update heir notification status
            await supabaseClient
              .from('heirs')
              .update({
                notified_at: new Date().toISOString(),
                notification_status: 'pending_verification'
              })
              .in('id', heirs.map(h => h.id))

            console.log(`📧 Notified ${heirs.length} heirs for plan ${plan.id}`)
          }
        }

        // Execute vault-specific actions based on vault category
        console.log(`🔐 Executing vault actions for user ${user.id}`)
        await executeVaultActions(user.id, supabaseClient)

        triggeredCount++
        console.log(`✅ Successfully triggered plans for user ${user.id}`)
      }
    }

    const response = {
      success: true,
      message: `Checked ${users?.length || 0} users, triggered ${triggeredCount} user(s)`,
      timestamp: new Date().toISOString(),
      triggeredCount,
      totalUsers: users?.length || 0
    }

    console.log('✅ Check complete:', response)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
