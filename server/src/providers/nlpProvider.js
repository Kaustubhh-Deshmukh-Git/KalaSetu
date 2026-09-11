/**
 * NLP Provider Interface
 * Wraps translation and SEO catalog description generation behind a common interface
 * with an explicit 3-tier fallback chain:
 * Tier 1: Google Gemini (Multimodal / Text)
 * Tier 2: OpenRouter (Multilingual open-weight model)
 * Tier 3: Deterministic Template-based Description Engine
 */

const TIMEOUT_NLP_MS = 15000;

const withTimeout = (promise, ms, tierName) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`[NLPProvider] ${tierName} timed out after ${ms}ms`);
      error.code = 'PROVIDER_TIMEOUT';
      reject(error);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

const CATEGORY_MAP_HI = {
  handloom: 'हथकरघा व वस्त्र',
  pottery: 'मिट्टी के बर्तन व मूर्तियां',
  woodcraft: 'काष्ठ शिल्प व नक्काशी',
  metalcraft: 'पीतल व धातु शिल्प',
  jewelry: 'हस्तनिर्मित आभूषण',
  painting: 'लोक चित्रकला व कला',
  leather: 'चमड़ा शिल्प',
  bamboo: 'बांस व बेंत शिल्प',
};

/**
 * Tier 1: Google Gemini
 */
const tryTier1Gemini = async ({ transcript, category, materials, rawMaterialCost }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('[Tier 1: Gemini] Missing GEMINI_API_KEY');
  }

  const cleanTranscript = (transcript || '').trim();
  const effectiveDetails = cleanTranscript
    ? `Artisan Voice Transcript: "${cleanTranscript}"`
    : `(Artisan provided silent/visual craft details for this listing)`;

  console.log('[NLPProvider] Attempting Tier 1: Google Gemini API...');

  const geminiAction = async () => {
    const prompt = `You are an expert e-commerce cataloger for Indian artisans and weavers.
Based on the following product details, generate an authentic, attractive, SEO-friendly e-commerce product title and cultural description in BOTH English and Hindi.

${effectiveDetails}
Category: "${category || 'Handicraft'}"
Materials: "${Array.isArray(materials) ? materials.join(', ') : materials || 'Traditional materials'}"
Raw Cost: ${rawMaterialCost || 'Not specified'}

Respond ONLY with valid JSON matching this exact structure:
{
  "title": {
    "en": "Short catchy English title (max 70 chars)",
    "hi": "Short catchy Hindi title (max 70 chars)"
  },
  "description": {
    "en": "2-3 paragraphs highlighting artisan technique, genuine materials, and cultural value in English",
    "hi": "2-3 paragraphs highlighting artisan technique, genuine materials, and cultural value in Hindi"
  },
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

    const candidateModels = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-pro-latest'].filter(Boolean);
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJsonText) {
            const parsed = JSON.parse(rawJsonText);
            return {
              title: parsed.title,
              description: parsed.description,
              tags: parsed.tags || [],
              provider: `google_gemini (${modelName})`,
              tier: 1,
            };
          }
        } else {
          const errText = await response.text();
          lastError = new Error(`Gemini (${modelName}) returned ${response.status}: ${errText}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw (lastError || new Error('All Gemini model attempts failed'));
  };

  return await withTimeout(geminiAction(), TIMEOUT_NLP_MS, 'Tier 1 (Gemini)');
};

/**
 * Tier 2: OpenRouter API
 */
const tryTier2OpenRouter = async ({ transcript, category, materials }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('[Tier 2: OpenRouter] Missing OPENROUTER_API_KEY');
  }

  const cleanTranscript = (transcript || '').trim();
  const effectiveDetails = cleanTranscript
    ? `Transcript: "${cleanTranscript}"`
    : `(Artisan craft description based on materials and category)`;

  console.log('[NLPProvider] Attempting Tier 2: OpenRouter API...');

  const openRouterAction = async () => {
    const prompt = `Generate a JSON e-commerce title and description in English and Hindi for this artisan craft:
${effectiveDetails}
Category: ${category || 'Handicraft'}
Materials: ${Array.isArray(materials) ? materials.join(', ') : materials || 'Authentic materials'}

Respond ONLY with valid JSON:
{
  "title": { "en": "...", "hi": "..." },
  "description": { "en": "...", "hi": "..." },
  "tags": ["..."]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse JSON from OpenRouter output');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags || [],
      provider: 'openrouter',
      tier: 2,
    };
  };

  return await withTimeout(openRouterAction(), TIMEOUT_NLP_MS, 'Tier 2 (OpenRouter)');
};

/**
 * Tier 3: Deterministic Template-based Description Engine
 */
const tryTier3DeterministicTemplate = async ({ transcript, category, materials }) => {
  console.log('[NLPProvider] Executing Tier 3: Deterministic Template Engine...');

  const catEn = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Handcrafted Item';
  const catHi = CATEGORY_MAP_HI[category?.toLowerCase()] || 'हस्तशिल्प उत्पाद';

  const matListEn = Array.isArray(materials) && materials.length > 0
    ? materials.join(' and ')
    : (materials || 'natural authentic raw materials');

  const matListHi = Array.isArray(materials) && materials.length > 0
    ? materials.join(' और ')
    : (materials || 'शुद्ध व प्राकृतिक सामग्री');

  const titleEn = `Authentic Handcrafted ${catEn}`;
  const titleHi = `प्रामाणिक हस्तनिर्मित ${catHi}`;

  const descriptionEn = `Expertly handcrafted by skilled traditional artisans using genuine ${matListEn}. Each piece is individually created with meticulous care and dedication, reflecting centuries-old Indian heritage techniques. Perfect for personal use, gifting, and home aesthetics.`;

  const descriptionHi = `पारंपरिक भारतीय कारीगरों द्वारा शुद्ध ${matListHi} और प्राचीन कला विधि से तैयार किया गया यह सुंदर ${catHi} शिल्प और सांस्कृतिक विरासत का अनूठा उदाहरण है। यह टिकाऊ, आकर्षक और हर अवसर के लिए उत्तम है।`;

  const tags = [
    'handcrafted',
    'traditional',
    'artisan',
    category || 'craft',
    ...(Array.isArray(materials) ? materials : [materials]).filter(Boolean),
  ];

  return {
    title: {
      en: titleEn,
      hi: titleHi,
    },
    description: {
      en: descriptionEn,
      hi: descriptionHi,
    },
    tags,
    provider: 'deterministic_template_engine',
    tier: 3,
  };
};

/**
 * Main NLP Provider Entry Point
 */
const generateCatalogListing = async ({ transcript, category, materials, rawMaterialCost }) => {
  // 1. Try Tier 1: Gemini
  try {
    return await tryTier1Gemini({ transcript, category, materials, rawMaterialCost });
  } catch (err1) {
    console.warn(`[NLPProvider Fallback] Tier 1 (Gemini) failed: ${err1.message}`);
  }

  // 2. Try Tier 2: OpenRouter
  try {
    return await tryTier2OpenRouter({ transcript, category, materials });
  } catch (err2) {
    console.warn(`[NLPProvider Fallback] Tier 2 (OpenRouter) failed: ${err2.message}`);
  }

  // 3. Try Tier 3: Deterministic Template Engine
  return await tryTier3DeterministicTemplate({ transcript, category, materials });
};

module.exports = {
  generateCatalogListing,
  tryTier1Gemini,
  tryTier2OpenRouter,
  tryTier3DeterministicTemplate,
};
