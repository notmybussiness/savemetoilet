/**
 * Simple frontend test script using Node.js built-in modules
 * Tests the SaveMeToilet frontend functionality
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testFrontendConfig() {
  console.log('🧪 Testing SaveMeToilet Frontend...\n');
  
  try {
    // Test 1: Check .env configuration
    console.log('📋 Test 1: Environment Configuration');
    const envPath = join(__dirname, 'savemetoilet-frontend', '.env');
    const envContent = await readFile(envPath, 'utf-8');
    
    const hasValidApiKey = envContent.includes('VITE_GOOGLE_MAPS_API_KEY') && 
                          !envContent.includes('your_google_maps_api_key_here');
    
    console.log(`   API Key Configured: ${hasValidApiKey ? '✅' : '❌'}`);
    
    if (!hasValidApiKey) {
      console.log('   ⚠️  Google Maps API key needs to be set in .env file');
      console.log('   📖 Get API key from: https://console.cloud.google.com/');
    }
    
    // Test 2: Check GoogleMap component fixes
    console.log('\n📋 Test 2: GoogleMap Component Fixes');
    const componentPath = join(__dirname, 'savemetoilet-frontend', 'src', 'components', 'GoogleMap.jsx');
    const componentContent = await readFile(componentPath, 'utf-8');
    
    const hasBtoaFix = !componentContent.includes('btoa(') && 
                      componentContent.includes('encodeURIComponent(');
    const hasApiKeyCheck = componentContent.includes('your_google_maps_api_key_here');
    const hasContainerCheck = componentContent.includes('mapContainer.current');
    
    console.log(`   btoa → encodeURIComponent: ${hasBtoaFix ? '✅' : '❌'}`);
    console.log(`   API Key Validation: ${hasApiKeyCheck ? '✅' : '❌'}`);
    console.log(`   Map Container Check: ${hasContainerCheck ? '✅' : '❌'}`);
    
    // Test 3: Test URL accessibility
    console.log('\n📋 Test 3: Development Server');
    
    try {
      const response = await fetch('http://localhost:5175/', {
        method: 'HEAD',
        timeout: 5000
      });
      
      console.log(`   Server Status: ${response.status === 200 ? '✅ Running' : '❌ Issues'}`);
      console.log(`   Response Status: ${response.status}`);
      
    } catch (error) {
      console.log('   Server Status: ❌ Not accessible');
      console.log('   Error:', error.message);
      console.log('   💡 Make sure dev server is running: npm run dev');
    }
    
    // Test Results Summary
    console.log('\n📊 Test Summary:');
    const allTestsPassed = hasValidApiKey && hasBtoaFix && hasApiKeyCheck && hasContainerCheck;
    
    console.log(`   Overall Status: ${allTestsPassed ? '✅ All fixes applied' : '⚠️ Some issues remain'}`);
    
    if (!allTestsPassed) {
      console.log('\n🔧 Next Steps:');
      if (!hasValidApiKey) {
        console.log('   1. Get Google Maps API key from Google Cloud Console');
        console.log('   2. Replace "your_google_maps_api_key_here" in .env file');
      }
      console.log('   3. Refresh browser and check console for errors');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFrontendConfig().catch(console.error);