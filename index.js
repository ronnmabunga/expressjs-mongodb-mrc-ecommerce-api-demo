const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
    origin: ["http://localhost:3000", "http://zuitt-bootcamp-prod-443-7339-mabunga.s3-website.us-east-1.amazonaws.com", "http://zuitt-bootcamp-prod-443-7444-rubia.s3-website.us-east-1.amazonaws.com"],
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

mongoose.connect(process.env.MONGO_STRING);
mongoose.connection.once("open", () => console.log("Now connected to MongoDB Atlas."));

app.use("/b5/users", userRoutes);
app.use("/b5/products", productRoutes);
app.use("/b5/cart", cartRoutes);
app.use("/b5/orders", orderRoutes);

if (require.main === module) {
    app.listen(process.env.PORT || 4005, () => {
        console.log(`API is now online on port ${process.env.PORT || 4005}`);
    });
}
module.exports = { app, mongoose };
