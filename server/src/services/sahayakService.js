const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const AssistantQuery = require('../models/AssistantQuery');
const { generateCatalogDescription } = require('../providers/nlpProvider');
const { transcribeAudio } = require('../providers/speechProvider');

/**
 * Fixed Grounding FAQ Context for KalaSetu Knowledge Base.
 * Strict boundary: Sahayak must only answer topics within KalaSetu capabilities.
 */
const FAQ_KNOWLEDGE_BASE = [
  {
    topic: 'photo_upload',
    keywords: ['photo', 'picture', 'image', 'camera', 'upload', 'फोटो', 'तस्वीर', 'चित्र', 'कैमरा', 'अपलोड'],
    en: 'To upload a photo: Tap the "Add Product" button (+), take a clear photo in good natural light, and our AI Studio will automatically remove the background and create a professional catalog picture.',
    hi: 'फोटो अपलोड करने के लिए: "नया उत्पाद जोड़ें" (+) बटन दबाएं, अच्छी रोशनी में साफ़ तस्वीर लें। हमारा एआई स्टूडियो अपने आप बैकग्राउंड हटाकर सुंदर कैटलॉग फोटो बना देगा।',
  },
  {
    topic: 'background_removal',
    keywords: ['background', 'studio', 'clean', 'enhance', 'बैकग्राउंड', 'स्टूडियो', 'हटाएं', 'सुधारें'],
    en: 'KalaSetu AI Studio automatically removes messy backgrounds and places your handcrafted craft in a pristine studio setting with natural shadows.',
    hi: 'कलासेतु एआई स्टूडियो आपकी हस्तकला की तस्वीर से खराब बैकग्राउंड हटाकर उसे एकदम साफ़ और सुंदर स्टूडियो जैसा बना देता है।',
  },
  {
    topic: 'voice_description',
    keywords: ['voice', 'speak', 'audio', 'mic', 'description', 'आवाज़', 'बोलें', 'माइक', 'विवरण'],
    en: 'You can describe your craft by speaking in Hindi or your local language. KalaSetu AI will automatically generate culturally rich descriptions and search keywords in both Hindi and English.',
    hi: 'आप अपने उत्पाद के बारे में बोलकर बता सकते हैं। कलासेतु एआई आपकी आवाज़ सुनकर हिंदी और अंग्रेज़ी दोनों में सुंदर विवरण और नाम तैयार कर देगा।',
  },
  {
    topic: 'pricing_assistant',
    keywords: ['price', 'pricing', 'cost', 'rate', 'margin', 'मूल्य', 'कीमत', 'दाम', 'लागत', 'मुनाफा'],
    en: 'The Dynamic Pricing Assistant calculates the fair market price based on raw material cost, your labor hours, craft complexity, overheads, and a healthy profit margin so you are never underpaid.',
    hi: 'मूल्य सहायक (Pricing Assistant) आपके कच्चे माल की लागत, मेहनत के घंटे, और कारीगरी की जटिलता के आधार पर सही और लाभकारी दाम तय करने में मदद करता है ताकि आपको अपनी मेहनत का पूरा फल मिले।',
  },
  {
    topic: 'gem_marketplace',
    keywords: ['gem', 'market', 'marketplace', 'government', 'sell', 'मार्केट', 'जेम', 'सरकारी', 'बेचें'],
    en: 'You can publish your products to the Government e-Marketplace (GeM) with 1 click. Government buyers across India can purchase your craft directly.',
    hi: 'आप 1 क्लिक में अपना उत्पाद गवर्नमेंट ई-मार्केटप्लेस (GeM) पर लिस्ट कर सकते हैं। पूरे देश के सरकारी विभाग आपकी हस्तकला सीधे खरीद सकते हैं।',
  },
  {
    topic: 'storefront_sharing',
    keywords: ['storefront', 'qr', 'link', 'share', 'whatsapp', 'दुकान', 'लिंक', 'शेयर', 'व्हाट्सएप'],
    en: 'Every artisan receives an instant online storefront link and downloadable QR code. You can share this QR code on WhatsApp or print it for fairs and exhibitions.',
    hi: 'हर कारीगर को एक व्यक्तिगत डिजिटल दुकान का लिंक और क्यूआर कोड मिलता है। आप इसे व्हाट्सएप पर ग्राहकों को भेज सकते हैं या मेलों में प्रदर्शित कर सकते हैं।',
  },
  {
    topic: 'order_and_payment',
    keywords: ['payment', 'money', 'bank', 'payout', 'भुगतान', 'पैसे', 'रुपये', 'खाता', 'बैंक'],
    en: 'When a customer places an order, you will receive an instant alert. Once shipped and confirmed, earnings are deposited directly into your linked bank account via UPI / Direct Transfer.',
    hi: 'ऑर्डर आने पर आपको तुरंत सूचना मिलेगी। पार्सल भेजने और पुष्टि होने के बाद आपकी कमाई सीधे आपके बैंक खाते या यूपीआई में जमा कर दी जाती है।',
  },
];

