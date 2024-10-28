const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const { errorHandler } = require("../auth");

module.exports.checkout = async (req, res) => {
    let fName = `[checkout]`;
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
            console.log(`${fName}[400]|| No Items to Checkout | ${dataString}||${fName}`);
            return res.status(400).send({ error: "No Items to Checkout" });
        }
        // Input processing: New Product Creation
        const { cartItems, totalPrice } = existingCart;
        let newOrder = new Order({
            userId: id,
            productsOrdered: cartItems,
            totalPrice: totalPrice,
        });
        await existingCart.deleteOne();
        return newOrder
            .save()
            .then((savedOrder) => {
                console.log(`${fName}[200]|| Ordered Successfully | savedOrder:${JSON.stringify(savedOrder)} | ${dataString}||${fName}`);
                res.status(200).send({ message: "Ordered Successfully", order: savedOrder });
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

module.exports.getMyOrders = async (req, res) => {
    let fName = `[getMyOrders]`;
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
        let existingOrders = await Order.find({ userId: id });
        // if (existingOrders.length < 1) {
        //     console.log(`getMyOrders: 404 No orders found`);
        //     return res.status(404).send({ error: "No orders found" });
        // }
        // Input processing: New Product Creation
        console.log(`${fName}[200]|| orders:${JSON.stringify(existingOrders)} | ${dataString}||${fName}`);
        return res.status(200).send({ orders: existingOrders });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.getAllOrders = async (req, res) => {
    let fName = `[getAllOrders]`;
    try {
        // Input validation
        let existingOrders = await Order.find({});
        if (existingOrders.length < 1) {
            console.log(`${fName}[404]|| No orders found ||${fName}`);
            return res.status(404).send({ error: "No orders found" });
        }
        // Input processing: New Product Creation
        console.log(`${fName}[200]|| orders:${JSON.stringify(existingOrders)}||${fName}`);
        return res.status(200).send({ orders: existingOrders });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler ||${fName}`);
        errorHandler(error, req, res);
    }
};
