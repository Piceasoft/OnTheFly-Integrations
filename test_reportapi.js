/**
 * Reporting API test app.
 *
 * @copyright Piceasoft 2019
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT 
 * SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE 
 * FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE, 
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR 
 * OTHER DEALINGS IN THE SOFTWARE.
 */


const fs              = require('fs');

const reportapi       = require('./reportapi.js');
const reportapi_utils = require('./reportapi_utils.js');
const log             = require('./log.js');

// The config file name (loaded at startup and re-loaded when changed)
const CONFIG_FILE = './config.json';

// Reporting start index
let m_startIndex = 0;

// Config file must be there
if (!fs.existsSync(CONFIG_FILE)) {
    log.error(`file ${CONFIG_FILE} not found, use ${CONFIG_FILE}.template as a template for it`);
    process.exit(1);
}

// Activate configuration
function deployConfig(config)
{
    log.setDebugs(config.debug);
    reportapi.init(config.api_id, config.api_key, config.url_base);
}


// Poll new reports. Runs every 5 mins
function poller()
{
    function _done()
    {
        log.info('done getting reports, sleep awhile...');
        setTimeout(poller, 60*5*1000);
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

// Watch config changes
fs.watch(CONFIG_FILE, function() {
    // sleep a while before reading as saving in editor side may take time
    setTimeout(() => {
        fs.readFile(CONFIG_FILE, 'utf8', function (err, data) {
            if (!err) {
                let newConfig = null;
                try {
                    newConfig = JSON.parse(data);
                } catch (er) {
                    log.error(`failed to parse configuration file '${CONFIG_FILE}' (${er})`);
                    newConfig = null;
                }
                if (newConfig) {
                    deployConfig(newConfig);
                    log.info(`reloaded configuration file '${CONFIG_FILE}'`);
                }                
            }
            else
                log.error(`failed to read configuration file '${CONFIG_FILE}' (${err})`);
        });
    }, 1000);
});    

// And start polling
poller();