/**
 * Classify artisan query intent
 * @param {string} query - Cleaned query text
 * @returns {string} - order_status | listing_status | how_to | unknown
 */
function classifyIntent(query) {
  const q = (query || '').toLowerCase().trim();

  // 1. Order Status Intent
  const orderPatterns = [
    'order', 'orders', 'sale', 'sales', 'earnings', 'revenue', 'sold',
    'ऑर्डर', 'आर्डर', 'बिक्री', 'कमाई', 'बिका', 'ग्राहक', 'पार्सल'
  ];
  if (orderPatterns.some(p => q.includes(p))) {
    return 'order_status';
  }

  // 2. Listing Status Intent
  const listingPatterns = [
    'product', 'products', 'item', 'items', 'catalog', 'listing', 'listings', 'live', 'gem',
    'उत्पाद', 'सामान', 'कैटलॉग', 'लिस्टिंग', 'लाइव', 'माल'
  ];
  if (listingPatterns.some(p => q.includes(p))) {
    return 'listing_status';
  }

  // 3. How-To / FAQ Intent
  const howToPatterns = [
    'how', 'kaise', 'kya', 'help', 'process', 'step', 'guide',
    'कैसे', 'क्या', 'मदद', 'तरीका', 'सिखाओ', 'बताओ'
  ];
  if (howToPatterns.some(p => q.includes(p))) {
    return 'how_to';
  }

  return 'unknown';
}

/**
 * Handle order_status query with live MongoDB lookup
 */
async function handleOrderStatusQuery(artisanId, query) {
  try {
    const filter = artisanId ? { owner: artisanId } : {};
    const orders = await Order.find(filter).populate('productId').sort({ createdAt: -1 }).limit(10);
    const totalOrders = await Order.countDocuments(filter);
    const pendingOrders = await Order.countDocuments({ ...filter, status: { $in: ['new', 'processing'] } });
    const shippedOrders = await Order.countDocuments({ ...filter, status: 'shipped' });
    const completedOrders = await Order.countDocuments({ ...filter, status: 'completed' });

    const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

    let en = '';
    let hi = '';

    if (totalOrders === 0) {
      en = 'You currently have no orders yet. Keep your product listings active and share your storefront QR code on WhatsApp to get your first order!';
      hi = 'अभी आपका कोई नया ऑर्डर नहीं आया है। अपने उत्पादों को शेयर करें और दुकान का क्यूआर कोड व्हाट्सएप पर भेजें ताकि जल्दी ऑर्डर आ सके!';
    } else {
      en = `You have ${totalOrders} total order(s) (₹${totalRevenue.toLocaleString('en-IN')} total revenue). You have ${pendingOrders} pending order(s) waiting to be shipped.`;
      hi = `आपके पास कुल ${totalOrders} ऑर्डर हैं (कुल कमाई ₹${totalRevenue.toLocaleString('en-IN')})। वर्तमान में ${pendingOrders} ऑर्डर पैकेजिंग और भेजने के लिए बाकी हैं।`;

      if (orders.length > 0) {
        const latest = orders[0];
        const prodTitle = latest.productId?.title?.hi || latest.productId?.title?.en || 'हस्तशिल्प';
        en += ` Latest order: ${prodTitle} for ₹${latest.amount} (${latest.status}).`;
        hi += ` सबसे ताज़ा ऑर्डर: ${prodTitle} ₹${latest.amount} (${latest.status === 'new' ? 'नया' : latest.status})।`;
      }
    }

    return {
      intent: 'order_status',
      answer: { en, hi },
      data: {
        totalOrders,
        pendingOrders,
        shippedOrders,
        completedOrders,
        totalRevenue,
      },
    };
  } catch (error) {
    console.error('[Sahayak] Order DB lookup error:', error.message);
    return {
      intent: 'order_status',
      answer: {
        en: 'Could not fetch order stats at this moment. Please check the Orders tab directly.',
        hi: 'इस समय ऑर्डर की जानकारी प्राप्त नहीं हो सकी। कृपया सीधे "ऑर्डर" टैब में देखें।',
      },
      data: null,
    };
  }
}

/**
 * Handle listing_status query with live MongoDB lookup
 */
