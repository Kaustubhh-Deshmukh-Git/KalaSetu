/**
 * KalaSetu Dynamic Pricing Assistant Automated Verification Test
 */
const { connectDB, disconnectDB } = require('./src/config/db');
const { getRedisClient } = require('./src/config/redis');
const pricingService = require('./src/services/pricingService');
const PricingHistory = require('./src/models/PricingHistory');
const Product = require('./src/models/Product');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const makeRequest = async (path, method = 'GET', body = null, token = null) => {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json();
  return { status: response.status, data };
};

const runPricingTests = async () => {
  console.log('==================================================================');
  console.log('🧪 Starting KalaSetu Dynamic Pricing Assistant Automated Tests');
  console.log('==================================================================\n');

  try {
    // 1. Initialize DB and Server
    await connectDB();
    getRedisClient();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);

    // 2. Setup Test Artisan A and Artisan B
    const phoneA = '+919876543201';
    const otpResA = await makeRequest('/api/auth/otp/request', 'POST', { phone: phoneA });
    const verifyResA = await makeRequest('/api/auth/otp/verify', 'POST', {
      phone: phoneA,
      otp: otpResA.data.devOtp,
    });
    const tokenA = verifyResA.data.token;

    const phoneB = '+919876543202';
    const otpResB = await makeRequest('/api/auth/otp/request', 'POST', { phone: phoneB });
    const verifyResB = await makeRequest('/api/auth/otp/verify', 'POST', {
      phone: phoneB,
      otp: otpResB.data.devOtp,
    });
    const tokenB = verifyResB.data.token;
    console.log('✅ Two test artisans authenticated\n');

    // 3. Test Direct Fallback Formula Calculation
    console.log('Step 1: Test Direct Deterministic Cost-Plus Formula (pricingService.calculateRuleBasedFallback)');
    const fallbackResultHandloom = pricingService.calculateRuleBasedFallback({
      category: 'handloom',
      materials: ['Pure Silk', 'Zari'],
      rawMaterialCost: 1200,
      tags: ['silk', 'intricate'],
    });

    console.log('  Calculated Handloom Pricing:', JSON.stringify(fallbackResultHandloom, null, 2));
    if (
      fallbackResultHandloom.suggestedPrice > 1200 &&
      fallbackResultHandloom.priceRange.minPrice < fallbackResultHandloom.suggestedPrice &&
      fallbackResultHandloom.priceRange.maxPrice > fallbackResultHandloom.suggestedPrice &&
      fallbackResultHandloom.breakdown.suggestedMargin > 0 &&
      fallbackResultHandloom.breakdown.labourEstimate > 0 &&
      fallbackResultHandloom.modelVersion === 'rule_based_fallback_v1'
    ) {
      console.log('✅ Deterministic formula validated with positive margin, labour estimate, and bounds.\n');
    } else {
      throw new Error('Deterministic formula validation failed.');
    }

    // 4. Create Product under Artisan A
    console.log('Step 2: Create Handcrafted Product for Artisan A');
    const createRes = await makeRequest(
      '/api/products',
      'POST',
      {
        category: 'woodcraft',
        materials: ['Sheesham Wood', 'Brass Inlay'],
        rawMaterialCost: 800,
        tags: ['carved', 'handcrafted', 'jewelry box'],
      },
      tokenA
    );
    const productId = createRes.data.product._id;
    console.log(`✅ Product created: ${productId} (Raw material cost: ₹800)\n`);

    // 5. Test POST /api/products/:id/suggest-price (Microservice unreachable -> rule fallback)
    console.log('Step 3: Run Pricing Assistant (POST /api/products/:id/suggest-price)');
    const suggestRes = await makeRequest(`/api/products/${productId}/suggest-price`, 'POST', {}, tokenA);
    console.log(`Status: ${suggestRes.status}`);
    console.log('Response:', JSON.stringify(suggestRes.data, null, 2));

    if (
      suggestRes.status === 200 &&
      suggestRes.data.success &&
      suggestRes.data.suggestedPrice > 800 &&
      suggestRes.data.priceRange.minPrice &&
      suggestRes.data.priceRange.maxPrice &&
      suggestRes.data.breakdown.rawMaterialCost === 800
    ) {
      console.log('✅ Pricing Assistant endpoint returned valid suggestion & breakdown.\n');
    } else {
      throw new Error('Pricing Assistant endpoint failed.');
    }

    // 6. Verify Product Document Persistence & Pricing Isolation
    console.log('Step 4: Verify Product Document & Privacy Isolation');
    const getRes = await makeRequest(`/api/products/${productId}`, 'GET', null, tokenA);
    const updatedProduct = getRes.data.product;

    if (
      updatedProduct.suggestedPrice &&
      updatedProduct.suggestedPrice.amount === suggestRes.data.suggestedPrice &&
      updatedProduct.finalPrice === null // Final price must NEVER be auto-applied!
    ) {
      console.log('✅ Suggested price persisted to product without auto-applying to finalPrice (Artisan maintains full control).\n');
    } else {
      throw new Error('Product suggestedPrice persistence or finalPrice isolation check failed.');
    }

    // 7. Verify PricingHistory Entry Was Created
    console.log('Step 5: Verify PricingHistory Audit Log in MongoDB');
    const historyEntries = await PricingHistory.find({ productId });
    console.log(`Found ${historyEntries.length} history log(s) for product ${productId}`);
    if (historyEntries.length > 0 && historyEntries[0].suggestedPrice === suggestRes.data.suggestedPrice) {
      console.log('✅ PricingHistory recorded successfully for future model retraining.\n');
    } else {
      throw new Error('PricingHistory record not found or mismatched.');
    }

    // 8. Verify Artisan B Cannot Access Artisan A's Pricing Assistant
    console.log("Step 6: Verify Isolation (Artisan B cannot run pricing on Artisan A's product)");
    const unauthorizedRes = await makeRequest(`/api/products/${productId}/suggest-price`, 'POST', {}, tokenB);
    console.log(`Unauthorized status: ${unauthorizedRes.status}`);
    if (unauthorizedRes.status === 404) {
      console.log("✅ Ownership isolation verified: Artisan B received 404 access denied.\n");
    } else {
      throw new Error(`Expected 404 for unauthorized pricing request, got ${unauthorizedRes.status}`);
    }

    // 9. Verify Artisan can explicitly set Final Price
    console.log('Step 7: Artisan Hand-Edits and Saves Final Selling Price');
    const userFinalPrice = 2450;
    const updateRes = await makeRequest(
      `/api/products/${productId}`,
      'PUT',
      { finalPrice: userFinalPrice, status: 'published' },
      tokenA
    );
    if (updateRes.status === 200 && updateRes.data.product.finalPrice === userFinalPrice) {
      console.log(`✅ Artisan successfully set their final price to ₹${userFinalPrice} (remained fully editable).\n`);
    } else {
      throw new Error('Failed to update finalPrice.');
    }

    console.log('==================================================================');
    console.log('🎉 ALL 7 DYNAMIC PRICING ASSISTANT BACKEND TESTS PASSED!');
    console.log('==================================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
};

runPricingTests();
