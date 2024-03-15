'use strict'

// Getting dependencies
var sha1 = require('sha1');
var jwt = require('jsonwebtoken');

// Query DB
const { query } = require("../dbLayer");

// All Queries
const {
    checkIfEmail,
    signUpQuery,
    notificationSettingsQuery,
    signInQuery,
    updatePasswordAccrossEmail,
    connectStoreWithUser,
    updateNotificationSettingQuery,
    getUserDetailById
} = require("../dbLayer/customer.queries");

// Getting common health check response message
const { healthCheckResponse } = require("../utils/common");

const { encryptData } = require("../utils/encryption");

// Getting environments
const { JWT_SECRET } = process.env;

// =============================================== Controllers ========================================================

// Health check
exports.health = (req, res, next) => res.reply(healthCheckResponse);

// Sign up
exports.signup = async (req, res, next) => {
    try {
        const { email, username, password, currency } = req.body;

        const queryCheckEmail = checkIfEmail();
        const dbEmailRes = await query(queryCheckEmail, [email]);

        if (dbEmailRes.rowCount > 0) {
            return res.reply({ statusCode: 400, message: "Email already exists" });
        } else {
            const dbRes = await query(signUpQuery(), [username, sha1(password), email, currency]);
            await query(notificationSettingsQuery(), [dbRes.rows[0].id]);
            return res.reply({ statusCode: 200, message: "Account created successfully" });
        }
    } catch (err) {
        console.log(err);
        return res.reply({ statusCode: 400, message: "Something went wrong", error: err });
    }
};

// Sign in
exports.signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const dbUserRes = await query(signInQuery(), [email, sha1(password)]);
        if (dbUserRes.rowCount > 0) {
            const token = jwt.sign(dbUserRes.rows[0], JWT_SECRET, { expiresIn: '1h' });
            return res.reply({ statusCode: 200, message: "Sign in successful", data: { token: token } });
        } else {
            return res.reply({ statusCode: 400, message: "Invalid credentials" });
        }
    } catch (err) {
        console.log(err);
        return res.reply({ statusCode: 400, message: "Something went wrong", error: err });
    }
};

// Update password
exports.updatepassword = async (req, res, next) => {
    try {
        const { password } = req.body;
        const { email } = req.userData
        const queryUpdatePassword = updatePasswordAccrossEmail();
        await query(queryUpdatePassword, [sha1(password), email]);
        return res.reply({ statusCode: 200, message: "Password updated successfully" });

    } catch (err) {
        console.log(err);
        return res.reply({ statusCode: 400, message: "Something went wrong", error: err });
    }
};

// Connect store
exports.connectstore = async (req, res, next) => {
    try {
        const { store_type, store_credentials_details } = req.body;
        await query(connectStoreWithUser(), [store_type, encryptData(JSON.stringify(store_credentials_details)), req.userData.id]);
        return res.reply({ statusCode: 200, message: "Store connected successfully" });

    } catch (err) {
        console.log(err);
        return res.reply({ statusCode: 400, message: "Something went wrong", error: err });
    }
};

// Update notification
exports.updatenotificationsetting = async (req, res, next) => {
    try {
        const { is_enabled } = req.body;

        var dbRes = {};
        is_enabled == true
            ? dbRes = await query(updateNotificationSettingQuery(), [true, true, true, req.userData.user_id])
            : dbRes = await query(updateNotificationSettingQuery(), [false, false, false, req.userData.user_id]);

        if (dbRes.rowCount > 0) {
            const dbUserRes = await query(getUserDetailById(), [req.userData.user_id]);
            const token = jwt.sign(dbUserRes.rows[0], JWT_SECRET, { expiresIn: '1h' });
            return res.reply({ statusCode: 200, message: "Notification settings updated successfully", data: { token: token } });
        } else {
            return res.reply({ statusCode: 400, message: "Something went wrong" });
        }
    } catch (err) {
        console.log(err);
        return res.reply({ statusCode: 400, message: "Something went wrong", error: err });
    }
};

// Get user details
exports.userdetails = async (req, res, next) => {
    try {
        const { userData } = req;
        return res.reply({ statusCode: 200, message: "User details fetched successfully", data: userData });
    } catch (err) {
        console.log(err);
        return res.reply({ statusCode: 400, message: "Something went wrong", error: err });
    }
};