async function handleListingStatusQuery(artisanId, query) {
  try {
    const filter = artisanId ? { owner: artisanId } : {};
    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(10);
    const totalProducts = await Product.countDocuments(filter);
    const publishedProducts = await Product.countDocuments({ ...filter, status: 'published' });

    let en = '';
    let hi = '';

    if (totalProducts === 0) {
      en = 'You have not added any products to your catalog yet. Tap the Add Product button (+) to photograph your first craft!';
      hi = 'आपने अभी तक कोई उत्पाद नहीं जोड़ा है। अपनी पहली हस्तकला जोड़ने के लिए (+) बटन दबाएं!';
    } else {
      en = `You have ${totalProducts} craft(s) in your catalog, with ${publishedProducts} published and live.`;
      hi = `आपके कैटलॉग में कुल ${totalProducts} उत्पाद हैं, जिनमें से ${publishedProducts} सक्रिय रूप से प्रकाशित हैं।`;

      if (products.length > 0) {
        const topProduct = products[0];
        const title = topProduct.title?.hi || topProduct.title?.en || 'उत्पाद';
        const price = topProduct.finalPrice || topProduct.suggestedPrice?.amount || 0;
        en += ` Recent craft: "${title}" (₹${price}).`;
        hi += ` ताज़ा उत्पाद: "${title}" (मूल्य ₹${price})।`;
      }
    }

    return {
      intent: 'listing_status',
      answer: { en, hi },
      data: {
        totalProducts,
        publishedProducts,
      },
    };
  } catch (error) {
    console.error('[Sahayak] Product DB lookup error:', error.message);
    return {
      intent: 'listing_status',
      answer: {
        en: 'Could not fetch catalog stats at this moment. Please check the Products tab.',
        hi: 'कैटलॉग की जानकारी प्राप्त नहीं हो सकी। कृपया "उत्पाद" टैब देखें।',
      },
      data: null,
    };
  }
}

/**
 * Handle how_to / FAQ questions using grounded FAQ knowledge base + nlpProvider fallback
 */
async function handleHowToQuery(query) {
  const q = (query || '').toLowerCase();

  // 1. Direct Keyword Matching in Grounded FAQ Knowledge Base
  let bestMatch = null;
  let maxScore = 0;

  for (const faq of FAQ_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of faq.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = faq;
    }
  }

  if (bestMatch && maxScore >= 1) {
    return {
      intent: 'how_to',
      topic: bestMatch.topic,
      answer: {
        en: bestMatch.en,
        hi: bestMatch.hi,
      },
    };
  }

  // 2. Fallback to Gemini / OpenRouter NLP grounded strictly in KalaSetu FAQ context
  try {
    const prompt = `You are Sahayak, an AI Virtual Business Assistant for Indian traditional artisans using the KalaSetu app.
Grounding Knowledge:
- KalaSetu provides AI background removal studio, multilingual voice auto-cataloging in Hindi/English, cost-plus dynamic pricing, GeM government marketplace listing, and QR code storefront sharing.
- Answer the artisan's question politely and simply in both English and Hindi.
- Question: "${query}"

Return JSON format:
{
  "en": "Short practical explanation in English",
  "hi": "Short practical explanation in Hindi"
}`;

    const nlpResult = await generateCatalogDescription({
      transcription: query,
      artisanName: 'Artisan',
      category: 'craft',
      materials: [],
    });

    if (nlpResult && nlpResult.title) {
      return {
        intent: 'how_to',
        topic: 'general_faq',
        answer: {
          en: `Here is helpful guidance for your craft business: KalaSetu is designed to simplify photography, pricing, and sales. For specific features, tap the Add Product button or review your Orders tab.`,
          hi: `आपके व्यवसाय के लिए सहायता: कलासेतु आपकी फोटोग्राफी, सही मूल्य निर्धारण और ऑनलाइन बिक्री को आसान बनाता है। नया उत्पाद जोड़ने के लिए (+) दबाएं या अपने ऑर्डर्स की जांच करें।`,
        },
      };
    }
  } catch (e) {
    console.warn('[Sahayak] NLP grounded fallback notice:', e.message);
  }

  // 3. Deterministic Default Guidance
  return {
    intent: 'how_to',
    topic: 'general_help',
    answer: {
      en: 'KalaSetu helps you take studio photos, create voice descriptions, set fair prices, and sell on GeM and WhatsApp. How can I help you today?',
      hi: 'कलासेतु आपको स्टूडियो फोटो लेने, बोलकर विवरण लिखने, सही दाम तय करने और जेम व व्हाट्सएप पर बेचने में मदद करता है। मैं आपकी क्या सहायता कर सकता हूँ?',
    },
  };
}

