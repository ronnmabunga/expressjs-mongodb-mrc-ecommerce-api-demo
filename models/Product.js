const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product Name is Required"],
    },
    description: {
        type: String,
        required: [true, "Product Description is Required"],
    },
    altDescription: {
        type: String,
        default: "",
    },
    price: {
        type: Number,
        required: [true, "Product Price is Required"],
    },
    imageLink: {
        type: String,
        default: "",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
});
module.exports = mongoose.model("Product", productSchema);
