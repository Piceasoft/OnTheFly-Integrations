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

const fs              = require('fs');

const reportapi       = require('./reportapi.js');
const reportapi_utils = require('./reportapi_utils.js');
const log             = require('../utils/log.js');

// The config file name (loaded at startup and re-loaded when changed)
const CONFIG_FILE          = '../config/config.js';
const CONFIG_FILE_TEMPLATE = '../config/config.template.js';

// Reporting start index
let m_startIndex = 0;

// Config file must be there
if (!fs.existsSync(CONFIG_FILE)) {
    log.error(`file ${CONFIG_FILE} not found, use ${CONFIG_FILE_TEMPLATE} as basis for it`);
    process.exit(1);
}

// Activate configuration
function deployConfig(config)
{
    log.setDebugs(config.DEBUG);
    reportapi.init(config.REPORTING_API_ID, config.REPORTING_API_KEY, config.REPORTING_API_URL);
}


// Poll new reports. Runs every 5 mins
function poller()
{
    function _done()
    {
        const SLEEPTIME = 60*5*1000;
        log.info(`done getting reports, sleep ${SLEEPTIME/1000/60} minutes...`);
        setTimeout(poller, SLEEPTIME);
    }

    let filters = { };

    if (process.argv.length > 2)
        filters.imei = process.argv[2];;
    
    if (!m_startIndex) // Start from today as not polled before
        filters.startdate = new Date().toISOString().slice(0, 10);
    else
        filters.startindex = m_startIndex;

    log.info(`getting reports based on filter ${JSON.stringify(filters)}`);

    // get transactions, a.k.a reports
    reportapi.getTransactions(filters, (err, transactions) => {
        if (!err && Array.isArray(transactions)) {
            // sync-loop the whole array getting details of the transaction (report)
            let count = transactions.length;            
            reportapi_utils.syncLoop(count, (loop) => {
                let ix = loop.iteration();
                let transaction = transactions[ix];
                console.log(`IMEI: ${transaction.imei}`);
                reportapi.getTransaction(transaction.uid, transaction.type, (err, details) => {
                    if (err)
                        loop.break(true);
                    else {
                        console.log(JSON.stringify(details, null, 2));
                        m_startIndex = transaction.index + 1;
                        loop.next();
                    }
                });
            }, () => {   // syncloop is done
                _done();
            });
        }
        else
            _done(); // nothing got
    });
}


// Initial deployment
deployConfig(require(CONFIG_FILE));

// Start polling
poller();


