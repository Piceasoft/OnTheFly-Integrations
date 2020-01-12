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

    // TODO: Generate transaction ID to load OnTheFly JavaScript API.

    // TODO: Generate OnTheFly JavaScript API URL with required parameters.

    const OTF_JS_API_URL = config.JS_API_URL;

    res.render('verify', {
        title               : 'Acme - OnTheFly Verify',
        onthefly_js_api_url : OTF_JS_API_URL,
        navbarConfig        : {
            activeItem : "verify"
        }
    });
});

/**
 * GET Diagnostics page.
 */
router.get('/diagnostics', function(req, res, next) {

    // TODO: Generate transaction ID to load OnTheFly JavaScript API.

    // TODO: Generate OnTheFly JavaScript API URL with required parameters.

    const OTF_JS_API_URL = config.JS_API_URL;

    res.render('diagnostics', {
        title               : 'Acme - OnTheFly Diagnostics',
        onthefly_js_api_url : OTF_JS_API_URL,
        navbarConfig        : {
            activeItem : "diagnostics"
        }
    });
});

/**
 * GET Trade-In page.
 */
router.get('/tradein', function(req, res, next) {

    // TODO: Generate transaction ID to load OnTheFly Trade-In iframe.

    // TODO: Generate Trade-In iframe URL with required parameters.

    const TRADE_IN_IFRAME_API_URL = config.TRADE_IN_IFRAME_API_URL;

    res.render('tradein', {
        title                        : 'Acme - OnTheFly Trade-In',
        onthefly_trade_in_iframe_url : TRADE_IN_IFRAME_API_URL,
        navbarConfig                 : {
            activeItem : "tradein"
        }
    });
});

/**
 * GET reports page.
 */
router.get('/reports', function(req, res) {

    // TODO: Fetch transactions from reporting API.

    res.render('reports', {
        title           : 'Acme - Reports',
        error           : false,
        transactions    : [],
        navbarConfig    : {
            activeItem : "reports"
        }
    });
});

/**
 *
 * TODO: Add POST handler 'transaction_details' for fetching transaction
 * TODO: details from reporting API.
 *
 */

/**
 *
 * TODO: Add method to generate transaction ID for loading OnTheFly services
 * TODO: from Piceasoft API.
 *
 */

module.exports = router;
