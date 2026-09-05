const Product = require('../models/Product');
const { uploadImage } = require('../config/cloudinary');

/**
 * Get all products for the authenticated user
 */
const getUserProducts = async (userId, { status, limit = 50, skip = 0 } = {}) => {
  const query = { owner: userId };

  if (status && ['draft', 'published', 'archived'].includes(status)) {
    query.status = status;
  }

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort({ updatedAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(parseInt(limit, 10)),
    Product.countDocuments(query),
  ]);

  return {
    products,
    total,
  };
};

/**
 * Create a new draft product
 */
const createProduct = async (userId, data = {}) => {
  const {
    title,
    description,
    category,
    materials,
    rawMaterialCost,
    stockCount,
    tags,
    status = 'draft',
    finalPrice,
  } = data;

  const product = new Product({
    owner: userId,
    title: {
      en: title?.en || '',
      hi: title?.hi || (typeof title === 'string' ? title : ''),
    },
    description: {
      en: description?.en || '',
      hi: description?.hi || (typeof description === 'string' ? description : ''),
    },
    category: category || '',
    materials: Array.isArray(materials) ? materials : (materials ? [materials] : []),
    rawMaterialCost: Number(rawMaterialCost) || 0,
    stockCount: stockCount !== undefined ? Number(stockCount) : 1,
    tags: Array.isArray(tags) ? tags : [],
    status: ['draft', 'published', 'archived'].includes(status) ? status : 'draft',
    finalPrice: finalPrice !== undefined ? Number(finalPrice) : null,
    images: [],
  });

  await product.save();
  return product;
};

/**
 * Get product detail by ID (ensuring artisan ownership)
 */
const getProductById = async (userId, productId) => {
  const product = await Product.findOne({ _id: productId, owner: userId });

  if (!product) {
    const error = new Error('Product not found or access denied');
    error.statusCode = 404;
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  return product;
};

/**
 * Update product fields
 */
const updateProduct = async (userId, productId, updateData) => {
  const product = await getProductById(userId, productId);

  const allowedFields = [
    'title',
    'description',
    'category',
    'materials',
    'rawMaterialCost',
    'finalPrice',
    'stockCount',
    'tags',
    'status',
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'title' || field === 'description') {
        if (typeof updateData[field] === 'object') {
          product[field] = {
            en: updateData[field].en !== undefined ? updateData[field].en : product[field]?.en,
            hi: updateData[field].hi !== undefined ? updateData[field].hi : product[field]?.hi,
          };
        } else if (typeof updateData[field] === 'string') {
          product[field].hi = updateData[field];
        }
      } else {
        product[field] = updateData[field];
      }
    }
  }

  await product.save();
  return product;
};

/**
 * Delete product by ID
 */
const deleteProduct = async (userId, productId) => {
  const product = await getProductById(userId, productId);
  await Product.deleteOne({ _id: product._id });
  return { success: true, message: 'Product removed successfully' };
};

/**
 * Upload and attach raw photos to product
 */
const uploadProductImages = async (userId, productId, files) => {
  if (!files || files.length === 0) {
    const error = new Error('No image files provided for upload');
    error.statusCode = 400;
    error.code = 'NO_FILES_PROVIDED';
    throw error;
  }

  const product = await getProductById(userId, productId);

  if (product.images.length + files.length > 5) {
    const error = new Error(`Cannot exceed maximum of 5 photos per product. Currently has ${product.images.length} photos.`);
    error.statusCode = 400;
    error.code = 'MAX_PHOTOS_EXCEEDED';
    throw error;
  }

  const uploadedImages = [];

  for (const file of files) {
    const uploaded = await uploadImage(file.buffer, file.originalname, `kalasetu/products/${productId}`);
    const imageDoc = {
      originalUrl: uploaded.url,
      enhancedUrl: null,
      isEnhanced: false,
      enhancementStatus: 'pending',
      createdAt: new Date(),
    };
    product.images.push(imageDoc);
    uploadedImages.push(imageDoc);
  }

  await product.save();

  return {
    success: true,
    uploadedCount: files.length,
    images: product.images,
    product,
  };
};

module.exports = {
  getUserProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImages,
};
