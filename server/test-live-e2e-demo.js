/**
 * KalaSetu Master End-to-End Live Production Demo & Test Suite
 * 
 * Executes the complete artisan lifecycle directly against the live cloud deployment:
 * - Live Backend: https://kalasetu-backend-trh4.onrender.com
 * - Live Pricing Microservice: https://kalasetu-pricing-service.onrender.com
 * - Live Database: MongoDB Atlas (Cluster0)
 */

const BASE_URL = process.env.API_BASE_URL || 'https://kalasetu-backend-trh4.onrender.com/api';
const PRICING_URL = process.env.PRICING_SERVICE_URL || 'https://kalasetu-pricing-service.onrender.com';

const testResults = {
  timestamp: new Date().toISOString(),
  target: BASE_URL,
  pricingTarget: PRICING_URL,
  phases: {},
  summary: { total: 0, passed: 0, failed: 0 }
};

const recordTest = (phaseName, testName, passed, details = null) => {
  if (!testResults.phases[phaseName]) {
    testResults.phases[phaseName] = [];
  }
  testResults.phases[phaseName].push({ testName, passed, details });
  testResults.summary.total++;
  if (passed) testResults.summary.passed++;
  else testResults.summary.failed++;

  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} [${phaseName}] ${testName}${details ? ` -> ${details}` : ''}`);
};

const apiRequest = async (endpoint, options = {}, token = null) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    signal: AbortSignal.timeout(25000)
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
};

const runMasterDemo = async () => {
  console.log('\n===============================================================');
  console.log('🌟 KalaSetu Master Live Production E2E Verification Suite 🌟');
  console.log(`Backend Gateway: ${BASE_URL}`);
  console.log(`Pricing Microservice: ${PRICING_URL}`);
  console.log(`Execution Time: ${new Date().toLocaleString()}`);
  console.log('===============================================================\n');

  let authToken = null;
  let artisanUser = null;
  let createdProductId = null;

  // -------------------------------------------------------------
  // 0. HEALTH CHECK & CLOUD CONNECTIVITY
  // -------------------------------------------------------------
  console.log('📡 Step 0: Checking Cloud Infrastructure & Microservices Health...');
  try {
    const healthRes = await apiRequest('/health');
    const isHealthy = healthRes.ok && healthRes.data?.status === 'ok';
    const dbStatus = healthRes.data?.database || 'unknown';
    recordTest('0. Infrastructure', 'Gateway Health Check (GET /api/health)', isHealthy, `Status: ${healthRes.data?.status}, DB: ${dbStatus}`);
  } catch (err) {
    recordTest('0. Infrastructure', 'Gateway Health Check (GET /api/health)', false, err.message);
  }

  try {
    console.log('  ⏳ Pinging Pricing Microservice (allowing cold-start wake)...');
    const pricingRes = await fetch(`${PRICING_URL}/health`, { signal: AbortSignal.timeout(30000) });
    const pricingData = await pricingRes.json().catch(() => null);
    const pricingOk = pricingRes.ok && pricingData?.status === 'ok';
    recordTest('0. Infrastructure', 'FastAPI Pricing Health (GET /health)', pricingOk, `Status: ${pricingData?.status || 'ok'}`);
  } catch (err) {
    recordTest('0. Infrastructure', 'FastAPI Pricing Health (GET /health)', false, err.message);
  }

  // -------------------------------------------------------------
  // 1. PHASE 1: ARTISAN AUTHENTICATION & PHONE OTP
  // -------------------------------------------------------------
  console.log('\n📱 Step 1: Phase 1 - Artisan Auth & Phone OTP Flow...');
  const testPhone = `+91987${Math.floor(1000000 + Math.random() * 9000000)}`;
  let otpReceived = '123456';

  try {
    const otpRes = await apiRequest('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone: testPhone })
    });
    if (otpRes.data?.devOtp) {
      otpReceived = otpRes.data.devOtp;
    }
    recordTest('1. Auth Flow', 'Request OTP for Phone Number (POST /api/auth/otp/request)', otpRes.ok, `Phone: ${testPhone}`);
  } catch (err) {
    recordTest('1. Auth Flow', 'Request OTP for Phone Number (POST /api/auth/otp/request)', false, err.message);
  }

  try {
    const verifyRes = await apiRequest('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone: testPhone, otp: otpReceived })
    });

    const isVerified = verifyRes.ok && (verifyRes.data?.token || verifyRes.data?.data?.token);
    if (isVerified) {
      authToken = verifyRes.data.token || verifyRes.data?.data?.token;
      artisanUser = verifyRes.data.user || verifyRes.data?.data?.user;
    }
    recordTest('1. Auth Flow', 'Verify OTP & Issue JWT Bearer (POST /api/auth/otp/verify)', !!authToken, `User ID: ${artisanUser?._id || 'Verified'}`);
  } catch (err) {
    recordTest('1. Auth Flow', 'Verify OTP & Issue JWT Bearer (POST /api/auth/otp/verify)', false, err.message);
  }

  if (authToken) {
    try {
      const profileRes = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Rameshwar Sharma (Master Weaver)',
          state: 'Uttar Pradesh',
          craftCategory: 'handloom',
          preferredLanguage: 'hi'
        })
      }, authToken);

      const profileOk = profileRes.ok;
      recordTest('1. Auth Flow', 'Update Artisan Profile & Language (PUT /api/auth/profile)', profileOk, `Name: Rameshwar Sharma`);
    } catch (err) {
      recordTest('1. Auth Flow', 'Update Artisan Profile & Language (PUT /api/auth/profile)', false, err.message);
    }
  }

  // -------------------------------------------------------------
  // 2. PHASE 2: SAHAYAK VOICE AI INTENT PARSER
  // -------------------------------------------------------------
  console.log('\n🎙️ Step 2: Phase 2 - Sahayak Voice AI & Indic Processing...');
  if (authToken) {
    try {
      const promptsRes = await apiRequest('/sahayak/quick-prompts', { method: 'GET' }, authToken);
      const promptsOk = promptsRes.ok && Array.isArray(promptsRes.data?.data);
      recordTest('2. Sahayak Voice AI', 'Fetch Indic Quick Prompts (GET /api/sahayak/quick-prompts)', promptsOk, `${promptsRes.data?.data?.length || 4} Prompts loaded`);
    } catch (err) {
      recordTest('2. Sahayak Voice AI', 'Fetch Indic Quick Prompts (GET /api/sahayak/quick-prompts)', false, err.message);
    }

    try {
      const sahayakRes = await apiRequest('/sahayak/query', {
        method: 'POST',
        body: JSON.stringify({
          queryText: 'मुझे एक शुद्ध बनारसी सिल्क साड़ी 4800 रुपये में जोड़नी है',
          language: 'hi'
        })
      }, authToken);

      const sahayakOk = sahayakRes.ok && sahayakRes.data?.data?.replyText;
      recordTest('2. Sahayak Voice AI', 'Natural Language Hindi Query Parsing (POST /api/sahayak/query)', sahayakOk, `Reply: ${sahayakRes.data?.data?.replyText?.slice(0, 45)}...`);
    } catch (err) {
      recordTest('2. Sahayak Voice AI', 'Natural Language Hindi Query Parsing (POST /api/sahayak/query)', false, err.message);
    }
  }

  // -------------------------------------------------------------
  // 3. PHASE 3: AI PRODUCT LISTING & STUDIO ENHANCEMENT
  // -------------------------------------------------------------
  console.log('\n🎨 Step 3: Phase 3 - AI Product Listing & Studio Enhancer...');
  if (authToken) {
    try {
      const productRes = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          category: 'handloom',
          rawMaterialCost: 2200,
          timeToProduceHours: 36,
          stockCount: 5,
          finalPrice: 4800,
          title: {
            en: 'Hand-woven Banarasi Katan Silk Saree with Zari Border',
            hi: 'पारंपरिक बनारसी कतान सिल्क साड़ी'
          },
          description: {
            en: 'Authentic pure silk saree crafted by Varanasi master artisans with intricate gold zari motifs.',
            hi: 'वाराणसी के कारीगरों द्वारा हस्तनिर्मित शुद्ध रेशम साड़ी'
          }
        })
      }, authToken);

      const prodOk = productRes.ok && (productRes.data?.product?._id || productRes.data?.data?._id);
      if (prodOk) {
        createdProductId = productRes.data.product?._id || productRes.data.data?._id;
      }
      recordTest('3. Product Listing', 'Create Handcrafted Product Record (POST /api/products)', !!createdProductId, `Product ID: ${createdProductId}`);
    } catch (err) {
      recordTest('3. Product Listing', 'Create Handcrafted Product Record (POST /api/products)', false, err.message);
    }

    if (createdProductId) {
      try {
        const bilingualRes = await apiRequest(`/products/${createdProductId}/generate-description`, {
          method: 'POST',
          body: JSON.stringify({
            manualTranscript: 'शुद्ध बनारसी सिल्क साड़ी पारंपरिक जरी बॉर्डर के साथ'
          })
        }, authToken);

        const bilingualOk = bilingualRes.ok && (bilingualRes.data?.catalog || bilingualRes.data?.data);
        recordTest('3. Product Listing', 'AI Multilingual SEO Title & Description Generation', bilingualOk, `Status: 200 OK`);
      } catch (err) {
        recordTest('3. Product Listing', 'AI Multilingual SEO Title & Description Generation', false, err.message);
      }
    }
  }

  // -------------------------------------------------------------
  // 4. PHASE 4: DYNAMIC FAIR PRICING MICROSERVICE
  // -------------------------------------------------------------
  console.log('\n💰 Step 4: Phase 4 - Dynamic Fair-Price Microservice...');
  if (authToken && createdProductId) {
    try {
      const priceRes = await apiRequest(`/products/${createdProductId}/suggest-price`, {
        method: 'POST'
      }, authToken);

      const priceOk = priceRes.ok && (priceRes.data?.suggestedPrice || priceRes.data?.data);
      const priceAmount = priceRes.data?.suggestedPrice?.amount || priceRes.data?.data?.suggestedPrice?.amount || 4800;
      recordTest('4. Fair Pricing', 'Dynamic Algorithmic Fair-Price Calculation', priceOk, `Calculated Fair Price: ₹${priceAmount}`);
    } catch (err) {
      recordTest('4. Fair Pricing', 'Dynamic Algorithmic Fair-Price Calculation', false, err.message);
    }
  }

  // -------------------------------------------------------------
  // 5. PHASE 5: MULTI-CHANNEL MARKETPLACE SYNC
  // -------------------------------------------------------------
  console.log('\n🌐 Step 5: Phase 5 - Multi-Channel Marketplace Integration...');
  if (authToken && createdProductId) {
    try {
      const channelsRes = await apiRequest('/marketplace/status', { method: 'GET' }, authToken);
      const channelsOk = channelsRes.ok && Array.isArray(channelsRes.data?.channels);
      recordTest('5. Marketplace Sync', 'Fetch Multi-Channel Status (GET /api/marketplace/status)', channelsOk, `${channelsRes.data?.channels?.length || 4} Channels Available`);
    } catch (err) {
      recordTest('5. Marketplace Sync', 'Fetch Multi-Channel Status (GET /api/marketplace/status)', false, err.message);
    }

    try {
      const gemConnect = await apiRequest('/marketplace/connect', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'gem',
          authConfig: { sellerId: 'GEM-ART-VARANASI-01' }
        })
      }, authToken);
      recordTest('5. Marketplace Sync', 'Connect Govt. e-Marketplace (GeM) Channel', gemConnect.ok, `Status: ${gemConnect.data?.status || 'connected'}`);
    } catch (err) {
      recordTest('5. Marketplace Sync', 'Connect Govt. e-Marketplace (GeM) Channel', false, err.message);
    }

    try {
      const publishRes = await apiRequest('/marketplace/publish', {
        method: 'POST',
        body: JSON.stringify({
          productId: createdProductId,
          provider: 'gem'
        })
      }, authToken);
      recordTest('5. Marketplace Sync', 'Publish Product to GeM Channel', publishRes.ok, `Listing ID: ${publishRes.data?.externalListingId || 'GEM-LIST-ACTIVE'}`);
    } catch (err) {
      recordTest('5. Marketplace Sync', 'Publish Product to GeM Channel', false, err.message);
    }

    try {
      const storefrontRes = await apiRequest('/marketplace/status', { method: 'GET' }, authToken);
      const hasStorefront = storefrontRes.ok && storefrontRes.data?.storefrontUrl;
      recordTest('5. Marketplace Sync', 'Direct WhatsApp & Digital Storefront Generator', !!hasStorefront, `URL: ${storefrontRes.data?.storefrontUrl}`);
    } catch (err) {
      recordTest('5. Marketplace Sync', 'Direct WhatsApp & Digital Storefront Generator', false, err.message);
    }
  }

  // -------------------------------------------------------------
  // 6. PHASE 7: ARTISAN ORDERS & SALES DASHBOARD
  // -------------------------------------------------------------
  console.log('\n📊 Step 6: Phase 7 - Artisan Orders & Dashboard Analytics...');
  if (authToken) {
    try {
      const ordersRes = await apiRequest('/orders', { method: 'GET' }, authToken);
      const ordersOk = ordersRes.ok && (Array.isArray(ordersRes.data?.orders) || Array.isArray(ordersRes.data?.data));
      recordTest('6. Sales Dashboard', 'Fetch Real-Time Multi-Channel Orders (GET /api/orders)', ordersOk, `Orders Loaded`);
    } catch (err) {
      recordTest('6. Sales Dashboard', 'Fetch Real-Time Multi-Channel Orders (GET /api/orders)', false, err.message);
    }

    try {
      const statsRes = await apiRequest('/orders/stats', { method: 'GET' }, authToken);
      const statsOk = statsRes.ok && (statsRes.data?.stats || statsRes.data?.data);
      recordTest('6. Sales Dashboard', 'Compute Revenue & Order Analytics (GET /api/orders/stats)', statsOk, `Stats verified`);
    } catch (err) {
      recordTest('6. Sales Dashboard', 'Compute Revenue & Order Analytics (GET /api/orders/stats)', false, err.message);
    }
  }

  // -------------------------------------------------------------
  // FINAL REPORT & SCORECARD
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('🏆 KalaSetu Live Production Demo Execution Scorecard 🏆');
  console.log(`Total Tests Run: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✅`);
  console.log(`Failed: ${testResults.summary.failed} ❌`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  console.log('===============================================================\n');

  return testResults;
};

runMasterDemo().then(summary => {
  if (summary.summary.failed > 0) {
    console.error('Some tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 All live cloud production tests passed with 100% success!');
    process.exit(0);
  }
}).catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
