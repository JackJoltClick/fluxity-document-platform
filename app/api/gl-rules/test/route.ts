import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GLRulesEngineService } from '@/src/services/gl-rules/gl-rules-engine.service'
import { GLRuleTestRequest } from '@/src/types/gl-rules.types'

const glRulesEngine = new GLRulesEngineService()

// POST /api/gl-rules/test - Test rule conditions against sample data
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: GLRuleTestRequest = await request.json()

    // Validate request structure
    if (!body.conditions || !body.test_data) {
      return NextResponse.json(
        { success: false, error: 'Both conditions and test_data are required' },
        { status: 400 }
      )
    }

    // Validate test data has required fields
    const { test_data } = body
    if (!test_data.description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Description is required in test_data' },
        { status: 400 }
      )
    }

    // Convert test data to LineItemData format
    const lineItemData = {
      description: test_data.description,
      amount: test_data.amount || 0,
      vendor_name: test_data.vendor_name,
      date: test_data.date,
      category: test_data.line_item_category
    }

    // Test the rule
    const result = glRulesEngine.testRule(body.conditions, lineItemData)

    // Add additional context for debugging
    const response = {
      success: true,
      result,
      test_input: {
        conditions: body.conditions,
        test_data: lineItemData
      },
      debug_info: {
        conditions_count: Object.keys(body.conditions).filter(key => {
          const value = body.conditions[key as keyof typeof body.conditions]
          return value !== undefined && 
                 value !== null &&
                 (Array.isArray(value) ? value.length > 0 : true)
        }).length,
        has_exclusions: body.conditions.exclude_keywords && body.conditions.exclude_keywords.length > 0
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error testing GL rule:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/gl-rules/test - Get sample test data for rule testing
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Provide sample test data for different scenarios
    const sampleData = {
      office_supplies: {
        vendor_name: "Office Depot",
        amount: 45.99,
        description: "Paper, pens, and office supplies",
        date: new Date().toISOString().split('T')[0],
        line_item_category: "Office Supplies"
      },
      software: {
        vendor_name: "Adobe Inc",
        amount: 299.88,
        description: "Adobe Creative Cloud subscription",
        date: new Date().toISOString().split('T')[0],
        line_item_category: "Software"
      },
      fuel: {
        vendor_name: "Shell Gas Station",
        amount: 65.20,
        description: "Fuel for company vehicle",
        date: new Date().toISOString().split('T')[0],
        line_item_category: "Transportation"
      },
      meals: {
        vendor_name: "Starbucks",
        amount: 12.45,
        description: "Coffee and breakfast for client meeting",
        date: new Date().toISOString().split('T')[0],
        line_item_category: "Meals & Entertainment"
      },
      utilities: {
        vendor_name: "Electric Company",
        amount: 245.67,
        description: "Monthly electricity bill",
        date: new Date().toISOString().split('T')[0],
        line_item_category: "Utilities"
      }
    }

    // Also provide example rule conditions
    const exampleConditions = {
      vendor_pattern_example: {
        vendor_patterns: ["Office.*", "Staples", "Amazon.*Business"],
        amount_range: { min: 10, max: 500 },
        keywords: ["office", "supplies", "paper"]
      },
      exact_description_example: {
        exact_descriptions: ["Adobe Creative Cloud subscription"],
        amount_range: { min: 200 }
      },
      keyword_combination_example: {
        keywords: ["fuel", "gas", "gasoline"],
        vendor_patterns: ["Shell", "BP", "Exxon.*"],
        exclude_keywords: ["repair", "maintenance"]
      },
      date_range_example: {
        date_range: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          end: new Date().toISOString().split('T')[0] // today
        },
        amount_range: { min: 100 }
      }
    }

    return NextResponse.json({
      success: true,
      sample_data: sampleData,
      example_conditions: exampleConditions,
      scoring_info: {
        vendor_patterns: 30,
        amount_range: 20,
        keywords: 25,
        exact_descriptions: 35,
        date_conditions: 10,
        category_bonus: 5,
        max_score: 100
      },
      usage_tips: [
        "Use exact_descriptions for highest scoring (35 points)",
        "Vendor patterns support regex (e.g., 'Office.*' matches 'Office Depot')",
        "Keywords provide partial scoring based on match percentage",
        "Exclude keywords will disqualify the rule entirely",
        "Amount ranges work with absolute values",
        "Higher priority rules are evaluated first"
      ]
    })

  } catch (error) {
    console.error('Error getting sample test data:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}