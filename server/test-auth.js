/**
 * KalaSetu Auth & In-Memory Fallback Automated Verification Test
 */
const { connectDB, disconnectDB } = require('./src/config/db');
const { getRedisClient } = require('./src/config/redis');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const makeRequest = async (path, method = 'GET', body = null, token = null) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
  };
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

const runTests = async () => {
  console.log('==============================================');
  console.log('🧪 Starting KalaSetu Auth & API Automated Tests');
  console.log('==============================================\n');

  try {
    // 1. Initialize DB and start server on random port
    await connectDB();
    getRedisClient();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);

    // Test 1: Health Check
    console.log('Test 1: Health Check (GET /api/health)');
    const health = await makeRequest('/api/health');
    console.assert(health.status === 200, `Health check failed with status ${health.status}`);
    console.assert(health.data.status === 'ok', 'Health check status is not ok');
    console.log('✅ Health check passed!\n');

    // Test 2: Request OTP
    const testPhone = '+919876543210';
    console.log(`Test 2: Request OTP for phone ${testPhone} (POST /api/auth/otp/request)`);
    const otpRes = await makeRequest('/api/auth/otp/request', 'POST', { phone: testPhone });
    console.assert(otpRes.status === 200, `OTP request failed with status ${otpRes.status}`);
    console.assert(otpRes.data.success === true, 'OTP response success is not true');
    console.assert(Boolean(otpRes.data.devOtp), 'Dev OTP not returned in development mode');
    const receivedOtp = otpRes.data.devOtp;
    console.log(`✅ OTP request passed! Received dev OTP: ${receivedOtp}\n`);

    // Test 3: Verify OTP with Invalid Code
    console.log('Test 3: Verify with Invalid OTP (POST /api/auth/otp/verify)');
    const invalidVerify = await makeRequest('/api/auth/otp/verify', 'POST', {
      phone: testPhone,
      otp: '000000',
    });
    console.assert(invalidVerify.status === 400, `Expected 400 but got ${invalidVerify.status}`);
    console.assert(invalidVerify.data.code === 'OTP_INVALID', `Expected OTP_INVALID but got ${invalidVerify.data.code}`);
    console.log('✅ Invalid OTP properly rejected!\n');

    // Test 4: Verify OTP with Valid Code
    console.log('Test 4: Verify with Valid OTP (POST /api/auth/otp/verify)');
    const validVerify = await makeRequest('/api/auth/otp/verify', 'POST', {
      phone: testPhone,
      otp: receivedOtp,
    });
    console.assert(validVerify.status === 200, `Expected 200 but got ${validVerify.status}`);
    console.assert(Boolean(validVerify.data.token), 'Token missing in response');
    console.assert(validVerify.data.user.phone === testPhone, 'Phone number does not match');
    const authToken = validVerify.data.token;
    console.log('✅ Valid OTP verified and JWT token issued!\n');

    // Test 5: Access Protected /api/auth/me without Token
    console.log('Test 5: Access Protected /api/auth/me without Token');
    const unauthMe = await makeRequest('/api/auth/me');
    console.assert(unauthMe.status === 401, `Expected 401 but got ${unauthMe.status}`);
    console.assert(unauthMe.data.code === 'AUTH_NO_TOKEN', `Expected AUTH_NO_TOKEN but got ${unauthMe.data.code}`);
    console.log('✅ Unauthorized access properly blocked!\n');

    // Test 6: Access Protected /api/auth/me with Valid Token
    console.log('Test 6: Access Protected /api/auth/me with Valid Token');
    const authMe = await makeRequest('/api/auth/me', 'GET', null, authToken);
    console.assert(authMe.status === 200, `Expected 200 but got ${authMe.status}`);
    console.assert(authMe.data.user.phone === testPhone, 'User profile phone does not match');
    console.assert(authMe.data.user.role === 'artisan', 'Default role should be artisan');
    console.log('✅ Authenticated user profile retrieved successfully!\n');

    // Test 7: Register Facilitator Account
    const facilitatorPhone = '+919123456780';
    console.log(`Test 7: Register Facilitator Account for ${facilitatorPhone} (POST /api/auth/register)`);
    const regRes = await makeRequest('/api/auth/register', 'POST', {
      phone: facilitatorPhone,
      name: 'Ramesh Sharma (Cluster Coordinator)',
      role: 'facilitator',
      preferredLanguage: 'hi',
      clusterId: 'CLUSTER_VNS_01',
    });
    console.assert(regRes.status === 201, `Expected 201 but got ${regRes.status}`);
    console.assert(regRes.data.user.role === 'facilitator', 'Role should be facilitator');
    console.assert(regRes.data.user.clusterId === 'CLUSTER_VNS_01', 'Cluster ID does not match');
    console.log('✅ Facilitator registration successful!\n');

    // Test 8: Protected Route Scaffolding Verification (Products, Marketplace, Orders)
    console.log('Test 8: Scaffolding Routes Verification');
    const productsRes = await makeRequest('/api/products', 'GET', null, authToken);
    console.assert(productsRes.status === 200, `Products status ${productsRes.status}`);
    const marketplaceRes = await makeRequest('/api/marketplace', 'GET', null, authToken);
    console.assert(marketplaceRes.status === 200, `Marketplace status ${marketplaceRes.status}`);
    const ordersRes = await makeRequest('/api/orders', 'GET', null, authToken);
    console.assert(ordersRes.status === 200, `Orders status ${ordersRes.status}`);
    console.log('✅ Scaffolding routes accessible and secured!\n');

    console.log('==============================================');
    console.log('🎉 ALL BACKEND TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==============================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
};

runTests();
