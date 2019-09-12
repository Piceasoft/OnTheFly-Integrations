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
    log.setDebugs(true);
    reportapi.init(config.REPORTING_API_ID, config.REPORTING_API_KEY, config.REPORTING_API_URL);
}



// Initial deployment
deployConfig(require(CONFIG_FILE));

// Start polling
reportapi.poller();


