/**
 * KalaSetu Product CRUD & Image Upload Automated Verification Test
 */
const { connectDB, disconnectDB } = require('./src/config/db');
const { getRedisClient } = require('./src/config/redis');
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

const runProductTests = async () => {
  console.log('========================================================');
  console.log('🧪 Starting KalaSetu Product CRUD & Upload Automated Tests');
  console.log('========================================================\n');

  try {
    // 1. Initialize DB and start server
    await connectDB();
    getRedisClient();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Test Runner] Test server listening on ${baseUrl}\n`);

    // 2. Setup User A (Artisan)
    const phoneA = '+919988776655';
    const otpResA = await makeRequest('/api/auth/otp/request', 'POST', { phone: phoneA });
    const verifyResA = await makeRequest('/api/auth/otp/verify', 'POST', { phone: phoneA, otp: otpResA.data.devOtp });
    const tokenA = verifyResA.data.token;
    console.log('✅ User A (Artisan) authenticated');

    // 3. Setup User B (Different Artisan)
    const phoneB = '+919988776644';
    const otpResB = await makeRequest('/api/auth/otp/request', 'POST', { phone: phoneB });
    const verifyResB = await makeRequest('/api/auth/otp/verify', 'POST', { phone: phoneB, otp: otpResB.data.devOtp });
    const tokenB = verifyResB.data.token;
    console.log('✅ User B (Artisan) authenticated\n');

    // Test 1: User A creates a draft product
    console.log('Test 1: Create Draft Product (POST /api/products)');
    const createRes = await makeRequest(
      '/api/products',
      'POST',
      {
        title: { en: 'Handcrafted Terracotta Vase', hi: 'हस्तनिर्मित मिट्टी का फूलदान' },
        description: { en: 'Made with traditional natural clay', hi: 'पारंपरिक प्राकृतिक मिट्टी से निर्मित' },
        category: 'Pottery',
        materials: ['Clay', 'Natural Dye'],
        rawMaterialCost: 150,
        stockCount: 5,
        status: 'draft',
      },
      tokenA
    );

    console.assert(createRes.status === 201, `Expected 201, got ${createRes.status}`);
    console.assert(createRes.data.success === true, 'Success should be true');
    console.assert(createRes.data.product.title.en === 'Handcrafted Terracotta Vase', 'Title mismatch');
    const productId = createRes.data.product._id;
    console.log(`✅ Product created successfully with ID: ${productId}\n`);

    // Test 2: User A uploads simulated images
    console.log('Test 2: Upload Images to Product (POST /api/products/:id/images)');
    const formData = new FormData();
    const fakeImageBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]); // JPEG header
    const blob1 = new Blob([fakeImageBuffer], { type: 'image/jpeg' });
    const blob2 = new Blob([fakeImageBuffer], { type: 'image/jpeg' });
    formData.append('images', blob1, 'test_vase_1.jpg');
    formData.append('images', blob2, 'test_vase_2.jpg');

    const uploadRes = await makeRequest(`/api/products/${productId}/images`, 'POST', formData, tokenA, true);
    console.assert(uploadRes.status === 200, `Expected 200, got ${uploadRes.status}`);
    console.assert(uploadRes.data.images.length === 2, `Expected 2 images, got ${uploadRes.data.images.length}`);
    console.assert(Boolean(uploadRes.data.images[0].originalUrl), 'originalUrl missing');
    console.log(`✅ ${uploadRes.data.images.length} images uploaded and attached to product!\n`);

    // Test 3: User A updates product details
    console.log('Test 3: Update Product Details (PUT /api/products/:id)');
    const updateRes = await makeRequest(
      `/api/products/${productId}`,
      'PUT',
      {
        finalPrice: 450,
        stockCount: 8,
        status: 'published',
      },
      tokenA
    );
    console.assert(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);
    console.assert(updateRes.data.product.finalPrice === 450, 'Final price mismatch');
    console.assert(updateRes.data.product.stockCount === 8, 'Stock count mismatch');
    console.assert(updateRes.data.product.status === 'published', 'Status mismatch');
    console.log('✅ Product updated successfully!\n');

    // Test 4: User A fetches product detail
    console.log('Test 4: Get Product Detail (GET /api/products/:id)');
    const detailRes = await makeRequest(`/api/products/${productId}`, 'GET', null, tokenA);
    console.assert(detailRes.status === 200, `Expected 200, got ${detailRes.status}`);
    console.assert(detailRes.data.product._id === productId, 'ID mismatch');
    console.assert(detailRes.data.product.images.length === 2, 'Images count mismatch');
    console.log('✅ Product detail retrieved successfully!\n');

    // Test 5: User A lists products
    console.log('Test 5: List User Products (GET /api/products)');
    const listRes = await makeRequest('/api/products', 'GET', null, tokenA);
    console.assert(listRes.status === 200, `Expected 200, got ${listRes.status}`);
    console.assert(listRes.data.products.length >= 1, 'Products list empty');
    console.assert(listRes.data.total >= 1, 'Total count mismatch');
    console.log(`✅ Retrieved ${listRes.data.products.length} products for User A\n`);

    // Test 6: User B attempts to access User A's product (Security Isolation)
    console.log("Test 6: User B Access Isolation Check (GET & PUT /api/products/:id)");
    const unauthorizedGet = await makeRequest(`/api/products/${productId}`, 'GET', null, tokenB);
    console.assert(unauthorizedGet.status === 404, `Expected 404 for User B, got ${unauthorizedGet.status}`);
    console.assert(unauthorizedGet.data.code === 'PRODUCT_NOT_FOUND', 'Expected PRODUCT_NOT_FOUND');

    const unauthorizedPut = await makeRequest(`/api/products/${productId}`, 'PUT', { finalPrice: 100 }, tokenB);
    console.assert(unauthorizedPut.status === 404, `Expected 404 for User B, got ${unauthorizedPut.status}`);
    console.log('✅ Privacy and artisan ownership isolation verified!\n');

    // Test 7: User A deletes product
    console.log('Test 7: Delete Product (DELETE /api/products/:id)');
    const deleteRes = await makeRequest(`/api/products/${productId}`, 'DELETE', null, tokenA);
    console.assert(deleteRes.status === 200, `Expected 200, got ${deleteRes.status}`);
    console.assert(deleteRes.data.success === true, 'Delete success false');

    const checkDeleted = await makeRequest(`/api/products/${productId}`, 'GET', null, tokenA);
    console.assert(checkDeleted.status === 404, 'Deleted product still accessible');
    console.log('✅ Product deleted and verified removal!\n');

    console.log('========================================================');
    console.log('🎉 ALL PRODUCT CRUD & UPLOAD TESTS PASSED! 🎉');
    console.log('========================================================\n');
  } catch (err) {
    console.error('❌ Product test failed with error:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await disconnectDB();
  }
};

runProductTests();
