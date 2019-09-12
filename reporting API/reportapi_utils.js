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

// Node modules
const request = require('request');
const crypto  = require('crypto');
const fs      = require('fs');


// Locals
const log = require('../utils/log.js');

// Module settings
let m_apiKey   = 'none';
let m_apiId    = 'API ID NOT DEFINED';
let m_urlBase  = 'https://api.piceasoft.com/';


function getErrorText(code)
{
    let text = "Undefined error";
    switch (code) {
    case    0: text = "OK";break;
    case   -1: text = "Internmal error"; break;
    case 1000: text = "Signature mismatch"; break;
    case 1001: text = "Unknown client ID";  break;
    case 1002: text = "Invalid parameters"; break;
    case 1003: text = "Database error"; break;
    case 1004: text = "Unknown command"; break;
    case 1005: text = "Invalid JSON input"; break;
    case 1006: text = "Server not ready"; break;
    case 1007: text = "Object(s) not found"; break;
    case 1008: text = "Server busy"; break;
    case 1009: text = "Access denied"; break;
    case 1010: text = "Invalid PDF"; break;
    case 1011: text = "Language not supported"; break;
    }
    return 'ReportAPI failed (' + text + ')';
}

/**
   Init module

   @param {string}           apiId  - API ID
   @param {string}           apiKey - API key
   @param {string|undefined} urlBase - URL base (optional)
*/

exports.init = function(apiId, apiKey, urlBase)
{
    m_apiId = apiId;
    m_apiKey = apiKey;
    if (typeof urlBase === 'string')
        m_urlBase = urlBase;

    log.info(`Report API inited with API ID '${apiId}' to URL '${m_urlBase}'`);
    
};


/**
   Run synchronous loop

   @param {number}   iterations - How many iterations
   @param {function(Object)} process - The callback for each iteration
   @param {function} exit - The callback when all done
*/

exports.syncLoop = function(iterations, process, exit)
{
    let index = 0,
        done = false,
        shouldExit = false;
    let loop = {
        next: () => {
            if (done) {
                if (shouldExit && exit) {
                    return exit(); // Exit if we're done
                }
            }
            // If we're not finished
            if (index < iterations) {
                index++;       // Increment our index
                process(loop); // Run our process, pass in the loop
            // Otherwise we're done
            } else {
                done = true;      // Make sure we say we're done
                if (exit) exit(); // Call the callback on exit
            }
        },
        iteration: () => {
            return index - 1; // Return the loop number we're on
        },
        break: (end) => {
            done = true;      // End the loop
            shouldExit = end; // Passing end as true means we still call the exit callback
        }
    };
    loop.next();
    return loop;
};


/**
   Make reporting API request

   @param {Array|null}   productIds - Product ID array, if any
   @param {string}       cmd - API command
   @param {Object}       requestData - API request parameter object
   @param {function(Object|null, Object|null)} onReady - The callback that handles the result
*/

exports.apiRequest = function(productIds, cmd, requestData, onReady)
{
    // Add product IDs, if any
    if (Array.isArray(productIds) && productIds.length > 0)
        requestData.product_ids = productIds;
    
    let jsonBody  = JSON.stringify(requestData);    
    let data_to_hash = m_apiKey + m_apiId + jsonBody;   
    let signature    = crypto.createHash('sha256').update(data_to_hash).digest('hex');
    let headers      = {'Content-Type'         : 'application/json',
                        'x-piceasoft-client-id': m_apiId,
                        'x-piceasoft-signature': signature };
    
    let reqUrl  = m_urlBase + 'reporting/v1/' + cmd;
    log.debug(`API request '${reqUrl}' with request data '${JSON.stringify(requestData)}'...`);
    request({ url:      reqUrl,
              method:  'POST',
              timeout:  30*1000,
              encoding: null,
              headers:  headers,
              body:     jsonBody
            }, (err, response, responseData) => {
                if (!err) {
                    // Check if we got response error
                    if (response.statusCode !== 200) {
                        err = new Error(`reportapi HTTP error ${response.statusCode}`);
                        err.http_code = response.statusCode;                        
                    }
                    else
                    if (response.headers && response.headers['content-type'] === 'application/json') {
                        // Convert JSON to object
                        try {
                            responseData = JSON.parse(responseData);
                        } catch (e) {
                            responseData = null;
                            err = e;
                        }
                        if (responseData && responseData.status !== 0) {
                            err = new Error(getErrorText(responseData.status));
                            err.reportapi_status = responseData.status;
                            if (responseData.error_details)
                                err.reportapi_error_details = responseData.error_details;
                                
                            responseData = null;
                        }
                    }
                }
                else  // Error, no response 
                    responseData = null;

                if (err)
                    log.error(err + ` (request=${reqUrl})`);
                else
                    log.debug(`API request '${reqUrl}' with request data '${JSON.stringify(requestData)}' done`);                
                return onReady(err, responseData);
            });
};




