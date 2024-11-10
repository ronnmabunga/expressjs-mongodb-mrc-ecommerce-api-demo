const bcrypt = require("bcrypt");
const { isValidObjectId } = require("mongoose");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();
const AWS_ACCESS_KEY_ID = process.env.DEMO3_AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.DEMO3_AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.DEMO3_AWS_REGION;
const AWS_BUCKET_NAME = process.env.DEMO3_AWS_BUCKET_NAME;
const User = require("../models/User");
const { errorHandler, createAccessToken } = require("../auth");

module.exports.registerUser = async (req, res) => {
    let fName = `[registerUser]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { firstName, lastName, email, mobileNo, imageLink, password } = req.body;
        dataString = `firstName:${firstName} | lastName:${lastName} | email:${email} | mobileNo:${mobileNo} | imageLink:${imageLink} | password:${password} `;
        // Input validation
        if (typeof firstName === "undefined" || typeof lastName === "undefined" || typeof email === "undefined" || typeof mobileNo === "undefined" || typeof password === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        } else if (!email.includes("@")) {
            console.log(`${fName}[400]|| Email invalid | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Email invalid" });
        } else if (mobileNo.length !== 11) {
            console.log(`${fName}[400]|| Mobile number invalid | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Mobile number invalid" });
        } else if (password.length < 8) {
            console.log(`${fName}[400]|| Password must be atleast 8 characters | ${dataString}||${fName}`);
            return res.status(400).send({ error: `Password must be atleast 8 characters` });
        }
        let usersWithSameEmail = await User.find({ email: email });
        if (usersWithSameEmail.length > 0) {
            console.log(`${fName}[409]|| Email already registered | ${dataString}||${fName}`);
            return res.status(409).send({ error: "Email already registered" });
        }
        // Input processing: New User Creation
        let newUser = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            mobileNo: mobileNo,
            imageLink: imageLink,
            password: bcrypt.hashSync(password, 10),
        });
        return newUser
            .save()
            .then((result) => {
                console.log(`${fName}[201]|| Registered Successfully | ${dataString}||${fName}`);
                res.status(201).send({ message: "Registered Successfully" });
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

module.exports.loginUser = async (req, res) => {
    let fName = `[loginUser]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { email, password } = req.body;
        dataString = `email:${email} | password:${password} `;
        // Input validation
        if (typeof email === "undefined" || typeof password === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        } else if (!email.includes("@")) {
            console.log(`${fName}[400]|| Invalid Email | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid Email" });
        }
        let usersWithGivenEmail = await User.find({ email: email });
        if (usersWithGivenEmail.length < 1) {
            console.log(`${fName}[404]|| No email found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "No email found" });
        }
        const existingUser = usersWithGivenEmail[0];
        const isPasswordCorrect = bcrypt.compareSync(password, existingUser.password);
        if (!isPasswordCorrect) {
            console.log(`${fName}[401]|| Email and password do not match | ${dataString}||${fName}`);
            return res.status(401).send({ error: "Email and password do not match" });
        }
        // Input processing: Access Token Creation
        const token = createAccessToken(existingUser);
        console.log(`${fName}[200]|| access:${JSON.stringify(token)} | ${dataString}||${fName}`);
        return res.status(200).send({ access: token });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.getUserDetails = async (req, res) => {
    let fName = `[getUserDetails]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { id } = req.user;
        dataString = `id:${id} `;
        // Input validation
        let existingUser = await User.findById(id, "-password");
        if (!existingUser) {
            console.log(`${fName}[404]|| User not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "User not found" });
        }
        // Input processing: Sending User Details to Response
        console.log(`${fName}[200]|| user:${JSON.stringify(existingUser)} | ${dataString}||${fName}`);
        return res.status(200).send({ user: existingUser });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.getAllUserDetails = async (req, res) => {
    let fName = `[getUserAllDetails]`;
    try {
        // Input validation
        let users = await User.find({});
        if (users.length < 1) {
            console.log(`${fName}[404]|| No users found ||${fName}`);
            return res.status(404).send({ error: "No users found" });
        }
        // Input processing: Retrieving all User Details
        console.log(`${fName}[200]|| user:${JSON.stringify(users)} ||${fName}`);
        return res.status(200).send(users);
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler ||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.setUserAsAdmin = async (req, res) => {
    let fName = `[setUserAsAdmin]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { id } = req.params;
        dataString = `id:${id} `;
        // Input validation
        // if (!isValidObjectId(id)) {
        //     return res.status(404).send({ error: "Invalid ID" });
        // }
        let existingUser = await User.findById(id);
        if (!existingUser) {
            console.log(`${fName}[404]|| User not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "User not found" });
        }
        if (existingUser.isAdmin) {
            console.log(`${fName}[200]|| User is already an admin | updatedUser:${JSON.stringify(existingUser)} | ${dataString}||${fName}`);
            return res.status(200).send({ message: "User is already an admin", updatedUser: existingUser });
        }
        // Input processing: Updating User's Admin Status
        existingUser.isAdmin = true;
        return existingUser
            .save()
            .then((updatedUser) => {
                console.log(`${fName}[200]|| Admin Access Granted Successfully | updatedUser:${JSON.stringify(updatedUser)} | ${dataString}||${fName}`);
                res.status(200).send({ message: "Admin Access Granted Successfully", updatedUser: updatedUser });
            })
            .catch((error) => {
                console.log(`${fName}[500]|| Passed to Error Handler | ${dataString}||${fName}`);
                errorHandler(error, req, res);
            });
    } catch (error) {
        // IMPORTANT: Error handling in this method is different, due to the Expected Output
        console.log(`${fName}[500]|| Passed to Outer Error Handler | error: "Failed in Find" | details:${JSON.stringify(error)} | ${dataString}||${fName}`);
        return res.status(500).json({ error: "Failed in Find", details: error });
    }
};

