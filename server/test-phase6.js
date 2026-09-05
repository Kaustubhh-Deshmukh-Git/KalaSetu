/**
 * KalaSetu Phase 6 Automated Verification Test Suite
 * Tests Marketplace Connect, Storefront/QR sharing, Publish Fan-out, Orders & Sales, Notifications, and BullMQ Job Queue.
 */
const { connectDB, disconnectDB } = require('./src/config/db');
const { getRedisClient } = require('./src/config/redis');
const MarketplaceListing = require('./src/models/MarketplaceListing');
const Order = require('./src/models/Order');
const Notification = require('./src/models/Notification');
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

const runPhase6Tests = async () => {
  console.log('==================================================================');
  console.log('🧪 Starting KalaSetu Phase 6 Comprehensive Automated Tests');
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
    const phone = '+919876543301';
    const otpRes = await makeRequest('/api/auth/otp/request', 'POST', { phone });
    const verifyRes = await makeRequest('/api/auth/otp/verify', 'POST', {
      phone,
      otp: otpRes.data.devOtp,
    });
    const token = verifyRes.data.token;
    const artisanId = verifyRes.data.user._id;
    console.log(`✅ Test Artisan authenticated: ${artisanId}\n`);

    // 3. Test Marketplace Channels & Storefront Link / QR
    console.log('Step 1: Fetch Marketplace Channels & Storefront Info (GET /api/marketplace)');
    const marketRes = await makeRequest('/api/marketplace', 'GET', null, token);
    console.log(`Status: ${marketRes.status}`);
    console.log(`Storefront URL: ${marketRes.data.storefrontUrl}`);
    console.log(`QR Data Payload: ${marketRes.data.qrDataPayload}`);
    console.log(`Channels count: ${marketRes.data.channels.length}`);

    if (
      marketRes.status === 200 &&
      marketRes.data.storefrontUrl &&
      marketRes.data.qrDataPayload &&
      marketRes.data.channels.some((c) => c.provider === 'storefront' && c.status === 'connected')
    ) {
      console.log('✅ Storefront link, QR payload, and initial channels verified.\n');
    } else {
      throw new Error('Marketplace status check failed.');
    }

    // 4. Test Connecting GeM and Karigar Channels
    console.log('Step 2: Connect GeM and Karigar Channels (POST /api/marketplace/:provider/connect)');
    const gemConnectRes = await makeRequest(
      '/api/marketplace/gem/connect',
      'POST',
      { sellerId: 'GEM-SELLER-9988' },
      token
    );
    const karigarConnectRes = await makeRequest(
      '/api/marketplace/karigar/connect',
      'POST',
      { merchantId: 'KRG-AMZ-7766' },
      token
    );

    if (gemConnectRes.data.success && karigarConnectRes.data.success) {
      console.log('✅ GeM and Amazon Karigar channels connected successfully.\n');
    } else {
      throw new Error('Channel connection failed.');
    }

    // 5. Create Draft Product & Fan-Out Publish
    console.log('Step 3: Create Product and Execute One-Tap Publish Fan-Out (POST /api/products/:id/publish)');
    const createProdRes = await makeRequest(
      '/api/products',
      'POST',
      {
        title: { en: 'Handmade Brass Diya Lamp', hi: 'हस्तनिर्मित पीतल का दीया' },
        category: 'metalcraft',
        materials: ['Pure Brass'],
        rawMaterialCost: 450,
        finalPrice: 1250,
      },
      token
    );
    const productId = createProdRes.data.product._id;

    const publishRes = await makeRequest(`/api/products/${productId}/publish`, 'POST', {}, token);
    console.log(`Published to ${publishRes.data.publishedCount} channels:`, publishRes.data.publishedChannels);

    if (
      publishRes.status === 200 &&
      publishRes.data.product.status === 'published' &&
      publishRes.data.publishedCount >= 3 // Storefront, GeM, Karigar
    ) {
      console.log('✅ One-tap publish fan-out created listings across all connected channels.\n');
    } else {
      throw new Error('Publish fan-out failed.');
    }

    // 6. Test Public Storefront Endpoint
    console.log('Step 4: Query Public Storefront Endpoint (GET /api/marketplace/store/:artisanId)');
    const publicStoreRes = await makeRequest(`/api/marketplace/store/${artisanId}`, 'GET');
    if (
      publicStoreRes.status === 200 &&
      publicStoreRes.data.success &&
      publicStoreRes.data.products.length >= 1
    ) {
      console.log(`✅ Public storefront returned ${publicStoreRes.data.products.length} published item(s) for buyer browsing.\n`);
    } else {
      throw new Error('Public storefront query failed.');
    }

    // 7. Test Orders Lifecycle & Analytics
    console.log('Step 5: Create Incoming Orders and Test Orders Analytics');
    const order1 = await makeRequest(
      '/api/orders',
      'POST',
      {
        productId,
        channel: 'storefront',
        quantity: 2,
        amount: 2500,
        buyerInfo: { name: 'Priya Sharma', phone: '+919876123456', address: 'Jaipur, Rajasthan' },
      },
      token
    );

    const order2 = await makeRequest(
      '/api/orders',
      'POST',
      {
        productId,
        channel: 'gem',
        quantity: 5,
        amount: 6250,
        buyerInfo: { name: 'Govt Procurement Office', phone: '+919811002233', address: 'New Delhi' },
      },
      token
    );

    const orderId1 = order1.data.order._id;
    console.log(`Created orders: ${orderId1} and ${order2.data.order._id}`);

    // Update order status to shipped and completed
    await makeRequest(`/api/orders/${orderId1}/status`, 'PATCH', { status: 'shipped' }, token);
    await makeRequest(`/api/orders/${orderId1}/status`, 'PATCH', { status: 'completed' }, token);

    const ordersListRes = await makeRequest('/api/orders', 'GET', null, token);
    console.log('Orders Metrics:', JSON.stringify(ordersListRes.data.metrics, null, 2));

    if (
      ordersListRes.status === 200 &&
      ordersListRes.data.orders.length === 2 &&
      ordersListRes.data.metrics.totalEarnings === 8750 &&
      ordersListRes.data.metrics.completedOrdersCount === 1
    ) {
      console.log('✅ Orders lifecycle, status transitions, and revenue analytics verified.\n');
    } else {
      throw new Error('Orders management validation failed.');
    }

    // 8. Test Notifications System
    console.log('Step 6: Verify In-App Artisan Notifications (GET /api/notifications)');
    const notifRes = await makeRequest('/api/notifications', 'GET', null, token);
    console.log(`Found ${notifRes.data.notifications.length} notification(s), unread: ${notifRes.data.unreadCount}`);

    if (notifRes.status === 200 && notifRes.data.notifications.length >= 2) {
      const notifId = notifRes.data.notifications[0]._id;
      const readRes = await makeRequest(`/api/notifications/${notifId}/read`, 'PATCH', null, token);
      if (readRes.data.notification.isRead === true) {
        console.log('✅ Notifications logging and mark-as-read verified.\n');
      } else {
        throw new Error('Mark notification read failed.');
      }
    } else {
      throw new Error('Notifications list failed.');
    }

    // 9. Test BullMQ / Async Job Queue Progress Polling
    console.log('Step 7: Test BullMQ / Async AI Job Queue (POST /api/jobs/ai-task & GET /api/jobs/:jobId)');
    const jobSubmitRes = await makeRequest(
      '/api/jobs/ai-task',
      'POST',
      {
        type: 'pricing',
        payload: { productId },
      },
      token
    );

    const jobId = jobSubmitRes.data.jobId;
    console.log(`Enqueued async job: ${jobId}, initial status: ${jobSubmitRes.data.status}`);

    // Wait 100ms for async worker to complete
    await new Promise((res) => setTimeout(res, 100));

    const jobPollRes = await makeRequest(`/api/jobs/${jobId}`, 'GET', null, token);
    console.log('Polled Job Result:', JSON.stringify(jobPollRes.data.job, null, 2));

    if (
      jobPollRes.status === 200 &&
      jobPollRes.data.job.status === 'completed' &&
      jobPollRes.data.job.progress === 100 &&
      jobPollRes.data.job.result
    ) {
      console.log('✅ Async Job Queue and progress polling verified.\n');
    } else {
      throw new Error('Async Job Queue verification failed.');
    }

    console.log('==================================================================');
    console.log('🎉 ALL 7 PHASE 6 COMPREHENSIVE BACKEND TESTS PASSED!');
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

runPhase6Tests();
