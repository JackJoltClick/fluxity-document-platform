import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const isSimpleMappingMode = process.env.SIMPLE_MAPPING_MODE === 'true'
    
    // Return business-focused information rather than technical config
    return NextResponse.json({
      success: true,
      simple_mapping_mode: isSimpleMappingMode,
      processing_mode: isSimpleMappingMode ? 'direct_mapping' : 'business_rules',
      message: isSimpleMappingMode 
        ? 'Using direct field mapping for faster processing'
        : 'Using business rule validation for accurate mapping'
    })
  } catch (error) {
    console.error('Error checking processing mode:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check processing mode',
        simple_mapping_mode: false,
        processing_mode: 'unknown'
      },
      { status: 500 }
    )
  }
}