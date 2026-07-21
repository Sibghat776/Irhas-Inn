import Users from "../Models/Users.js";
import { Product } from "../Models/Product.js";
import { createError, createSuccess } from "../utils/commonFunctions.js";

const populateUserCart = async (user) => {
  await user.populate(
    "cart.product",
    "name price stock description images slug brand category colors sizes",
  );
  return user.cart;
};

export const getCart = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next(createError(401, "You are not authenticated"));
    }

    const user = await Users.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));

    const cart = await populateUserCart(user);
    return res.status(200).json(createSuccess(200, "Cart fetched successfully", cart));
  } catch (error) {
    next(error);
  }
};

export const addOrUpdateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return next(createError(400, "Product ID is required"));
    if (quantity < 0) return next(createError(400, "Quantity must be greater than or equal to 0"));

    const product = await Product.findById(productId);
    if (!product) return next(createError(404, "Product not found"));

    const user = await Users.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));

    const existingItem = user.cart.find((item) => item.product.toString() === productId);

    // Compute new desired quantity and clamp to available stock
    const desiredQuantity = existingItem ? existingItem.quantity + quantity : quantity;
    if (desiredQuantity <= 0) {
      // remove item
      user.cart = user.cart.filter((item) => item.product.toString() !== productId);
    } else {
      if (product.stock <= 0) {
        return next(createError(400, "Product is out of stock"));
      }

      const finalQuantity = Math.min(desiredQuantity, product.stock);

      if (existingItem) {
        existingItem.quantity = finalQuantity;
      } else {
        user.cart.push({ product: productId, quantity: finalQuantity });
      }
    }

    await user.save();
    const cart = await populateUserCart(user);
    return res.status(200).json(createSuccess(200, "Cart updated successfully", cart));
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId) return next(createError(400, "Product ID is required"));
    if (quantity === undefined || quantity < 0) return next(createError(400, "Valid quantity is required"));

    const user = await Users.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));

    const existingItem = user.cart.find((item) => item.product.toString() === productId);
    if (!existingItem) return next(createError(404, "Cart item not found"));

    const product = await Product.findById(productId);
    if (!product) return next(createError(404, "Product not found"));

    if (quantity === 0) {
      user.cart = user.cart.filter((item) => item.product.toString() !== productId);
    } else {
      if (quantity > product.stock) {
        return next(createError(400, `Only ${product.stock} items available in stock`));
      }
      existingItem.quantity = quantity;
    }

    await user.save();
    const cart = await populateUserCart(user);
    return res.status(200).json(createSuccess(200, "Cart item updated successfully", cart));
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!productId) return next(createError(400, "Product ID is required"));

    const user = await Users.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));

    user.cart = user.cart.filter((item) => item.product.toString() !== productId);
    await user.save();

    const cart = await populateUserCart(user);
    return res.status(200).json(createSuccess(200, "Cart item removed successfully", cart));
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const user = await Users.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));

    user.cart = [];
    await user.save();

    return res.status(200).json(createSuccess(200, "Cart cleared successfully", []));
  } catch (error) {
    next(error);
  }
};

export const syncCart = async (req, res, next) => {
  try {
    const { cartItems } = req.body;
    if (!Array.isArray(cartItems)) {
      return next(createError(400, "Cart items must be an array"));
    }

    const user = await Users.findById(req.user.id);
    if (!user) return next(createError(404, "User not found"));

    const normalized = [];
    for (const item of cartItems) {
      if (!item.productId || !item.quantity || item.quantity < 1) continue;
      const product = await Product.findById(item.productId);
      if (!product || product.stock <= 0) continue;
      const qty = Math.min(item.quantity, product.stock);
      normalized.push({ product: item.productId, quantity: qty });
    }

    user.cart = normalized;
    await user.save();
    const cart = await populateUserCart(user);

    return res.status(200).json(createSuccess(200, "Cart synchronized successfully", cart));
  } catch (error) {
    next(error);
  }
};
