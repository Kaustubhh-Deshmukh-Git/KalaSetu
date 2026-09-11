const mongoose = require('mongoose');
const config = require('./src/config/env');
const { connectDB, disconnectDB } = require('./src/config/db');
const { getRedisClient } = require('./src/config/redis');

async function testDatabaseConnectivity() {
  console.log('=== KalaSetu Database & Redis Connectivity Audit ===');
  
  const results = {
    mongo: {
      type: config.mongoUri ? 'External MongoDB' : 'In-Memory MongoDB (mongodb-memory-server)',
      connected: false,
      crudPassed: false,
      error: null,
      host: null,
      details: null
    },
    redis: {
      type: config.redisUrl ? 'External Redis' : 'In-Memory Redis (ioredis-mock)',
      connected: false,
      operationsPassed: false,
      error: null,
      details: null
    }
  };

  // 1. Test MongoDB
  try {
    console.log(`[Test] Connecting to MongoDB (${results.mongo.type})...`);
    await connectDB();
    results.mongo.connected = true;
    results.mongo.host = mongoose.connection.host;
    console.log(`[Test] MongoDB connection established. Host: ${mongoose.connection.host}`);

    // Create a temporary test schema and model
    const testSchema = new mongoose.Schema({
      testId: { type: String, required: true, index: true },
      label: String,
      timestamp: { type: Date, default: Date.now }
    });
    const TestModel = mongoose.models._AuditConnectivityTest || mongoose.model('_AuditConnectivityTest', testSchema);

    // Test WRITE
    const testDoc = await TestModel.create({
      testId: `audit_${Date.now()}`,
      label: 'Connectivity Verification'
    });
    console.log(`[Test] MongoDB write succeeded (doc _id: ${testDoc._id})`);

    // Test READ / QUERY with index
    const queriedDoc = await TestModel.findOne({ testId: testDoc.testId }).lean();
    if (!queriedDoc || queriedDoc.label !== 'Connectivity Verification') {
      throw new Error('Query result did not match inserted document');
    }
    console.log(`[Test] MongoDB query succeeded (found doc with testId: ${queriedDoc.testId})`);

    // Test UPDATE
    await TestModel.updateOne({ _id: testDoc._id }, { $set: { label: 'Updated Label' } });
    const updatedDoc = await TestModel.findById(testDoc._id).lean();
    if (!updatedDoc || updatedDoc.label !== 'Updated Label') {
      throw new Error('Update verification failed');
    }
    console.log(`[Test] MongoDB update verification succeeded`);

    // Test DELETE / CLEANUP
    await TestModel.deleteOne({ _id: testDoc._id });
    const deletedDoc = await TestModel.findById(testDoc._id).lean();
    if (deletedDoc) {
      throw new Error('Deletion verification failed - doc still exists');
    }
    console.log(`[Test] MongoDB delete and cleanup verified`);

    results.mongo.crudPassed = true;
    results.mongo.details = 'Full CRUD lifecycle (create, indexed find, update, delete) succeeded against database';
  } catch (err) {
    results.mongo.error = err.message;
    console.error(`[Test] MongoDB test failed:`, err.message);
  } finally {
    await disconnectDB();
  }

  // 2. Test Redis
  try {
    console.log(`\n[Test] Testing Redis Client (${results.redis.type})...`);
    const redis = getRedisClient();
    
    const testKey = `audit_test_key_${Date.now()}`;
    const testVal = JSON.stringify({ audit: true, time: new Date().toISOString() });

    // SET
    await redis.set(testKey, testVal, 'EX', 10);
    console.log(`[Test] Redis SET succeeded for key: ${testKey}`);

    // GET
    const retrievedVal = await redis.get(testKey);
    if (!retrievedVal || JSON.parse(retrievedVal).audit !== true) {
      throw new Error('Redis GET value mismatch');
    }
    console.log(`[Test] Redis GET succeeded with matched content`);

    // TTL check
    const ttl = await redis.ttl(testKey);
    console.log(`[Test] Redis TTL verification: ${ttl}s`);

    // DEL
    await redis.del(testKey);
    const afterDel = await redis.get(testKey);
    if (afterDel !== null) {
      throw new Error('Redis DEL failed - key still present');
    }
    console.log(`[Test] Redis DEL and key cleanup verified`);

    results.redis.connected = true;
    results.redis.operationsPassed = true;
    results.redis.details = 'Redis SET (with TTL), GET, and DEL operations verified successfully';
  } catch (err) {
    results.redis.error = err.message;
    console.error(`[Test] Redis test failed:`, err.message);
  }

  console.log('\n=== Database & Redis Connectivity Summary ===');
  console.log(JSON.stringify(results, null, 2));

  if (!results.mongo.crudPassed || !results.redis.operationsPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

testDatabaseConnectivity();
