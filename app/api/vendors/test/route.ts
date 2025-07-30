import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('🧪 TEST: Fetching all vendors from database...')
    
    // Test 1: Get all vendors directly
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .limit(10)
    
    console.log('📊 Direct vendors query result:', vendors?.length || 0)
    console.log('🏢 Vendor names:', vendors?.map(v => v.name) || [])
    
    if (vendorsError) {
      console.error('❌ Vendors query error:', vendorsError)
    }

    // Test 2: Test the RPC function directly
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('find_potential_vendor_matches', {
        supplier_name: 'acme',
        result_limit: 5
      })
    
    console.log('🔧 RPC function result:', rpcResult?.length || 0)
    console.log('⚙️ RPC matches:', rpcResult?.map((r: any) => r.vendor_name) || [])
    
    if (rpcError) {
      console.error('❌ RPC error:', rpcError)
    }

    return NextResponse.json({
      success: true,
      tests: {
        direct_vendors: {
          count: vendors?.length || 0,
          vendors: vendors?.map(v => ({ id: v.id, name: v.name, tax_id: v.tax_id })) || [],
          error: vendorsError
        },
        rpc_function: {
          count: rpcResult?.length || 0,
          matches: rpcResult || [],
          error: rpcError
        }
      }
    })

  } catch (error) {
    console.error('🚨 Test endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}