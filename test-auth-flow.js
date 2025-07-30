// test-auth-flow.js
// Run with: node test-auth-flow.js
// Note: You need to install puppeteer first: npm install puppeteer

const puppeteer = require('puppeteer');

(async () => {
  let browser;
  try {
    console.log('🚀 Starting auth flow tests...\n');
    
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 }
    });
    const page = await browser.newPage();
    
    // Test 1: Access /dashboard when logged out
    console.log('📋 Test 1: Accessing /dashboard when not authenticated...');
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForTimeout(3000); // Wait for client-side redirect
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✅ /dashboard correctly redirects to /login when not authenticated');
      console.log(`   Redirected to: ${currentUrl}\n`);
    } else {
      console.log('❌ /dashboard should redirect to /login but went to:', currentUrl);
      console.log('   This might indicate an issue with client-side auth checking\n');
    }
    
    // Test 2: Check login page elements
    console.log('📋 Test 2: Verifying login page elements...');
    await page.goto('http://localhost:3001/login');
    await page.waitForTimeout(1000);
    
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.waitForSelector('input[type="password"]', { timeout: 5000 });
      await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
      console.log('✅ Login form elements found (email, password, submit button)\n');
    } catch (error) {
      console.log('❌ Login form elements not found:', error.message, '\n');
    }
    
    // Test 3: Login flow (using test credentials)
    console.log('📋 Test 3: Testing login flow...');
    console.log('Note: You need to provide valid test credentials for this test');
    
    // Replace these with your actual test credentials
    const TEST_EMAIL = 'test@example.com';
    const TEST_PASSWORD = 'testpassword123';
    
    try {
      await page.type('input[type="email"]', TEST_EMAIL);
      await page.type('input[type="password"]', TEST_PASSWORD);
      console.log('   Filled login form with test credentials');
      
      await page.click('button[type="submit"]');
      console.log('   Submitted login form');
      
      // Wait for either success redirect or error message
      await page.waitForTimeout(5000);
      
      const postLoginUrl = page.url();
      if (postLoginUrl.includes('/dashboard')) {
        console.log('✅ Login successful - redirected to dashboard');
        console.log(`   Current URL: ${postLoginUrl}`);
        
        // Test 4: Check user email displays
        console.log('\n📋 Test 4: Checking user email display...');
        try {
          const userEmailElement = await page.waitForSelector('[data-testid="user-email"]', { timeout: 5000 });
          const userEmail = await userEmailElement.evaluate(el => el.textContent);
          
          if (userEmail && userEmail.includes(TEST_EMAIL)) {
            console.log('✅ User email displays correctly:', userEmail);
          } else {
            console.log('❌ User email not found or incorrect. Found:', userEmail);
          }
        } catch (error) {
          console.log('❌ User email element not found:', error.message);
        }
        
        // Test 5: Check sidebar navigation
        console.log('\n📋 Test 5: Checking sidebar navigation...');
        try {
          await page.waitForSelector('[data-testid="sidebar-nav"]', { timeout: 5000 });
          const sidebarLinks = await page.$$eval('[data-testid="sidebar-nav"] a', links => 
            links.map(link => link.textContent.trim())
          );
          
          const expectedLinks = ['Dashboard', 'Documents', 'Vendors', 'Settings'];
          const hasAllLinks = expectedLinks.every(link => 
            sidebarLinks.some(sidebarLink => sidebarLink.includes(link))
          );
          
          if (hasAllLinks) {
            console.log('✅ Sidebar navigation renders correctly');
            console.log('   Found links:', sidebarLinks);
          } else {
            console.log('❌ Sidebar missing expected links');
            console.log('   Expected:', expectedLinks);
            console.log('   Found:', sidebarLinks);
          }
        } catch (error) {
          console.log('❌ Sidebar navigation not found:', error.message);
        }
        
        // Test 6: Check dashboard content
        console.log('\n📋 Test 6: Checking dashboard content...');
        try {
          await page.waitForSelector('[data-testid="dashboard-layout"]', { timeout: 5000 });
          console.log('✅ Dashboard layout loaded successfully');
          
          // Check for stats grid
          const statsCards = await page.$$('.bg-white.rounded-lg.shadow.p-6');
          console.log(`   Found ${statsCards.length} stats cards`);
          
          // Check for welcome section
          const welcomeText = await page.$eval('h2', el => el.textContent);
          if (welcomeText.includes('Welcome to Fluxity Dashboard')) {
            console.log('✅ Welcome section found');
          } else {
            console.log('❌ Welcome section not found');
          }
        } catch (error) {
          console.log('❌ Dashboard content verification failed:', error.message);
        }
        
        // Test 7: Test sign out
        console.log('\n📋 Test 7: Testing sign out functionality...');
        try {
          const signOutButton = await page.waitForSelector('button:has-text("Sign Out")', { timeout: 5000 });
          await signOutButton.click();
          console.log('   Clicked sign out button');
          
          await page.waitForTimeout(3000);
          const postSignOutUrl = page.url();
          
          if (postSignOutUrl === 'http://localhost:3001/') {
            console.log('✅ Sign out successful - redirected to homepage');
          } else {
            console.log('❌ Sign out redirect unexpected. Current URL:', postSignOutUrl);
          }
        } catch (error) {
          console.log('❌ Sign out test failed:', error.message);
        }
        
      } else {
        console.log('❌ Login failed or did not redirect to dashboard');
        console.log(`   Current URL: ${postLoginUrl}`);
        
        // Check for error messages
        try {
          const errorElement = await page.$('.text-red-700');
          if (errorElement) {
            const errorText = await errorElement.evaluate(el => el.textContent);
            console.log(`   Error message: ${errorText}`);
          }
        } catch (e) {
          console.log('   No specific error message found');
        }
      }
      
    } catch (error) {
      console.log('❌ Login test failed:', error.message);
    }
    
    console.log('\n🏁 Auth flow tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();

// Manual Testing Checklist
console.log(`
📝 MANUAL TESTING CHECKLIST:
If you prefer manual testing, follow these steps:

1. 🌐 Open browser in incognito mode
2. 📍 Navigate to http://localhost:3001/dashboard
3. ✅ Verify automatic redirect to /login
4. 🔑 Login with test credentials
5. ✅ Verify redirect to /dashboard after successful login
6. 📧 Check user email displays in header
7. 🧭 Verify all navigation links (Dashboard, Documents, Vendors, Settings) are present
8. 🚪 Test sign-out functionality
9. 🔄 Refresh page and verify auth state persists
10. 📱 Test responsive design on different screen sizes

🔧 REQUIRED SETUP:
- Make sure dev server is running: npm run dev
- Install puppeteer if using automated tests: npm install puppeteer
- Have valid test credentials for Supabase auth
- Update TEST_EMAIL and TEST_PASSWORD in this script

💡 TROUBLESHOOTING:
- If tests fail, check browser console for errors
- Verify Supabase credentials in .env.local
- Ensure auth store is properly initialized
- Check network requests for auth API calls
`);