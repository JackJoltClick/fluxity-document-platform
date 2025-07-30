// Debug script to check vendor rules functionality
console.log("=== VENDOR RULES DEBUG SCRIPT ===")

// Check if you can access the API endpoint
async function testVendorRulesAPI() {
  try {
    console.log("1. Testing vendor rules API...")
    
    // Replace with an actual vendor ID from your database
    const vendorId = "test-vendor-id"
    const response = await fetch(`http://localhost:3000/api/vendors/${vendorId}/extraction-rules`)
    
    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log("✅ API Response:", data)
    } else {
      const error = await response.text()
      console.log("❌ API Error:", error)
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message)
  }
}

// Instructions for manual testing
console.log(`
🔍 DEBUGGING STEPS:

1. **Check Database Table**
   Run this SQL in Supabase SQL Editor:
   SELECT * FROM information_schema.tables WHERE table_name = 'vendor_extraction_rules';

2. **Run Migration**
   If table doesn't exist, run:
   scripts/complete-vendor-security-migration.sql

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages when clicking "Add Rule"

4. **Check Network Tab**
   - Open Developer Tools (F12) 
   - Go to Network tab
   - Click "Add Rule" and check if API call is made
   - Look for 401/403/500 errors

5. **Test API Manually**
   Run this script with: node debug-vendor-rules.js
   (Make sure your dev server is running first)

6. **Check Authentication**
   - Make sure you're logged in
   - Check if user has proper permissions

❓ COMMON ISSUES:
- Database table not created (run migration)
- Not authenticated (login required)
- Frontend JavaScript errors (check console)
- API route errors (check Network tab)
- Rate limiting (too many requests)
`)

// Uncomment to test API (requires dev server running)
// testVendorRulesAPI()