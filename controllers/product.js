const { isValidObjectId } = require("mongoose");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
const Product = require("../models/Product");
const { errorHandler } = require("../auth");

module.exports.createProduct = async (req, res) => {
    let fName = `[createProduct]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { name, description, price, altDescription, imageLink } = req.body;
        dataString = `name:${name} | description:${description} | price:${price} | altDescription:${altDescription} | imageLink:${imageLink} `;
        // Input validation
        if (typeof name === "undefined" || typeof description === "undefined" || typeof price === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        } else if (typeof price !== "number") {
            console.log(`${fName}[400]|| Invalid price value | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid price value" });
        }
        let productsWithSameName = await Product.find({ name: name });
        if (productsWithSameName.length > 0) {
            console.log(`${fName}[409]|| Product with the same name already exists | ${dataString}||${fName}`);
            return res.status(409).send({ error: "Product with the same name already exists" });
        }
        // Input processing: New Product Creation
        let newProduct = new Product({
            name: name,
            description: description,
            price: price,
            altDescription: altDescription,
            imageLink: imageLink,
        });
        return newProduct
            .save()
            .then((result) => {
                console.log(`${fName}[201]|| result:${JSON.stringify(result)} | ${dataString}||${fName}`);
                res.status(201).send(result);
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

module.exports.getAllProducts = async (req, res) => {
    let fName = `[getAllProducts]`;
    try {
        // Input validation
        let products = await Product.find({});
        if (products.length < 1) {
            console.log(`${fName}[404]|| No Products Found ||${fName}`);
            return res.status(404).send({ error: "No Products Found" });
        }
        // Input processing: Retrieving all products
        console.log(`${fName}[200]|| products:${JSON.stringify(products)} ||${fName}`);
        return res.status(200).send(products);
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler ||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.getAllActiveProducts = async (req, res) => {
    let fName = `[getAllActiveProducts]`;
    try {
        // Input validation
        let products = await Product.find({ isActive: true });
        if (products.length < 1) {
            console.log(`${fName}[404]|| No Active Products Found ||${fName}`);
            return res.status(404).send({ error: "No Active Products Found" });
        }
        // Input processing: Retrieving all active products
        console.log(`${fName}[200]|| products:${JSON.stringify(products)} ||${fName}`);
        return res.status(200).send(products);
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler ||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.getProduct = async (req, res) => {
    let fName = `[getProduct]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { productId } = req.params;
        dataString = `productId:${productId} `;
        // Input validation
        if (!isValidObjectId(productId)) {
            console.log(`${fName}[404]|| Invalid ID | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Invalid ID" });
        }
        let product = await Product.findById(productId);
        if (!product) {
            console.log(`${fName}[404]|| Product Not Found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Product Not Found" });
        }
        // Input processing: Retrieving product by ID
        console.log(`${fName}[200]|| product:${JSON.stringify(product)} | ${dataString}||${fName}`);
        return res.status(200).send(product);
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.updateProduct = async (req, res) => {
    let fName = `[updateProduct]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { productId } = req.params;
        const { name, description, price, altDescription, imageLink } = req.body;
        dataString = `productId:${productId} | name:${name} | description:${description} | price:${price} | altDescription:${altDescription} | imageLink:${imageLink} `;
        // Input validation
        if (!isValidObjectId(productId)) {
            console.log(`${fName}[404]|| Invalid ID | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid ID" });
        }
        let existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            console.log(`${fName}[404]|| Product not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Product not found" });
        } else if (typeof name === "undefined" && typeof description === "undefined" && typeof price === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        } else if (typeof price !== "number") {
            console.log(`${fName}[400]|| Invalid price value | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid price value" });
        }
        let productsWithSameName = await Product.find({ name: name, _id: { $ne: productId } });
        if (productsWithSameName.length > 0) {
            console.log(`${fName}[409]|| Product with the same name already exists | ${dataString}||${fName}`);
            return res.status(409).send({ error: "Product with the same name already exists" });
        }
        // Input processing: Updating the product
        existingProduct.name = name || existingProduct.name;
        existingProduct.description = description || existingProduct.description;
        existingProduct.price = price || existingProduct.price;
        existingProduct.altDescription = altDescription || existingProduct.altDescription;
        existingProduct.imageLink = imageLink || existingProduct.imageLink;
        return existingProduct
            .save()
            .then((result) => {
                console.log(`${fName}[200]|| Product updated successfully | ${dataString}||${fName}`);
                res.status(200).send({ success: true, message: "Product updated successfully" });
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

module.exports.archiveProduct = async (req, res) => {
    let fName = `[archiveProduct]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { productId } = req.params;
        dataString = `productId:${productId} `;
        // Input validation
        if (!isValidObjectId(productId)) {
            console.log(`${fName}[400]|| Invalid ID | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid ID" });
        }
        let existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            console.log(`${fName}[404]|| Product not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Product not found" });
        } else if (!existingProduct.isActive) {
            console.log(`${fName}[200]|| Product already archived | archiveProduct:${JSON.stringify(existingProduct)} | ${dataString}||${fName}`);
            return res.status(200).send({ message: "Product already archived", archiveProduct: existingProduct });
        }
        existingProduct.isActive = false;
        return existingProduct
            .save()
            .then((result) => {
                console.log(`${fName}[200]|| Product archived successfully | ${dataString}||${fName}`);
                res.status(200).send({ success: true, message: "Product archived successfully" });
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

module.exports.activateProduct = async (req, res) => {
    let fName = `[activateProduct]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { productId } = req.params;
        dataString = `productId:${productId} `;
        // Input validation
        if (!isValidObjectId(productId)) {
            console.log(`${fName}[400]|| Invalid ID | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid ID" });
        }
        let existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            console.log(`${fName}[404]|| Product not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Product not found" });
        } else if (existingProduct.isActive) {
            console.log(`${fName}[200]|| Product already active | activateProduct:${JSON.stringify(existingProduct)} | ${dataString}||${fName}`);
            return res.status(200).send({ message: "Product already active", activateProduct: existingProduct });
        }
        existingProduct.isActive = true;
        return existingProduct
            .save()
            .then((result) => {
                console.log(`${fName}[200]|| Product activated successfully | ${dataString}||${fName}`);
                res.status(200).send({ success: true, message: "Product activated successfully" });
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
module.exports.uploadProductImage = async (req, res) => {
    let fName = `[uploadProductImage]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { productId } = req.params;
        dataString = `productId"${productId} | file:${req.file} `;
        // Input validation
        if (!isValidObjectId(productId)) {
            console.log(`${fName}[400]|| Invalid ID | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid ID" });
        }
        let existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            console.log(`${fName}[404]|| Product not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "Product not found" });
        }
        if (!req.file) {
            console.log(`${fName}[400]|| No file uploaded | ${dataString}||${fName}`);
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Input processing: Uploading to S3
        dotenv.config();
        const s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${productId}_${Date.now()}.${req.file.originalname.split(".").pop()}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };
        const command = new PutObjectCommand(uploadParams);
        const data = await s3Client.send(command);
        let imageLink = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        existingProduct.imageLink = imageLink;
        return existingProduct
            .save()
            .then((result) => {
                console.log(`${fName}[200]|| Image uploaded successfully | ${dataString}||${fName}`);
                res.status(200).send({ success: true, message: "Image uploaded successfully" });
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

module.exports.searchByName = async (req, res) => {
    let fName = `[searchByName]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { name } = req.body;
        dataString = `name:${name} `;
        // Input validation
        if (typeof name === "undefined" || name === "") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        }
        let products = await Product.find({ name: { $regex: name, $options: "i" }, isActive: true });
        if (products.length < 1) {
            console.log(`${fName}[404]|| No Products Found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "No Products Found" });
        }
        // Input processing: Retrieving all active products
        console.log(`${fName}[200]|| products:${JSON.stringify(products)} | ${dataString}||${fName}`);
        return res.status(200).send(products);
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.searchByPrice = async (req, res) => {
    let fName = `[searchByPrice]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { minPrice, maxPrice } = req.body;
        dataString = `minPrice:${minPrice} | maxPrice:${maxPrice} `;
        // Input validation
        if (typeof minPrice === "undefined" || typeof maxPrice === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        } else if (typeof minPrice !== "number" || typeof maxPrice !== "number") {
            console.log(`${fName}[400]|| Invalid price range values | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid price range values" });
        }
        let products = await Product.find({ price: { $gte: minPrice, $lte: maxPrice }, isActive: true });
        if (products.length < 1) {
            console.log(`${fName}[404]|| No Active Products Found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "No Active Products Found" });
        }
        // Input processing: Retrieving all active products
        console.log(`${fName}[200]|| products:${JSON.stringify(products)} | ${dataString}||${fName}`);
        return res.status(200).send(products);
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};
