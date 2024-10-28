const { isValidObjectId } = require("mongoose");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Product = require("../models/Product");
const { errorHandler } = require("../auth");

module.exports.getCart = async (req, res) => {
    let fName = `[getCart]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { id, isAdmin } = req.user;
        dataString = `id:${id} | isAdmin:${isAdmin} `;
        // Input validation
        if (isAdmin) {
            console.log(`${fName}[403]|| Admin is forbidden | ${dataString}||${fName}`);
            return res.status(403).send({ error: "Admin is forbidden" });
        }
        // let existingUser = await User.findById(id, "-password");
        // if (!existingUser) {
        //     console.log(`getCart: 404 User not found`);
        //     return res.status(404).send({ error: "User not found" });
        // }
        let existingCarts = await Cart.find({ userId: id });
        if (existingCarts.length < 1) {
            console.log(`${fName}[200]|| Cart not found | ${dataString}||${fName}`);
            return res.status(200).send({ message: "Cart not found" });
        }
        // Input processing: Retrieving Cart
        console.log(`${fName}[200]|| Cart Found | cart:${JSON.stringify(existingCarts[0])} | ${dataString}||${fName}`);
        return res.status(200).send({ cart: existingCarts[0] });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.addToCart = async (req, res) => {
    let fName = `[addToCart]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { id, isAdmin } = req.user;
        const { productId, quantity } = req.body;
        let { subtotal } = req.body;
        dataString = `id:${id} | isAdmin:${isAdmin} | productId:${productId} | quantity:${quantity} | subtotal:${subtotal} `;
        // Input validation
        if (isAdmin) {
            console.log(`${fName}[403]|| Admin is forbidden | ${dataString}||${fName}`);
            return res.status(403).send({ error: "Admin is forbidden" });
        }
        // else if (!isValidObjectId(productId)) {
        //     console.log(`addToCart: 400 Invalid Product ID`);
        //     return res.status(400).send({ error: "Invalid Product ID" });
        // }
        // let existingUser = await User.findById(id, "-password");
        let existingProduct = await Product.findById(productId);
        // if (!existingUser) {
        //     console.log(`addToCart: 404 User not found`);
        //     return res.status(404).send({ error: "User not found" });
        // } else
        // if (!existingProduct) {
        //     console.log(`addToCart: 404 Product not found`);
        //     return res.status(404).send({ error: "Product not found" });
        // } else
        if (typeof productId === "undefined" || typeof quantity === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
            // } else if (!existingProduct.isActive) {
            //     console.log(`addToCart: 400 Product is currently unavailable`);
            //     return res.status(400).send({ error: "Product is currently unavailable" });
        } else if (!Number.isInteger(quantity)) {
            console.log(`${fName}[400]|| Invalid quantity | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid quantity" });
        }
        // Input processing: Adding item to the cart
        if (typeof subtotal !== "number") {
            subtotal = existingProduct.price * quantity;
        }
        let existingCarts = await Cart.find({ userId: id });
        let existingCart = existingCarts[0];
        let statuscode = 200;
        if (existingCarts.length < 1) {
            existingCart = new Cart({
                userId: id,
                cartItems: [],
                totalPrice: 0,
            });
            statuscode = 201;
        }
        let index = existingCart.cartItems.findIndex((product) => product.productId === productId);
        if (index > -1) {
            existingCart.cartItems[index] = { productId: productId, quantity: quantity, subtotal: subtotal };
        } else {
            existingCart.cartItems.unshift({ productId: productId, quantity: quantity, subtotal: subtotal });
        }
        existingCart.totalPrice = 0;
        for (let i = 0; i < existingCart.cartItems.length; i++) {
            existingCart.totalPrice += existingCart.cartItems[i].subtotal;
        }
        return existingCart
            .save()
            .then((savedCart) => {
                console.log(`${fName}[${statuscode}]|| Item added to cart successfully | cart:${JSON.stringify(savedCart)} | ${dataString}||${fName}`);
                res.status(statuscode).send({ message: "Item added to cart successfully", cart: savedCart });
            })
            .catch((error) => {
                console.log(`${fName}[500]|| Passed to Error Handler | ${dataString}||${fName}`);
                errorHandler(error, req, res);
            });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.updateCartQuantity = async (req, res) => {
    let fName = `[updateCartQuantity]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { id, isAdmin } = req.user;
        const { productId, quantity } = req.body;
        let { subtotal } = req.body;
        dataString = `id:${id} | isAdmin:${isAdmin} | productId:${productId} | quantity:${quantity} | subtotal:${subtotal} `;
        // Input validation
        if (isAdmin) {
            console.log(`${fName}[403]|| Admin is forbidden | ${dataString}||${fName}`);
            return res.status(403).send({ error: "Admin is forbidden" });
        }
        // else if (!isValidObjectId(productId)) {
        //     console.log(`updateCartQuantity: 400 Invalid Product ID`);
        //     return res.status(400).send({ error: "Invalid Product ID" });
        // }
        // let existingUser = await User.findById(id, "-password");
        let existingProduct = await Product.findById(productId);
        // if (!existingUser) {
        //     console.log(`updateCartQuantity: 404 User not found`);
        //     return res.status(404).send({ error: "User not found" });
        // } else
        // if (!existingProduct) {
        //     console.log(`updateCartQuantity: 404 Product not found`);
        //     return res.status(404).send({ error: "Product not found" });
        // } else
        if (typeof productId === "undefined" || typeof quantity === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        }
        // else if (!existingProduct.isActive) {
        //     console.log(`updateCartQuantity: 400 Product is currently unavailable`);
        //     return res.status(400).send({ error: "Product is currently unavailable" });
        // } else if (!Number.isInteger(quantity)) {
        //     console.log(`updateCartQuantity: 400 Invalid quantity`);
        //     return res.status(400).send({ error: "Invalid quantity" });
        // }
        let existingCarts = await Cart.find({ userId: id });
        let existingCart = existingCarts[0];
        if (existingCarts.length < 1) {
            console.log(`${fName}[404]|| Cart not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Cart not found" });
        }
        let index = existingCart.cartItems.findIndex((product) => product.productId === productId);
        // Input processing: Updating product quantity
        if (typeof subtotal !== "number") {
            subtotal = existingProduct.price * quantity;
        }
        if (index < 0) {
            // console.log(`updateCartQuantity: 404 Item not found in cart`);
            // return res.status(404).send({ message: "Item not found in cart" });
            existingCart.cartItems.unshift({ productId: productId, quantity: quantity, subtotal: subtotal });
        } else {
            existingCart.cartItems[index] = { productId: productId, quantity: quantity, subtotal: subtotal };
        }
        existingCart.totalPrice = 0;
        for (let i = 0; i < existingCart.cartItems.length; i++) {
            existingCart.totalPrice += existingCart.cartItems[i].subtotal;
        }
        return existingCart
            .save()
            .then((savedCart) => {
                console.log(`${fName}[200]|| Item quantity updated successfully | updatedCart:${JSON.stringify(savedCart)} | ${dataString}||${fName}`);
                res.status(200).send({ message: "Item quantity updated successfully", updatedCart: savedCart });
            })
            .catch((error) => {
                console.log(`${fName}[500]|| Passed to Error Handler | ${dataString}||${fName}`);
                errorHandler(error, req, res);
            });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.removeFromCart = async (req, res) => {
    let fName = `[removeFromCart]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { id, isAdmin } = req.user;
        const { productId } = req.params;
        dataString = `id:${id} | isAdmin:${isAdmin} | productId:${productId} `;
        // Input validation
        if (isAdmin) {
            console.log(`${fName}[403]|| Admin is forbidden | ${dataString}||${fName}`);
            return res.status(403).send({ error: "Admin is forbidden" });
        }
        let existingCarts = await Cart.find({ userId: id });
        let existingCart = existingCarts[0];
        if (existingCarts.length < 1) {
            console.log(`${fName}[404]|| Cart not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Cart not found" });
        }
        let index = existingCart.cartItems.findIndex((product) => product.productId === productId);
        if (index < 0) {
            console.log(`${fName}[200]|| Item not found in cart | ${dataString}||${fName}`);
            return res.status(200).send({ message: "Item not found in cart", updatedCart: existingCart });
        }
        // Input processing: Removing product from Cart
        existingCart.cartItems.splice(index, 1);
        existingCart.totalPrice = 0;
        for (let i = 0; i < existingCart.cartItems.length; i++) {
            existingCart.totalPrice += existingCart.cartItems[i].subtotal;
        }
        return existingCart
            .save()
            .then((savedCart) => {
                console.log(`${fName}[200]|| Item removed from cart successfully | updatedCart:${JSON.stringify(savedCart)} | ${dataString}||${fName}`);
                res.status(200).send({ message: "Item removed from cart successfully", updatedCart: savedCart });
            })
            .catch((error) => {
                console.log(`${fName}[500]|| Passed to Error Handler | ${dataString}||${fName}`);
                errorHandler(error, req, res);
            });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.clearCart = async (req, res) => {
    let fName = `[clearCart]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { id, isAdmin } = req.user;
        dataString = `id:${id} | isAdmin:${isAdmin} `;
        // Input validation
        if (isAdmin) {
            console.log(`${fName}[403]|| Admin is forbidden | ${dataString}||${fName}`);
            return res.status(403).send({ error: "Admin is forbidden" });
        }
        let existingCarts = await Cart.find({ userId: id });
        let existingCart = existingCarts[0];
        if (existingCarts.length < 1) {
            console.log(`${fName}[404]|| Cart not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Cart not found" });
        }
        if (existingCart.cartItems.length < 1) {
            console.log(`${fName}[200]|| Cart is already empty | cart:${JSON.stringify(existingCart)} | ${dataString}||${fName}`);
            return res.status(200).send({ message: "Cart is already empty", cart: existingCart });
        }
        // Input processing: Clearing Cart contents
        existingCart.cartItems = [];
        existingCart.totalPrice = 0;
        return existingCart
            .save()
            .then((savedCart) => {
                console.log(`${fName}[200]|| Cart cleared successfully | cart:${JSON.stringify(savedCart)} | ${dataString}||${fName}`);
                res.status(200).send({ message: "Cart cleared successfully", cart: savedCart });
            })
            .catch((error) => {
                console.log(`${fName}[500]|| Passed to Error Handler | ${dataString}||${fName}`);
                errorHandler(error, req, res);
            });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};
