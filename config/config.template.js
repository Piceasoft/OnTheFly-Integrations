/*******************************************************************************
 *
 * OnTheFly Trial site server configuration file.
 *
 * @file      config.js
 * @version   1.0
 * @brief     Constant server configurations for OnTheFly Integrations server.
 * @copyright Piceasoft 2019
 *
 ******************************************************************************/

module.exports = {

    /**
     * Flag to enable debug level logging.
     */
    DEBUG: true,

    /**
     * External URL pointing to Reporting API.
     */
    REPORTING_API_URL: "https://api.piceasoft.com/",

    /**
     * Credentials for Reporting API.
     */
    REPORTING_API_ID: " *** Insert valid reporting API ID here *** ",
    REPORTING_API_KEY: " *** Insert valid reporting API key here *** ",

    /**
     * External URL which is used to load the OnTheFly JavaScript API.
     */
    JS_API_URL: "https://api-rd.piceasoft.com/otf/v2/load_jsapi",
    JS_API_ACCOUNT_ID: " *** Insert valid account ID here *** "

};