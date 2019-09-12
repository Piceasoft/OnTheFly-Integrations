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

// Our own modules
const log             = require('../utils/log.js');
const api_utils       = require('./reportapi_utils.js');


/**
  Note on error object of onReady callback:

  It is normal error object, with the following additional properties:
  - http_code:               in case HTTP error (i.e return code is not 200)
  - reportapi_status:        in case reporting API failed, this is the 'status'
  - reportapi_error_details: in case reporting API failed and it has details, this is the 'error_details'
*/


/**
   Init reporting API

   @param {string}           api_id  - API ID
   @param {string)}          api_key - API key
   @param {string|undefined} URL base, if not given https://api.piceasoft.com is used
*/

exports.init = function (api_id, api_key, url_base)
{
    api_utils.init(api_id, api_key, url_base);
};


/**
   Get transactions

   @param {Object|null}                      filters - imei, startindex and startdate can be set; if not set, list transactions from today
   @param {function(Object|null,Array|null)} onReady - The callback that handles the result
*/

function getTransactions(filters, onReady)
{
    let requestData = { };

    if (filters && typeof filters === 'object') {
        if (typeof filters.imei === 'string')
            requestData.imei = filters.imei;
        if (typeof filters.startdate === 'string')
            requestData.startdate = filters.startdate;
        if (typeof filters.startindex === 'number')
            requestData.startindex = filters.startindex;
    }
    if (!requestData.imei && !requestData.startindex && !requestData.startdate) {
        // No filters, get reports from today
        requestData.startdate = new Date().toISOString().slice(0, 10);
    }

    api_utils.apiRequest(null, 'get_transactions_ex', requestData, (err, getTransactionsResponse) => {
        if (err || !Array.isArray(getTransactionsResponse.transactions))
            return onReady(err, null);
        else
            return onReady(null, getTransactionsResponse.transactions);
    });
}
exports.getTransactions = getTransactions;


/**
   Get transaction details

   @param {string}   uid  - report ID
   @param {Number}   type - report type
   @param {function(Object|null,Object|null)} onReady - The callback that handles the result
*/
function getTransaction(uid, type, onReady)
{
    api_utils.apiRequest(null, 'get_transaction_details', { uid: uid, type: type, get_custom_fields: true }, (err, details) => {
        if (err || !details) 
            return onReady(err, null);
        else
            return onReady(null, details);
    });
}
exports.getTransaction = getTransaction;



/**
   Get PDF of a report

   @param {string}   uid  - report ID
   @param {function(Object|null,Buffer|null)} onReady - The callback that handles the result
*/

exports.getPDF = function (uid, onReady)
{
    api_utils.apiRequest(null, 'get_pdf_report', { uid: uid }, (err, pdfContent) => {
        onReady(err, pdfContent);
    });
};


let m_startIndex = 0;

function poller()
{
    function _done()
    {
        const SLEEPTIME = 60*5*1000;
        log.debug(`done getting reports, sleep ${SLEEPTIME/1000/60} minutes...`);
        setTimeout(poller, SLEEPTIME);
    }

    let filters = { };

    if (!m_startIndex) // Start from today as not polled before
        filters.startdate = new Date().toISOString().slice(0, 10);
    else
        filters.startindex = m_startIndex;

    log.debug(`getting reports based on filter ${JSON.stringify(filters)}`);

    // get transactions, a.k.a reports
    getTransactions(filters, (err, transactions) => {
        if (!err && Array.isArray(transactions)) {
            // sync-loop the whole array getting details of the transaction (report)
            let count = transactions.length;            
            api_utils.syncLoop(count, (loop) => {
                let ix = loop.iteration();
                let transaction = transactions[ix];
                log.debug(`IMEI: ${transaction.imei}`);
                getTransaction(transaction.uid, transaction.type, (err, details) => {
                    if (err)
                        loop.break(true);
                    else {
                        log.debug(JSON.stringify(details, null, 2));
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

exports.poller = poller;
