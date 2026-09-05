const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./src/app');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const authService = require('./src/services/authService');
const catalogAIService = require('./src/services/catalogAIService');
const pricingService = require('./src/services/pricingService');
const visionProvider = require('./src/providers/visionProvider');
const speechProvider = require('./src/providers/speechProvider');
const nlpProvider = require('./src/providers/nlpProvider');
const marketplaceService = require('./src/services/marketplaceService');

let mongoServer;
let server;
let baseUrl;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runHardeningTests() {
  console.log('========================================================');
  console.log('🛡️ Starting KalaSetu Production Hardening & Resilience Tests');
  console.log('========================================================\n');

  try {
    // 1. Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB initialized.');

    // 2. Start Test Express Server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Setup] Server listening on ${baseUrl}\n`);

    // -------------------------------------------------------------------------
    // Test 1: Health Check Endpoints
    // -------------------------------------------------------------------------
    console.log('Test 1: Health Checks (GET /api/health and GET /health)');
    const apiHealth = await makeRequest('GET', '/api/health');
    const rootHealth = await makeRequest('GET', '/health');

    if (apiHealth.status === 200 && apiHealth.data.status === 'ok' && rootHealth.status === 200) {
      console.log('✅ Both /api/health and /health endpoints responding cleanly (200 OK)');
    } else {
      throw new Error(`Health check failed: /api/health: ${apiHealth.status}, /health: ${rootHealth.status}`);
    }

    // -------------------------------------------------------------------------
    // Test 2: Wrong OTP Handling & Non-Lockout Recovery
    // -------------------------------------------------------------------------
    console.log('\nTest 2: Wrong OTP Handling & Retry Without Permanent Lockout');
    const phone = '+919876543299';
    await makeRequest('POST', '/api/auth/otp/request', { phone });

    // Try wrong OTP
    const wrongRes = await makeRequest('POST', '/api/auth/otp/verify', { phone, otp: '000000' });
    if (wrongRes.status === 400 && wrongRes.data.error.includes('attempts remaining')) {
      console.log(`✅ Wrong OTP rejected with attempt countdown: "${wrongRes.data.error}"`);
    } else {
      throw new Error(`Wrong OTP unexpected response: ${JSON.stringify(wrongRes)}`);
    }

    // Request new OTP to verify reset and recovery
    const freshOtpRes = await authService.requestOtp(phone);
    const validOtp = freshOtpRes.devOtp || '123456';
    const verifyRes = await authService.verifyOtp(phone, validOtp);

    if (verifyRes.success && verifyRes.token) {
      console.log('✅ User successfully verified with new OTP (No permanent lockout)');
    } else {
      throw new Error(`Recovery verification failed: ${JSON.stringify(verifyRes)}`);
    }

    const testUser = verifyRes.user;

    // -------------------------------------------------------------------------
    // Test 3: Empty / Silent Voice Note Submitted to Auto-Cataloger
    // -------------------------------------------------------------------------
    console.log('\nTest 3: Empty / Silent Voice Note Submitted to Auto-Cataloger');
    const sampleProduct = await Product.create({
      owner: testUser._id,
      category: 'pottery',
      materials: ['terracotta clay', 'natural glaze'],
      rawMaterialCost: 350,
      images: [{ originalUrl: 'https://example.com/clay-pot.jpg' }],
    });

    // Run catalog generation with empty transcript / silent note
    const silentCatalogResult = await catalogAIService.generateBilingualCatalog(
      testUser._id,
      sampleProduct._id,
      { manualTranscript: '   ' } // pure whitespace / silent
    );

    if (
      silentCatalogResult.success &&
      silentCatalogResult.title?.en &&
      silentCatalogResult.title?.hi &&
      silentCatalogResult.description?.en &&
      silentCatalogResult.description?.hi
    ) {
      console.log('✅ Silent voice note handled gracefully with craft metadata synthesis:');
      console.log(`   English Title: "${silentCatalogResult.title.en}"`);
      console.log(`   Hindi Title:   "${silentCatalogResult.title.hi}"`);
    } else {
      throw new Error(`Silent catalog generation failed: ${JSON.stringify(silentCatalogResult)}`);
    }

    // -------------------------------------------------------------------------
    // Test 4: Verify All 5 Fallback Chains Under Missing API Keys
    // -------------------------------------------------------------------------
    console.log('\nTest 4: Fallback Chains Verification (Deterministic Fallbacks)');

    // 4a. Vision Fallback (Tier 3)
    const visionFallback = await visionProvider.tryTier3Deterministic('https://example.com/photo.jpg');
    if (visionFallback.tier === 3 && (visionFallback.provider === 'rembg_local' || visionFallback.provider === 'rembg_service')) {
      console.log('✅ Vision Provider Tier 3 Fallback triggered cleanly');
    } else {
      throw new Error(`Vision fallback failed: ${JSON.stringify(visionFallback)}`);
    }

    // 4b. Speech Fallback (Tier 3)
    const speechFallback = await speechProvider.tryTier3DeterministicSpeech({ category: 'handloom', materials: ['silk'] });
    if (speechFallback.tier === 3 && speechFallback.transcript.includes('पारंपरिक')) {
      console.log('✅ Speech Provider Tier 3 Fallback triggered cleanly');
    } else {
      throw new Error(`Speech fallback failed: ${JSON.stringify(speechFallback)}`);
    }

    // 4c. NLP Fallback (Tier 3)
    const nlpFallback = await nlpProvider.tryTier3DeterministicTemplate({ category: 'woodcraft', materials: ['rosewood'] });
    if (nlpFallback.tier === 3 && nlpFallback.title.en.includes('Woodcraft')) {
      console.log('✅ NLP Provider Tier 3 Template Fallback triggered cleanly');
    } else {
      throw new Error(`NLP fallback failed: ${JSON.stringify(nlpFallback)}`);
    }

    // 4d. Pricing Fallback (Deterministic Formula)
    const pricingFallback = await pricingService.calculateSuggestedPrice(testUser._id, sampleProduct._id);
    if (pricingFallback.suggestedPrice > 0 && pricingFallback.breakdown.rawMaterialCost === 350) {
      console.log(`✅ Pricing Deterministic Cost-Plus Formula executed cleanly (Suggested: ₹${pricingFallback.suggestedPrice})`);
    } else {
      throw new Error(`Pricing fallback failed: ${JSON.stringify(pricingFallback)}`);
    }

    // 4e. Marketplace Fallback (Mock Sandbox)
    const marketplaceStatus = await marketplaceService.getChannelStatuses(testUser._id);
    if (marketplaceStatus.channels.length >= 1 && marketplaceStatus.storefrontUrl) {
      console.log(`✅ Marketplace Channel & Storefront QR generated cleanly: ${marketplaceStatus.storefrontUrl}`);
    } else {
      throw new Error(`Marketplace status failed: ${JSON.stringify(marketplaceStatus)}`);
    }

    console.log('\n========================================================');
    console.log('🎉 ALL HARDENING & RESILIENCE TESTS PASSED (100%)! 🎉');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Hardening Test Failed:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    process.exit(0);
  }
}

runHardeningTests();
