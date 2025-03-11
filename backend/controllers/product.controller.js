import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}); // Fetch all products from the database
    res.json(products);
  } catch (error) {
    console.log("Error in getAllProducts controller", error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featured_products"); // Fetch featured products from Redis cache
    if (featuredProducts) {
      return res.json(JSON.parse(featuredProducts));
    }

    // if not in  redis, fetch from mongodb
    // .lean() is used to get plain javascript objects instead of mongoDB documents
    featuredProducts = await Product.find({ isFeatured: true }).lean();
    if (!featuredProducts) {
      return res.status(404).json({ message: "Featured products not found" });

    }

    // Store in redis for future quick access
    await Redis.set("fetaured_products", JSON.stringify(featuredProducts));
    res.json(featuredProducts);
  } catch (error) {
    console.log("Error in getFeaturedProducts controller", error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;

    let cloudinaryResponse = null;

    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: 'products'});
    }

    const product = new Product.create({
      name,
      description,
      price,
      image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : '',
      category,
    })
    
  } catch (error) {
    console.log("Error in createProduct controller", error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};