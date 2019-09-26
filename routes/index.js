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
const express       = require('express');
const router        = express.Router();
const uuid          = require('uuid');
const querystring   = require('querystring');

// Private modules
const reportingAPI  = require('../reporting API/reportapi');

// Server configuration
const config        = require('../config/config');

/**
 * GET index page.
 */
router.get('/', function(req, res, next) {

    // Construct query parameters for loading OnTheFly JavaScript API
    const queryParameters = {
        account_id      : config.JS_API_ACCOUNT_ID,
        transaction_id  : uuid.v4(),
        features        : 'verify;dgs',
        user_id         : '4a410871-2968-452b-9dce-98d380b36b6f',
        user_name       : 'hsalminen'
    };

    // Construct OnTheFly JavaScript API download URL
    const OTF_JS_API_URL = config.JS_API_URL + "?" + querystring.stringify(queryParameters);

    res.render('index', {
        title               : 'Acme - OnTheFly',
        onthefly_js_api_url : OTF_JS_API_URL,
        navbarConfig        : {
            activeItem : "trade-in"
        }
    });
});

/**
 * GET reports page.
 */
router.get('/reports', function(req, res, next) {

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
router.post('/transaction_details', function(req, res, next) {

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

module.exports = router;