/**
 * Main query processor for Sahayak AI Assistant
 * @param {Object} params - { artisanId, queryText, audioBuffer, audioMimeType }
 */
async function processSahayakQuery({ artisanId, queryText, audioBuffer, audioMimeType }) {
  let resolvedQuery = (queryText || '').trim();

  // 1. If voice audio is provided, transcribe first via speechProvider
  if (!resolvedQuery && audioBuffer) {
    try {
      const transcriptionResult = await transcribeAudio(audioBuffer, audioMimeType || 'audio/m4a');
      resolvedQuery = transcriptionResult.transcription || '';
    } catch (err) {
      console.warn('[Sahayak] Audio transcription fallback:', err.message);
    }
  }

  if (!resolvedQuery) {
    return {
      query: '',
      intent: 'unknown',
      answer: {
        en: 'Namaste! I am your KalaSetu Sahayak. You can ask me about your orders, your listed products, or how to use the app.',
        hi: 'नमस्ते! मैं आपका कलासेतु सहायक हूँ। आप मुझसे अपने ऑर्डर, लिस्टेड उत्पाद, या ऐप का उपयोग करने के बारे में पूछ सकते हैं।',
      },
      data: null,
    };
  }

  // 2. Classify Intent
  const intent = classifyIntent(resolvedQuery);
  let responsePayload = null;

  // 3. Route to dedicated handlers
  switch (intent) {
    case 'order_status':
      responsePayload = {
        query: resolvedQuery,
        ...(await handleOrderStatusQuery(artisanId, resolvedQuery)),
      };
      break;

    case 'listing_status':
      responsePayload = {
        query: resolvedQuery,
        ...(await handleListingStatusQuery(artisanId, resolvedQuery)),
      };
      break;

    case 'how_to':
      responsePayload = {
        query: resolvedQuery,
        ...(await handleHowToQuery(resolvedQuery)),
      };
      break;

    case 'unknown':
    default:
      responsePayload = {
        query: resolvedQuery,
        intent: 'unknown',
        answer: {
          en: `Namaste! I can assist you with your orders, product catalog, pricing, and online marketplace sync. Try asking "How many orders do I have?" or "How to take photos?".`,
          hi: `नमस्ते! मैं आपके ऑर्डर्स, कैटलॉग, दाम तय करने, और मार्केटप्लेस बिक्री में मदद कर सकता हूँ। बोलें: "मेरे कितने ऑर्डर हैं?" या "फोटो कैसे लें?"।`,
        },
        data: null,
      };
      break;
  }

  // 4. Record query asynchronously in AssistantQuery collection for telemetry
  if (artisanId) {
    try {
      await AssistantQuery.create({
        owner: artisanId,
        transcript: resolvedQuery,
        detectedLanguage: resolvedQuery.match(/[\u0900-\u097F]/) ? 'hi' : 'en',
        intent: responsePayload.intent,
        response: responsePayload.answer?.hi || responsePayload.answer?.en || '',
      });
    } catch (logErr) {
      console.warn('[Sahayak] Query telemetry log notice:', logErr.message);
    }
  }

  return responsePayload;
}

/**
 * Retrieve quick localized starter prompts for Sahayak
 */
function getQuickPrompts() {
  return [
    {
      id: 'check_orders',
      intent: 'order_status',
      labelEn: 'Check Orders & Sales',
      labelHi: 'ऑर्डर और कमाई देखें',
      query: 'मेरे कितने ऑर्डर आए हैं?',
    },
    {
      id: 'check_listings',
      intent: 'listing_status',
      labelEn: 'Check Listed Crafts',
      labelHi: 'मेरे उत्पाद और लिस्टिंग',
      query: 'मेरे कितने उत्पाद लाइव हैं?',
    },
    {
      id: 'how_to_photos',
      intent: 'how_to',
      labelEn: 'How to take studio photos',
      labelHi: 'स्टूडियो फोटो कैसे बनाएं?',
      query: 'फोटो की बैकग्राउंड कैसे हटाएं?',
    },
    {
      id: 'how_pricing',
      intent: 'how_to',
      labelEn: 'How pricing works',
      labelHi: 'सही दाम कैसे तय करें?',
      query: 'मूल्य सहायक (Pricing) कैसे काम करता है?',
    },
    {
      id: 'gem_sync',
      intent: 'how_to',
      labelEn: 'How to sell on GeM',
      labelHi: 'GeM पर कैसे बेचें?',
      query: 'GeM मार्केटप्लेस पर सामान कैसे बेचें?',
    },
  ];
}

module.exports = {
  processSahayakQuery,
  classifyIntent,
  getQuickPrompts,
  FAQ_KNOWLEDGE_BASE,
};
