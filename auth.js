const jwt = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET_KEY = process.env.DEMO3_JWT_SECRET_KEY;

module.exports.createAccessToken = (user) => {
    try {
        const data = {
            id: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
        };
        return jwt.sign(data, JWT_SECRET_KEY, {});
    } catch (error) {
        console.log(`[createAccessToken][500]|| Passed to Outer Error Handler ||[createAccessToken]`);
        errorHandler(error, req, res);
    }
};

module.exports.verify = (req, res, next) => {
    try {
        console.log(req.headers.authorization);
        let token = req.headers.authorization;
        if (typeof token === "undefined") {
            console.log(`[verify][401]|| No Token Found. Authentication Failed | token:${JSON.stringify(token)} ||[verify]`);
            return res.status(401).send({ error: "No Token Found. Authentication Failed" });
        } else {
            token = token.slice(7, token.length);
            console.log(token);
            jwt.verify(token, JWT_SECRET_KEY, function (err, decodedToken) {
                if (err) {
                    console.log(`[verify][200]|| Token invalid, authentication failed | token:${JSON.stringify(token)} | err:${JSON.stringify(err)} ||[verify]`);
                    return res.status(200).send({
                        error: "Authentication Failed",
                        details: err.message,
                    });
                } else {
                    console.log("Authentication Info:");
                    console.log(decodedToken);
                    req.user = decodedToken;
                    next();
                }
            });
        }
    } catch (error) {
        console.log(`[verify][500]|| Passed to Outer Error Handler ||[verify]`);
        errorHandler(error, req, res);
    }
};

module.exports.verifyAdmin = (req, res, next) => {
    try {
        if (req.user.isAdmin) {
            next();
        } else {
            console.log(`[verifyAdmin][403]|| Not an admin, authorization failed | req.user.isAdmin:${req.user.isAdmin} ||[verifyAdmin]`);
            return res.status(403).send({
                auth: "Failed",
                message: "Action Forbidden",
            });
        }
    } catch (error) {
        console.log(`[verifyAdmin][500]|| Passed to Outer Error Handler ||[verifyAdmin]`);
        errorHandler(error, req, res);
    }
};

module.exports.errorHandler = (err, req, res, next) => {
    console.log(`[errorHandler][500] ERROR HANDLER START | `);
    console.log(err);
    const statusCode = err.status || 500;
    const errorMessage = err.message || "Internal Server Error";
    res.status(statusCode).json({
        error: {
            message: errorMessage,
            errorCode: err.code || "SERVER_ERROR",
            details: err.details || null,
        },
    });
    console.log(` |  ERROR HANDLER END ||[errorHandler]`);
};
