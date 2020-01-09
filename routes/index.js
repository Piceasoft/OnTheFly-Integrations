/**
 * Copyright 2019 Piceasoft Ltd.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Modules
const router        = require('express').Router();
const querystring   = require('querystring');
const crypto        = require('crypto');
const fetch         = require("node-fetch");

// Private modules
const log           = require('../utils/log');
const reportingAPI  = require('../reporting API/reportapi');

// Server configuration
const config        = require('../config/config');

// Initialize logger
log.setIdentify("[OnTheFly Integrations | index.js]:");

/**
 * GET index page.
 */
router.get('/', function(req, res) {
    res.render('index', {
        title : 'Acme - OnTheFly',
        navbarConfig : {
            activeItem : "index"
        }
    });
});

/**
 * GET Verify page.
 */
router.get('/verify', function(req, res, next) {

    // Generate transaction ID against validation API to allow
    // loading of OnTheFly Trade-In iframe.
    createValidationTransactionID(config.TRADE_IN_IFRAME_API_PRODUCT_ID)
        .then((transactionID) => {
            // Construct query parameters for loading OnTheFly JavaScript API
            const queryParameters = {
                product_id      : config.JS_API_PRODUCT_ID,
                transaction_id  : transactionID,
                features        : 'verify',
                user_id         : config.USER_ID,
                user_name       : config.USER_NAME
            };

            // Construct OnTheFly JavaScript API download URL
            const OTF_JS_API_URL = config.JS_API_URL + "?" + querystring.stringify(queryParameters);

            res.render('verify', {
                title               : 'Acme - OnTheFly Verify',
                onthefly_js_api_url : OTF_JS_API_URL,
                navbarConfig        : {
                    activeItem : "verify"
                }
            });
        })
        .catch(error => next(error));
});

/**
 * GET Diagnostics page.
 */
router.get('/diagnostics', function(req, res, next) {
    // Generate transaction ID against validation API to allow
    // loading of OnTheFly Trade-In iframe.
    createValidationTransactionID(config.TRADE_IN_IFRAME_API_PRODUCT_ID)
        .then((transactionID) => {
            // Construct query parameters for loading OnTheFly JavaScript API
            const queryParameters = {
                product_id      : config.JS_API_PRODUCT_ID,
                transaction_id  : transactionID,
                features        : 'dgs',
                user_id         : config.USER_ID,
                user_name       : config.USER_NAME
            };

            // Construct OnTheFly JavaScript API download URL
            const OTF_JS_API_URL = config.JS_API_URL + "?" + querystring.stringify(queryParameters);

            res.render('diagnostics', {
                title               : 'Acme - OnTheFly Diagnostics',
                onthefly_js_api_url : OTF_JS_API_URL,
                navbarConfig        : {
                    activeItem : "diagnostics"
                }
            });
        })
        .catch(error => next(error));
});

/**
 * GET Trade-In page.
 */
router.get('/tradein', function(req, res, next) {

    // Generate transaction ID against validation API to allow
    // loading of OnTheFly Trade-In iframe.
    createValidationTransactionID(config.TRADE_IN_IFRAME_API_PRODUCT_ID)
        .then((transactionID) => {
            // Construct query parameters for loading OnTheFly Trade-In iframe
            const queryParameters = {
                product_id      : config.TRADE_IN_IFRAME_API_PRODUCT_ID,
                transaction_id  : transactionID,
                user_id         : config.USER_ID,
                user_name       : config.USER_NAME
            };

            // Construct OnTheFly JavaScript API download URL
            const TRADE_IN_IFRAME_API_URL = config.TRADE_IN_IFRAME_API_URL + "?" + querystring.stringify(queryParameters);

            res.render('tradein', {
                title                        : 'Acme - OnTheFly Trade-In',
                onthefly_trade_in_iframe_url : TRADE_IN_IFRAME_API_URL,
                navbarConfig                 : {
                    activeItem : "tradein"
                }
            });
        })
        .catch(error => next(error));
});

/**
 * GET reports page.
 */
router.get('/reports', function(req, res) {

    // Query filters for requesting transactions from reporting API module.
    let queryFilters = {};

    // Use reporting API module to pull the transactions from the
    // Piceasoft's reporting API.
    reportingAPI.getTransactions(queryFilters, function(error, transactions) {
        if(error) {
            // Return rendered reports HTML with error.
            res.render('reports', {
                title           : 'Acme - Reports',
                error           : error,
                errorText       : 'Failed to load transactions from reporting API.',
                navbarConfig    : {
                    activeItem : "reports"
                }
            });
        } else {
            // Return rendered reports HTML with transactions.
            res.render('reports', {
                title           : 'Acme - Reports',
                error           : false,
                transactions    : transactions.reverse(),
                navbarConfig    : {
                    activeItem : "reports"
                }
            });
        }
    });
});

/**
 * POST get transaction details for specific transaction.
 */
router.post('/transaction_details', function(req, res) {

    // Parse transaction details from request body.
    const uid = req.body.uid;
    const type = req.body.type;

    // Use reporting API module to pull the transaction details from the
    // Piceasoft's reporting API.
    reportingAPI.getTransaction(uid, type, function(error, details) {
        if(error) {
            // Return error details to client.
            return res.json(error);
        } else {
            // Return transaction details to client.
            return res.json(details);
        }
    });
});

/**
 * Generate transaction ID to allow loading OnTheFly services
 * from Piceasoft backend.
 *
 * @param productID
 * @returns {Promise<*>}
 */
async function createValidationTransactionID(productID) {
    let clientID = config.VALIDATION_API_ID;
    let privateKey = config.VALIDATION_API_KEY;

    let body = JSON.stringify({
        product_id: productID
    });
    let signature = crypto.createHash('sha256').update(privateKey + clientID + body).digest('hex');

    let postData = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Piceasoft-Client-Id': clientID,
            'X-Piceasoft-Signature': signature,
            'Content-Length': body.length.toString()
        },
        body: body
    };

    let response;

    try {
        response = await fetch(config.VALIDATION_API_URL + 'create_transaction_id', postData);
    } catch(fetchError) {
        log.error("Failed to generate transaction ID with create_transaction_id API. Error: " + JSON.stringify(fetchError));

        let error = new Error('Service unavailable');
        error.status = 503;
        throw error;
    }

    if(response.status !== 200) {
        log.error("Failed to generate transaction ID with create_transaction_id API. API response HTTP code: " + response.status);

        let error = new Error('Service unavailable');
        error.status = 503;
        throw error;
    }

    let json = await response.json();

    if(json.status !== 0) {
        log.error("Failed to generate transaction ID with create_transaction_id API. API response payload code: " + json.status);
        let error = new Error('Service unavailable');
        error.status = 503;
        throw error;
    }

    return json.transaction_id;
}

module.exports = router;
