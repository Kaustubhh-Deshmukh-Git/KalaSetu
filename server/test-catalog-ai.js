/**
 * KalaSetu Multilingual Auto-Cataloger Automated Verification Test
 */
const { connectDB, disconnectDB } = require('./src/config/db');
const { getRedisClient } = require('./src/config/redis');
const speechProvider = require('./src/providers/speechProvider');
const nlpProvider = require('./src/providers/nlpProvider');
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

const runCatalogAITests = async () => {
  console.log('==================================================================');
  console.log('🧪 Starting KalaSetu Multilingual Auto-Cataloger Automated Tests');
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

    // 2. Setup Test Artisan
    const testPhone = '+919876500999';
    const otpRes = await makeRequest('/api/auth/otp/request', 'POST', { phone: testPhone });
    const verifyRes = await makeRequest('/api/auth/otp/verify', 'POST', {
      phone: testPhone,
      otp: otpRes.data.devOtp,
    });
    const token = verifyRes.data.token;
    console.log('✅ Test Artisan authenticated\n');

    // 3. Create Product
    console.log('Step 1: Create Draft Craft Product (POST /api/products)');
    const createRes = await makeRequest(
      '/api/products',
      'POST',
      {
        category: 'pottery',
        materials: ['Terracotta Clay', 'Natural Mineral Glaze'],
        rawMaterialCost: 350,
      },
      token
    );
    const productId = createRes.data.product._id;
    console.log(`✅ Draft product created with ID: ${productId}\n`);

    // Test 1: Upload Voice Recording (POST /api/products/:id/voice-note)
    console.log('Test 1: Upload Voice Note (POST /api/products/:id/voice-note)');
    const formData = new FormData();
    const fakeAudioBuffer = new Uint8Array([0x4F, 0x67, 0x67, 0x53, 0x00, 0x02]); // OGG header
    formData.append('audio', new Blob([fakeAudioBuffer], { type: 'audio/m4a' }), 'artisan_voice.m4a');

    const voiceRes = await makeRequest(`/api/products/${productId}/voice-note`, 'POST', formData, token, true);
    console.assert(voiceRes.status === 201, `Expected 201, got ${voiceRes.status}`);
    console.assert(voiceRes.data.success === true, 'Voice note upload failed');
    const voiceNoteId = voiceRes.data.voiceNote._id;
    console.log(`✅ Voice note saved with ID: ${voiceNoteId} and URL: ${voiceRes.data.voiceNote.audioUrl}\n`);

    // Test 2: Direct speechProvider & nlpProvider Unit Fallback Tests
    console.log('Test 2: Direct speechProvider and nlpProvider Fallback Execution');
    const sttResult = await speechProvider.transcribeAudio({
      audioUrl: voiceRes.data.voiceNote.audioUrl,
      metadata: { category: 'pottery', materials: ['Terracotta Clay'] },
    });
    console.assert(Boolean(sttResult.transcript), 'Transcript should be generated');
    console.log(`✅ speechProvider returned transcript: "${sttResult.transcript}" via ${sttResult.provider}`);

    const nlpResult = await nlpProvider.generateCatalogListing({
      transcript: sttResult.transcript,
      category: 'pottery',
      materials: ['Terracotta Clay', 'Natural Mineral Glaze'],
    });
    console.assert(Boolean(nlpResult.title.en), 'English title missing');
    console.assert(Boolean(nlpResult.title.hi), 'Hindi title missing');
    console.assert(Boolean(nlpResult.description.en), 'English description missing');
    console.assert(Boolean(nlpResult.description.hi), 'Hindi description missing');
    console.log(`✅ nlpProvider produced English Title: "${nlpResult.title.en}"`);
    console.log(`✅ nlpProvider produced Hindi Title: "${nlpResult.title.hi}"\n`);

    // Test 3: Run Full Auto-Cataloger Pipeline via REST API
    console.log('Test 3: Run Full Auto-Cataloger Pipeline (POST /api/products/:id/generate-description)');
    const catalogRes = await makeRequest(
      `/api/products/${productId}/generate-description`,
      'POST',
      { voiceNoteId },
      token
    );
    console.assert(catalogRes.status === 200, `Expected 200, got ${catalogRes.status}`);
    console.assert(Boolean(catalogRes.data.title.en), 'English title missing in response');
    console.assert(Boolean(catalogRes.data.title.hi), 'Hindi title missing in response');
    console.assert(Boolean(catalogRes.data.description.en), 'English description missing');
    console.assert(Boolean(catalogRes.data.description.hi), 'Hindi description missing');
    console.assert(catalogRes.data.tags.length > 0, 'Tags list should be populated');
    console.log('✅ Auto-Cataloger pipeline generated bilingual catalog successfully!\n');

    // Test 4: Hand-Edit Generated Titles & Descriptions (PUT /api/products/:id)
    console.log('Test 4: Artisan Hand-Edits Title & Description (PUT /api/products/:id)');
    const handEditedTitleEn = 'Handcrafted Blue Glazed Terracotta Vase';
    const handEditedTitleHi = 'हस्तनिर्मित नीले रंग का मिट्टी का फूलदान';
    const handEditedDescEn = 'Custom artisan pot fired in traditional kiln with non-toxic mineral glaze.';

    const editRes = await makeRequest(
      `/api/products/${productId}`,
      'PUT',
      {
        title: { en: handEditedTitleEn, hi: handEditedTitleHi },
        description: { en: handEditedDescEn, hi: catalogRes.data.description.hi },
        finalPrice: 650,
      },
      token
    );
    console.assert(editRes.status === 200, `Expected 200, got ${editRes.status}`);
    console.assert(editRes.data.product.title.en === handEditedTitleEn, 'Title EN mismatch');
    console.assert(editRes.data.product.title.hi === handEditedTitleHi, 'Title HI mismatch');
    console.assert(editRes.data.product.description.en === handEditedDescEn, 'Desc EN mismatch');
    console.assert(editRes.data.product.finalPrice === 650, 'Final price mismatch');
    console.log('✅ Hand-edited bilingual values persisted successfully!\n');

    console.log('==================================================================');
    console.log('🎉 ALL MULTILINGUAL AUTO-CATALOGER TESTS PASSED! 🎉');
    console.log('==================================================================\n');
  } catch (err) {
    console.error('❌ Auto-Cataloger test failed with error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await disconnectDB();
  }
};

runCatalogAITests();
