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
     * External URL pointing to Validation API.
     */
    VALIDATION_API_URL: "https://api.piceasoft.com/validation/v1/",

    /**
     * Credentials for Validation API.
     */
    VALIDATION_API_ID: " *** Insert valid validation API ID here *** ",
    VALIDATION_API_KEY: " *** Insert valid validation API key here ***",

    /**
     * External URL which is used to load the OnTheFly JavaScript API.
     */
    JS_API_URL: "https://api.piceasoft.com/otf/v2/load_jsapi",
    JS_API_PRODUCT_ID: " *** Insert valid product ID here *** ",

    /**
     * External URL which is used to load the OnTheFly JavaScript API.
     */
    TRADE_IN_IFRAME_API_URL: "https://services.piceasoft.com/service/trading/v1",
    TRADE_IN_IFRAME_API_PRODUCT_ID: " *** Insert valid product ID here *** ",

    /**
     * User information for OnTheFly session.
     * Usually based on login information for example.
     */
    USER_NAME: " *** Insert user name here *** ",
    USER_ID: " *** Insert user ID here *** "

};