module.exports.updateUserPassword = async (req, res) => {
    let fName = `[updateUserPassword]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { newPassword, oldPassword } = req.body;
        const { id } = req.user;
        dataString = `newPassword:${newPassword} | oldPassword:${oldPassword} | id:${id} `;
        // Input validation
        if (typeof newPassword === "undefined" || typeof oldPassword === "undefined" || typeof id === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        } else if (newPassword.length < 8) {
            console.log(`${fName}[400]|| New password must be atleast 8 characters | ${dataString}||${fName}`);
            return res.status(400).send({ error: `New password must be atleast 8 characters` });
        }
        let existingUser = await User.findById(id);
        if (!existingUser) {
            console.log(`${fName}[404]|| User not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "User not found" });
        }
        const isPasswordCorrect = bcrypt.compareSync(oldPassword, existingUser.password);
        if (!isPasswordCorrect) {
            console.log(`${fName}[401]|| Current password provided is incorrect| ${dataString}||${fName}`);
            return res.status(401).send({ error: "Current password provided is incorrect" });
        }
        // Input processing: Updating User's Password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        existingUser.password = hashedPassword;
        return existingUser
            .save()
            .then((updatedUser) => {
                console.log(`${fName}[201]|| Password reset successfully | ${dataString}||${fName}`);
                res.status(201).json({ message: "Password reset successfully" });
            }) // IMPORTANT: Expected Output indicates status code 201 Created, when it should be 200 OK, the message is also misleading as it was changed/updated, not resetted
            .catch((error) => {
                console.log(`${fName}[500]|| Passed to Error Handler | ${dataString}||${fName}`);
                errorHandler(error, req, res);
            });
    } catch (error) {
        console.log(`${fName}[500]|| Passed to Outer Error Handler | ${dataString}||${fName}`);
        errorHandler(error, req, res);
    }
};

module.exports.uploadUserImage = async (req, res) => {
    let fName = `[uploadUserImage]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { userId } = req.params;
        dataString = `userId"${userId} | file:${req.file} `;
        // Input validation
        if (!isValidObjectId(userId)) {
            console.log(`${fName}[400]|| Invalid ID | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Invalid ID" });
        }
        let existingUser = await User.findById(userId);
        if (!existingUser) {
            console.log(`${fName}[404]|| User not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "User not found" });
        }
        if (!req.file) {
            console.log(`${fName}[400]|| No file uploaded | ${dataString}||${fName}`);
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Input processing: Uploading to S3
        const s3Client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });
        const uploadParams = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${userId}_${Date.now()}.${req.file.originalname.split(".").pop()}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };
        const command = new PutObjectCommand(uploadParams);
        const data = await s3Client.send(command);
        let imageLink = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
        existingUser.imageLink = imageLink;
        return existingUser
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

module.exports.updateUserDetails = async (req, res) => {
    let fName = `[updateUserDetails]`;
    let dataString = ``;
    try {
        // Input pre-processing
        const { firstName, lastName, email, mobileNo } = req.body;
        dataString = `firstName:${firstName} | lastName:${lastName} | email:${email} | mobileNo:${mobileNo} `;
        const { id } = req.user;
        // Input validation
        if (typeof firstName === "undefined" || typeof lastName === "undefined" || typeof email === "undefined" || typeof mobileNo === "undefined") {
            console.log(`${fName}[400]|| Required inputs are missing | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Required inputs are missing" });
        } else if (!email.includes("@")) {
            console.log(`${fName}[400]|| Email invalid | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Email invalid" });
        } else if (mobileNo.length !== 11) {
            console.log(`${fName}[400]|| Mobile number invalid | ${dataString}||${fName}`);
            return res.status(400).send({ error: "Mobile number invalid" });
        }
        let existingUser = await User.findById(id);
        if (!existingUser) {
            console.log(`${fName}[404]|| User not found | ${dataString}||${fName}`);
            return res.status(404).send({ error: "User not found" });
        }
        let usersWithSameEmail = await User.find({ email: email });
        if (usersWithSameEmail.length > 1 || (usersWithSameEmail.length === 1 && usersWithSameEmail[0]._id.toHexString() !== id)) {
            console.log(usersWithSameEmail[0]._id);
            console.log(id);
            console.log(`${fName}[409]|| Email already registered | ${dataString}||${fName}`);
            return res.status(409).send({ error: "Email already registered" });
        }
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        existingUser.email = email;
        existingUser.mobileNo = mobileNo;
        // Input processing: Updating User Details
        return existingUser
            .save()
            .then((updatedUser) => {
                console.log(`${fName}[200]|| User profile updated successfully | ${dataString}||${fName}`);
                res.status(200).json({ message: "User profile updated successfully" });
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
