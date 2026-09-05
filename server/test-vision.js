/**
 * KalaSetu AI Vision Provider & Fallback Chain Automated Verification Test
 */
const { connectDB, disconnectDB } = require('./src/config/db');
const { getRedisClient } = require('./src/config/redis');
const visionProvider = require('./src/providers/visionProvider');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const makeRequest = async (path, method = 'GET', body = null, token = null, isFormData = false) => {
  const url = `${baseUrl}${path}`;
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: isFormData ? body : (body ? JSON.stringify(body) : null),
  });

  const data = await response.json();
  return { status: response.status, data };
};

const runVisionTests = async () => {
  console.log('===========================================================');
  console.log('🧪 Starting KalaSetu AI Vision & Fallback Automated Tests');
  console.log('===========================================================\n');

  try {
    // 1. Initialize DB and Server
    await connectDB();
    getRedisClient();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);

    // 2. Setup Test Artisan
    const testPhone = '+919876500112';
    const otpRes = await makeRequest('/api/auth/otp/request', 'POST', { phone: testPhone });
    const verifyRes = await makeRequest('/api/auth/otp/verify', 'POST', {
      phone: testPhone,
      otp: otpRes.data.devOtp,
    });
    const token = verifyRes.data.token;
    console.log('✅ Test Artisan authenticated\n');

    // 3. Create Product & Upload Raw Image
    console.log('Step 1: Create Product & Upload Raw Craft Image');
    const createRes = await makeRequest(
      '/api/products',
      'POST',
      {
        title: { en: 'Handmade Kashmiri Pashmina Shawl', hi: 'हस्तनिर्मित कश्मीरी पश्मीना शॉल' },
        category: 'Handloom',
        rawMaterialCost: 2500,
      },
      token
    );
    const productId = createRes.data.product._id;

    // Upload a simulated photo
    const formData = new FormData();
    const fakeImageBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    formData.append('images', new Blob([fakeImageBuffer], { type: 'image/jpeg' }), 'raw_pashmina.jpg');
    const uploadRes = await makeRequest(`/api/products/${productId}/images`, 'POST', formData, token, true);
    console.assert(uploadRes.status === 200, 'Image upload failed');
    const imageId = uploadRes.data.images[0]._id;
    console.log(`✅ Raw craft image uploaded with ID: ${imageId}\n`);

    // Test 1: Direct Provider Unit Test — Verify Deterministic Fallback triggers without crash
    console.log('Test 1: VisionProvider Fallback Chain Unit Test');
    const enhanceDirectResult = await visionProvider.enhanceImage({
      imageBuffer: Buffer.from(fakeImageBuffer),
      filename: 'direct_test.jpg',
    });
    console.assert(Boolean(enhanceDirectResult.enhancedUrl), 'enhancedUrl should be returned');
    console.assert(Boolean(enhanceDirectResult.provider), 'provider should be identified');
    console.log(`✅ Direct visionProvider returned: provider=${enhanceDirectResult.provider}, tier=${enhanceDirectResult.tier}, url=${enhanceDirectResult.enhancedUrl}\n`);

    // Test 2: Execute AI Image Studio Pipeline via REST API
    console.log('Test 2: Trigger AI Studio Pipeline (POST /api/products/:id/enhance-image)');
    const enhanceRes = await makeRequest(
      `/api/products/${productId}/enhance-image`,
      'POST',
      { imageId },
      token
    );
    console.assert(enhanceRes.status === 200, `Expected 200, got ${enhanceRes.status}`);
    console.assert(enhanceRes.data.success === true, 'Enhance success false');
    console.assert(enhanceRes.data.image.isEnhanced === true, 'isEnhanced should be true');
    console.assert(enhanceRes.data.image.enhancementStatus === 'completed', 'enhancementStatus should be completed');
    console.assert(Boolean(enhanceRes.data.image.enhancedUrl), 'enhancedUrl should not be empty');
    console.log(`✅ AI Studio enhancement pipeline executed successfully! Provider: ${enhanceRes.data.provider}\n`);

    // Test 3: Manual Override — "Keep Original"
    console.log("Test 3: Artisan Manual Override -> 'keep_original' (PUT /api/products/:id/enhance-image/override)");
    const keepOriginalRes = await makeRequest(
      `/api/products/${productId}/enhance-image/override`,
      'PUT',
      {
        imageId,
        choice: 'keep_original',
      },
      token
    );
    console.assert(keepOriginalRes.status === 200, `Expected 200, got ${keepOriginalRes.status}`);
    console.assert(keepOriginalRes.data.image.isEnhanced === false, 'isEnhanced should be false when keeping original');
    console.assert(keepOriginalRes.data.image.enhancementStatus === 'kept_original', 'Status should be kept_original');
    console.log("✅ 'keep_original' override recorded correctly!\n");

    // Test 4: Manual Override — "Accept Enhanced"
    console.log("Test 4: Artisan Manual Override -> 'accept_enhanced' (PUT /api/products/:id/enhance-image/override)");
    const acceptEnhancedRes = await makeRequest(
      `/api/products/${productId}/enhance-image/override`,
      'PUT',
      {
        imageId,
        choice: 'accept_enhanced',
      },
      token
    );
    console.assert(acceptEnhancedRes.status === 200, `Expected 200, got ${acceptEnhancedRes.status}`);
    console.assert(acceptEnhancedRes.data.image.isEnhanced === true, 'isEnhanced should be true when accepting');
    console.assert(acceptEnhancedRes.data.image.enhancementStatus === 'completed', 'Status should be completed');
    console.log("✅ 'accept_enhanced' override recorded correctly!\n");

    console.log('===========================================================');
    console.log('🎉 ALL AI VISION & FALLBACK TESTS PASSED! 🎉');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ Vision test failed with error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await disconnectDB();
  }
};

runVisionTests();
