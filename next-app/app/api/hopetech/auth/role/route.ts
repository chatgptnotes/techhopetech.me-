import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy so importing this module during `next build` page-data collection does
// not throw when env vars are absent in the build environment.
let adminClient: SupabaseClient | undefined

function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured')
  }

  adminClient = createClient(url, key)
  return adminClient
}

export async function GET(request: NextRequest) {
  try {
    // Get user session from request headers
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Validate session and get user role
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user role from user_metadata or database
    const role = user.user_metadata?.role || 'management'

    return NextResponse.json({
      role: role,
      user: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}