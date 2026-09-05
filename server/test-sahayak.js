const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('./src/app');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');

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

async function runTests() {
  console.log('==============================================');
  console.log('🧪 Starting Sahayak AI Assistant Automated Tests');
  console.log('==============================================\n');

  try {
    // 1. Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Test Setup] In-memory MongoDB connected.');

    // 2. Start Test Express Server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Test Setup] Test server listening on ${baseUrl}\n`);

    // 3. Create test artisan and obtain JWT token
    const testPhone = '+919988776655';
    await makeRequest('POST', '/api/auth/otp/request', { phone: testPhone });
    const verifyRes = await makeRequest('POST', '/api/auth/otp/verify', {
      phone: testPhone,
      otp: '123456',
    });

    let token = verifyRes.data?.data?.token;
    let artisan = await User.findOne({ phone: testPhone });
    if (!token && artisan) {
      const jwt = require('jsonwebtoken');
      token = jwt.sign({ id: artisan._id }, process.env.JWT_SECRET || 'kalasetu_jwt_secret_development_key_change_in_production_2026', { expiresIn: '1d' });
    }

    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('Test 1: Artisan Session Authenticated ✅');

    // 4. Seed Product and Order
    const seededProduct = await Product.create({
      owner: artisan._id,
      title: { en: 'Handmade Blue Pottery Vase', hi: 'हस्तनिर्मित नीली मिट्टी का फूलदान' },
      description: { en: 'Traditional Jaipur ceramic craft', hi: 'पारंपरिक जयपुर सिरेमिक कला' },
      finalPrice: 1250,
      suggestedPrice: { amount: 1250 },
      status: 'published',
      images: [{ originalUrl: 'https://example.com/test.jpg' }],
    });

    await Order.create({
      owner: artisan._id,
      productId: seededProduct._id,
      buyerInfo: { name: 'Aarav Sharma', phone: '+919876543210' },
      channel: 'storefront',
      quantity: 2,
      amount: 2500,
      status: 'new',
    });

    console.log('Test 2: Sample Product & Order Seeded in DB ✅\n');

    // 5. Test Quick Prompts
    console.log('Test 3: Fetch Sahayak Quick Prompts (GET /api/v1/sahayak/quick-prompts)');
    const promptsRes = await makeRequest('GET', '/api/v1/sahayak/quick-prompts', null, authHeaders);
    if (promptsRes.status === 200 && Array.isArray(promptsRes.data.data) && promptsRes.data.data.length >= 3) {
      console.log(`✅ Quick prompts returned successfully (${promptsRes.data.data.length} prompts)`);
    } else {
      throw new Error(`Failed quick prompts: ${JSON.stringify(promptsRes.data)}`);
    }

    // 6. Test order_status Intent
    console.log('\nTest 4: Order Status Intent ("मेरे कितने ऑर्डर आए हैं?")');
    const orderQueryRes = await makeRequest('POST', '/api/v1/sahayak/query', {
      queryText: 'मेरे कितने ऑर्डर आए हैं?',
    }, authHeaders);

    if (
      orderQueryRes.status === 200 &&
      orderQueryRes.data.data.intent === 'order_status' &&
      orderQueryRes.data.data.data.totalOrders === 1 &&
      orderQueryRes.data.data.data.totalRevenue === 2500
    ) {
      console.log('✅ order_status intent accurately classified and live DB counts returned:');
      console.log('   Hindi:  ', orderQueryRes.data.data.answer.hi);
      console.log('   English:', orderQueryRes.data.data.answer.en);
    } else {
      throw new Error(`Order status query failed: ${JSON.stringify(orderQueryRes.data)}`);
    }

    // 7. Test listing_status Intent
    console.log('\nTest 5: Listing Status Intent ("How many products are live?")');
    const listingQueryRes = await makeRequest('POST', '/api/v1/sahayak/query', {
      queryText: 'How many products are live in my catalog?',
    }, authHeaders);

    if (
      listingQueryRes.status === 200 &&
      listingQueryRes.data.data.intent === 'listing_status' &&
      listingQueryRes.data.data.data.totalProducts === 1
    ) {
      console.log('✅ listing_status intent accurately classified:');
      console.log('   Hindi:  ', listingQueryRes.data.data.answer.hi);
      console.log('   English:', listingQueryRes.data.data.answer.en);
    } else {
      throw new Error(`Listing status query failed: ${JSON.stringify(listingQueryRes.data)}`);
    }

    // 8. Test how_to Intent Grounding
    console.log('\nTest 6: Grounded FAQ Intent ("फोटो की बैकग्राउंड कैसे हटाएं?")');
    const howToQueryRes = await makeRequest('POST', '/api/v1/sahayak/query', {
      queryText: 'फोटो की बैकग्राउंड कैसे हटाएं?',
    }, authHeaders);

    if (
      howToQueryRes.status === 200 &&
      howToQueryRes.data.data.intent === 'how_to' &&
      howToQueryRes.data.data.answer.hi.includes('स्टूडियो')
    ) {
      console.log('✅ how_to grounded FAQ accurately matched and answered:');
      console.log('   Hindi:  ', howToQueryRes.data.data.answer.hi);
      console.log('   English:', howToQueryRes.data.data.answer.en);
    } else {
      throw new Error(`How-To query failed: ${JSON.stringify(howToQueryRes.data)}`);
    }

    console.log('\n==============================================');
    console.log('🎉 ALL SAHAYAK AI ASSISTANT TESTS PASSED! 🎉');
    console.log('==============================================\n');
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    process.exit(0);
  }
}

runTests();
