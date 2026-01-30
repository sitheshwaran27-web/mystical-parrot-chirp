import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json().catch(() => ({}))
        const { email, password, role, userData, action = 'create', userId } = body

        if (!email || !role) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Email and role are required.',
                details: 'Missing required fields in request body'
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (action === 'update') {
            if (!userId) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'User ID is required for updates.',
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            console.log(`Updating user: ${userId} (${email})`)

            const updateData: any = {
                email,
                user_metadata: { role, ...userData }
            }
            if (password) {
                updateData.password = password
            }

            const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
                userId,
                updateData
            )

            if (authError) {
                console.error('Auth update error:', authError)
                return new Response(JSON.stringify({
                    success: false,
                    error: authError.message,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }

            // Update profile as well
            await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    role: role,
                    first_name: userData?.first_name || userData?.name || null,
                    class_name: userData?.class_name || null,
                    updated_at: new Date().toISOString(),
                })

            return new Response(JSON.stringify({
                success: true,
                message: `User updated successfully`
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Default 'create' logic
        if (!password) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Password is required for new users.',
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log(`Creating user: ${email} with role: ${role}`)

        // 1. Create the Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role, ...userData }
        })

        if (authError) {
            console.error('Auth creation error:', authError)
            return new Response(JSON.stringify({
                success: false,
                error: authError.message,
                code: authError.code,
                details: 'Failed to create user in Supabase Auth'
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const newUserId = authData.user.id

        // 2. Ensure profile exists and has the correct role
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: newUserId,
                role: role,
                first_name: userData?.first_name || userData?.name || null,
                class_name: userData?.class_name || null,
                updated_at: new Date().toISOString(),
            })

        if (profileError) {
            console.error('Error creating profile:', profileError)
            return new Response(JSON.stringify({
                success: false,
                error: profileError.message,
                details: 'User created in Auth, but profile creation failed.'
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({
            success: true,
            userId: newUserId,
            message: `User created successfully with role ${role}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (err) {
        console.error('Unexpected manage-users error:', err)
        return new Response(JSON.stringify({
            error: err.message || 'An unexpected error occurred',
            details: 'Panic in Edge Function'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
