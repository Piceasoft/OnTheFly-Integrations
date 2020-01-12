# OnTheFly-Integrations

Sample project for Piceasoft's OnTheFly JavaScript API and Reporting API
integrations.

ACME Inc is imaginary company providing online services for mobile devices.
ACME Inc uses Piceasoft's OnTheFly technology to implement the services on
their website.

This sample project includes examples for the following integrations:

- __Verify__        (Make Model Recognition and device checks) service integration using OnTheFly JavaScript API.
- __Diagnostics__   (diagnose issues with mobile device) service integration using OnTheFly JavaScript API.
- __Trade-In__      (Trading old mobile devices) service integration using OnTheFly Trade-In iframe.

The back-end is implemented using NodeJS with ExpressJS framework.
Front-end is rendered using EJS, HTML5, Bootstrap 4 and jQuery.

## Development environment setup

To run the server we need to first provide the configuration file to the server.
The project contains a template file for the actual configuration in:

`<project root>/config.template.js`

Create a copy of this template file and rename it config.js

`<project root>/config.js`

In the configuration file we have few things already in place

- Reporting API URL
- Validation API URL
- OnTheFly JavaScript API URL
- Trade-In OnTheFly iframe URL

Additionally we need to define a few things ourself:

- Reporting API credentials             (REPORTING_API_ID, REPORTING_API_KEY)
- Validation API credentials            (VALIDATION_API_ID, VALIDATION_API_KEY)
- OnTheFly JavaScript API product ID    (JS_API_PRODUCT_ID)
- OnTheFly Trade-In iframe product ID   (TRADE_IN_IFRAME_API_PRODUCT_ID)

These details are provided by Piceasoft and these details are considered
secrets and shall not be made publicly available!

Additionally we can provide our individual user information (USER_NAME, USER_ID)
which will be available in the Piceasoft reporting and reporting API.

## Running the server locally

After the server configuration setup is done we can start the server.

1. Install project dependencies by running the following command from the
project's root directory: `npm install`

2. After the dependencies are installed the server is started by running the
following command from project's root directory: `npm start`

This command will start the server and bind it to localhost port 3000.
You can access the server now by going to
[http://localhost:3000/](http://localhost:3000/)
on your favorite browser.

From the URL you should be able to see the index page of our application.

## Running the server with Docker

Project contains really simple Dockerfile and docker-compose configuration
for local development needs. To start the server first time run the
following command.

`docker-compose up -d --build`

You can access the server now by going to
[http://localhost:3000/](http://localhost:3000/)
on your favorite browser.

When you modify the server related files the server can be restarted with
the following command.

`docker-compose restart -t 0`

To stop the server use the following command.

`docker-compose stop`

## Verify OnTheFly integration

In this example we are going to integrate OnTheFly JavaScript API into our
web application. We are going to find out the device make model information
and run a few verifications for the device.

OnTheFly JavaScript API provides a bidirectional communication channel
between our web application and native PiceaOne app running on the mobile
device (iOS or Android). With the API we can receive events from the PiceaOne
app and we can send commands to the app to make it do things for us.

__Web application__ <--> __OnTheFly JavaScript API__ <--> __PiceaOne app__

### Loading the OnTheFly JavaScript API

To be able to load the OnTheFly JavaScript API from Piceasoft's we need to have
at least couple of things:

- Product ID
- Transaction ID

The product ID is provided by the Piceasoft and it is defined in the server
configuration file (JS_API_PRODUCT_ID). To get the transaction ID we need to use
Piceasoft's validation API to generate one. We will generate a transaction ID
when our web application is loaded from our back-end.

We are going to add the product ID and the transaction ID to OnTheFly
JavaScript API loading as URL parameters.

The following chart describes the overall process of loading the OnTheFly
JavaScript API.

![Sequence diagram of loading OnTheFly JavaScript API](https://github.com/Piceasoft/OnTheFly-Integrations/blob/master/documentation/Loading%20OnTheFly%20JavaScript%20API.png?raw=true)

The web application is rendered using EJS template engine. Let's take a look at
the `<project root>/views/verify.ejs` template. At the bottom of the HTML body
we have script tags that include the OnTheFly JavaScript API to our application.

``` JavaScript
<!-- OnTheFly JavaScript API -->
<script src="<%= onthefly_js_api_url %>"></script>
```

In this code we are telling the EJS template engine to replace the
`onthefly_js_api_url` with the variable that we are providing to the template
engine when this template is rendered. Let's try to use the API shall we.

Add the following code inside the `$(document).ready` method:

``` JavaScript
let $loading_error_container    = $('#loading-error-container');
let $loading_error_status       = $('#loading-error-status');
let $loading_error_message      = $('#loading-error-message');

/**
 * Check that OTFAPI is defined after document loading has finished.
 */
if(typeof OTFAPI.error !== "undefined") {
    // OnTheFly JavaScript API loading has failed.
    console.log("OnTheFly JavaScript API loading failed.");

    // Set loading error details
    $loading_error_status.html(OTFAPI.error.status);
    $loading_error_message.html(OTFAPI.error.message);

    // Show the error view as OnTheFly JavaScript loading has failed.
    $loading_error_container.show();
} else {
    // OnTheFly JavaScript API has been successfully loaded.
    console.log("OnTheFly JavaScript API loaded successfully.");

    // Hide the error view in case it was visible.
    $loading_error_container.hide();
}
```

Refresh the browser to see the results.

Well this is kind of embarrassing... That did't work as expected but at least
we gracefully handled this error. OnTheFly JavaScript API is wrapped in the
__OTFAPI__ namespace. When ever the loading of the API fails for some reason
the OTFAPI.error object provides details of the error.

Let's edit the `<project root>/routes/index.js` file to implement the
transaction ID generation and add the transaction ID and the product ID to the
API loading URL.

At the bottom of the file we have a following TODO:

``` JavaScript
/**
 *
 * TODO: Add POST handler 'transaction_details' for fetching transaction
 * TODO: details from reporting API.
 *
 */
 ```

Let's add a following method there.

``` JavaScript
/**
 * Generate transaction ID to allow loading OnTheFly services
 * from Piceasoft backend.
 *
 * @param productID
 * @returns {Promise<*>}
 */
async function createValidationTransactionID(productID) {
    // Validation API credentials
    let clientID = config.VALIDATION_API_ID;
    let privateKey = config.VALIDATION_API_KEY;

    // Validation API request body
    let body = JSON.stringify({
        product_id: productID
    });

    // Signature for validation API request
    let signature = crypto.createHash('sha256').update(privateKey + clientID + body).digest('hex');

    // Request
    let request = {
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
        response = await fetch(config.VALIDATION_API_URL + 'create_transaction_id', request);
    } catch (fetchError) {
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
```

In this method we sending a request to validation API __create_transaction_id__
POST end point. The API is protected and we need to provide two custom signature
headers for the request.

- __X-Piceasoft-Client-Id__ (VALIDATION_API_ID in server configuration)
- __X-Piceasoft-Signature__ (SHA256 from VALIDATION_API_KEY, VALIDATION_API_ID and request data)

After the request we are handling possible errors and if everything went well we
will get our transaction ID as a response. We can now use this transaction ID
to load the OnTheFly JavaScript API. The transaction ID is single use and expire
after certain time has passed so we need to generate new transaction ID each
time the OnTheFly JavaScript API is loaded.

Now that we have our transaction ID ready for us we can proceed to pass this
information from our back-end to the web application.

From our main router file `<project root>/routes/index.js` find the
`GET /verify` handler and the following TODO comment:

`// TODO: Generate transaction ID to load OnTheFly JavaScript API.`

At the moment we are rendering the `verify.ejs` template to the HTML and we
return this back to the browser. For the EJS template engine we provide some
data to render into the template.

``` JavaScript
res.render('verify', {
    title               : 'Acme - OnTheFly Verify',
    onthefly_js_api_url : OTF_JS_API_URL,
    navbarConfig        : {
        activeItem : "verify"
    }
});
```

We are interested to add the required product ID and transaction ID to the
OTF_JS_API_URL that we are rendering to the EJS template.

Let's first use the method `createValidationTransactionID` that we wrote earlier
to generate the needed transaction ID. Wrap the render method call with the
following code:

``` JavaScript
// Generate transaction ID against validation API to allow
// loading of OnTheFly Trade-In iframe.
createValidationTransactionID(config.JS_API_PRODUCT_ID)
    .then((transactionID) => {

        // Use the generated transaction ID

    })
    .catch(error => next(error));
```

Now we either have our transaction ID or we catch the error and forward it to
our application error handler.

Next we need to add the transaction ID, product ID and couple of other URL
parameters to the OnTheFly JavaScript API loading URL. Replace the following
line:

`const OTF_JS_API_URL = config.JS_API_URL;`

with the following code:

``` JavaScript
// Construct query parameters for loading OnTheFly JavaScript API
const queryParameters = {
    product_id: config.JS_API_PRODUCT_ID,
    transaction_id: transactionID,
    features: 'verify',
    user_id: config.USER_ID,
    user_name: config.USER_NAME
};

// Construct OnTheFly JavaScript API download URL
const OTF_JS_API_URL = config.JS_API_URL + "?" + querystring.stringify(queryParameters);
```

With this code we provide the generated transaction ID and product ID
(JS_API_PRODUCT_ID from server configuration) to the API loading URL.
Additionally we tell that we want load the API with __Verify__ feature and we
provide the user ID and user name who is going to do the Verify.

Now let's restart the server and refresh our browser to see if the error view
disappeared.

Now that we have successfully loaded the OnTheFly JavaScript API into our web
application it is time to actually do something with it.

### Connecting device to OnTheFly session

First thing we need to do is to connect the API and PiceaOne application into
the OnTheFly session. To do this we are going to use a QR code. When the API
is loaded it informs us that the link to connect a mobile device to the session
has been created. Add the following method to the else clause so that we know
the API has been successfully loaded before we use it.

``` JavaScript
/**
 * OnTheFly JavaScript API calls this callback when the API has been
 * successfully loaded and link to connect the mobile device to the
 * session has been created.
 */
OTFAPI.onLinkCreated(function(link) {
    console.log("OnTheFly JavaScript API created the link to connect the mobile device.");

    // Embed the generated link to QR code to make it easily
    // accessible for mobile devices.
    // API: https://api.piceasoft.com/otf/v1/qrcode?data=
    let $qrCodeImage = $('#qr-code-image');

    $qrCodeImage.attr("src", "https://api.piceasoft.com/otf/v1/qrcode?data=" + link);
    $qrCodeImage.attr("alt", link);

    // Display the QR code connect container
    let $qrCodeConnectContainer = $('#qr-code-connect-container');
    $qrCodeConnectContainer.show();
});
```

So what we do here is that we embed the generated link into a QR code and
display it in our web application. Now refresh the browser and make sure that
the QR code becomes visible in the integration container.

Now we can try to scan this QR code with our mobile device. Most iOS devices
can scan the QR code with native camera application. For Android, we suggest
that you go to the Google Play Store and install PiceaOne application to scan
the QR code. In case the PiceaOne app was now installed the QR code takes you to
the Google Play Store or Apple App Store to install the app. Once the app is
installed or the QR code is read with the PiceaOne app it connects to the
OnTheFly session.

Next we want to know when the mobile device connects to the session so that we
can interact with it. Add the following code after the `onLinkCreated` method.

``` JavaScript
/**
 * OnTheFly JavaScript API calls this callback when the API has
 * detected that mobile device has joined (scanned the QR code) to
 * the OnTheFly session.
 */
OTFAPI.onMobileDeviceConnected(function() {
    console.log("Mobile device connected to OnTheFly session.");

    // Hide the QR code connect container
    let $qrCodeConnectContainer = $('#qr-code-connect-container');
    $qrCodeConnectContainer.hide();

    // Display the main application container
    let $mainApplicationContainer = $('#main-application-container');
    $mainApplicationContainer.show();
});

/**
 * OnTheFly JavaScript API calls this callback when the API has
 * detected that mobile device has disconnected from the OnTheFly
 * session.
 *
 * This can happen when the end user stops the OnTheFly session or
 * closes the PiceaOne app.
 */
OTFAPI.onMobileDeviceDisconnected(function() {
    console.log("Mobile device disconnected from OnTheFly session.");
});
```

The API calls these method when the PiceaOne application connects to the session
by handling the link we generated in previous stage. From there we are only
hiding the QR code container and bringing our main application container
visible. On the other hand we also want to know if we lose the connection the
device. This is why we implement the `onMobileDeviceDisconnected` method as
well.

We have now successfully connected the API with the mobile device and
we are ready to interact with it! 🎉

The first thing we want to do is to know which device connected to the session.
Let's implement another API method and define a new variable to track if the
device has yet been identified or not:

``` JavaScript
let mDeviceIdentified = false;

/**
 * OnTheFly JavaScript API calls this callback when the API has
 * identified the device connected to the session. Parameter device
 * includes the detailed information about the device.
 */
OTFAPI.onDeviceIdentified(function(device) {
    console.log("Device identified by OnTheFly JavaScript API.");
    console.log(device);

    // Display the device information container
    if(!mDeviceIdentified) {
        let $deviceInformationContainer = $('#device-information-container');
        $deviceInformationContainer.show();

        mDeviceIdentified = true;
    }

    // Set device information to device information table
    let deviceManufacturer = $('#device-manufacturer');
    let deviceModel = $('#device-model');
    let deviceColor = $('#device-color');
    let deviceSoftwareVersion = $('#device-software-version');
    let deviceCapacity = $('#device-capacity');
    let deviceModelCode = $('#device-model-code');
    let deviceIMEI = $('#device-imei');
    let deviceSerialNumber = $('#device-serial-number');

    deviceManufacturer.html(device.manufacturer);
    deviceModel.html(device.model_name);
    deviceColor.html(device.color);
    deviceSoftwareVersion.html(device.sw_version);
    deviceCapacity.html(device.storage_str);
    deviceModelCode.html(device.model_code);
    deviceIMEI.html(device.imei);
    deviceSerialNumber.html(device.serial_number);

    // Set device image
    let deviceImage = $('#device-image');
    deviceImage.attr('src', device.device_img);
});
```

API calls this method once the PiceaOne app identifies the device it is running
on. Inside this method we will parse the device information received from the
API and add it to our HTML so that it becomes visible from the web application.

No we can refresh our browser and scan the QR code with the mobile device.
We have completed the device identification part as well! 🎉

### Performing Verify checks for the device

Now that we know how to connect the mobile device to the OnTheFly session and
how to identify it we want to run some Verify checks for it. Let's start by
making sure that we have the Verify feature available in the API. Add the
following code to after the `onDeviceIdentified` method:

``` JavaScript
/**
 * Check that loaded OnTheFly JavaScript API contains the
 * Verify feature.
 */
if(typeof OTFAPI.verify === "undefined") {
    // OnTheFly JavaScript API has been loaded but Verify feature is
    // not available.
    console.log("OnTheFly JavaScript API is loaded but Verify feature is not available.");

    // Show the error view as OnTheFly JavaScript API does not
    // include Verify feature that we would like to use.
    $loading_error_container.show();
} else {
    // From here we are safe to use OnTheFly JavaScript API
    // Verify features.
}
```

Verify functionality of the API is wrapped in OTFAPI.verify. We can check
that the verify feature is available and show the error view again if something
is not right.

Tip: try to remove the the verify feature from the `index.js GET /verify`
handler `queryParameters` JSON.

Let's run some Verify checks for the device next. To do this we will first
create a couple of helper methods for us to run the checks. Add the following
method to the else clause so that we know the Verify feature of the API is
available for us.

``` JavaScript
/**
 * Constructs a Verify operation configuration object based
 * on parameter checks and sends the startOperation
 * command to the connected device.
 */
function runVerifyChecks(checks) {
    // Create array of Verify checks to be added to the
    // operation configuration that we are going to send to the
    // device to handle.
    let configurationVerifyChecks = [];

    // Add check from parameters to the configuration with
    // empty options.
    for(let check of checks) {
        configurationVerifyChecks.push({
            id: check,
            options: {}
        });
    }

    let verifyOperationConfiguration = {
        checks: configurationVerifyChecks
    };

    OTFAPI.verify.startOperation(verifyOperationConfiguration);
}
```

This method takes an array of Verify checks to perform as an argument and
constructs a Verify operation configuration object that we will provide to the
API `verify.startOperation` method as an argument.

Next we need to call this method from somewhere so let's add a couple of button
handlers to our application so that we know when the user tells us to run
something. Add the following code to our application.

``` JavaScript
// Individual Verify check buttons
let $verifyCheckSecurityLockButton = $('#verify-check-security-lock-button');
let $verifyCheckSimCardButton = $('#verify-check-sim-card-button');
let $verifyCheckFindMyiPhoneButton = $('#verify-check-find-my-iphone-button');
let $verifyCheckJailbreakButton = $('#verify-check-jailbreak-button');

// Check all Verify button
let $startVerifyButton = $('#start-verify-btn');

/**
 * Security Lock Verify check button handler.
 */
$verifyCheckSecurityLockButton.click(function() {
    console.log("Button for checking security lock status clicked.");
    runVerifyChecks([OTFAPI.verify.check.VerifyCheck_LockCode]);
});

/**
 * SIM Card Verify check button handler.
 */
$verifyCheckSimCardButton.click(function() {
    console.log("Button for checking SIM card status clicked.");
    runVerifyChecks([OTFAPI.verify.check.VerifyCheck_SIMCard]);
});

/**
 * Find My iPhone Verify check button handler.
 */
$verifyCheckFindMyiPhoneButton.click(function() {
    console.log("Button for checking Find My iPhone status clicked.");
    runVerifyChecks([OTFAPI.verify.check.VerifyCheck_FindMyiPhone]);
});

/**
 * Jailbreak Verify check button handler.
 */
$verifyCheckJailbreakButton.click(function() {
    console.log("Button for checking jailbreak status clicked.");
    runVerifyChecks([OTFAPI.verify.check.VerifyCheck_RootedDevice]);
});

/**
 * Check all Verify checks button handler.
 */
$startVerifyButton.click(function() {
    console.log("Button for running all Verify checks clicked.");
    runVerifyChecks([
        OTFAPI.verify.check.VerifyCheck_LockCode,
        OTFAPI.verify.check.VerifyCheck_SIMCard,
        OTFAPI.verify.check.VerifyCheck_FindMyiPhone,
        OTFAPI.verify.check.VerifyCheck_RootedDevice
    ]);
});
```

This code captures the button events for our application and calls the
`runVerifyChecks` method that we implemented earlier.

Now let's refresh the browser and scan the QR code with our mobile device.
After we proceed to the Verify view we should be able to run the Verify checks
on the device.

Cool! We can now perform Verify operation on the device using the OnTheFly
JavaScript API 🎉

Next we are interested to get these Verify results back from the device. We need
to know what the result of the checks were right? Let's add the following code
to our application.

``` JavaScript
/**
 * OnTheFly JavaScript API calls this callback when the Verify
 * check has been started in the device.
 *
 * Parameter checkStatus includes the information about started
 * Verify check.
 */
OTFAPI.verify.onCheckStarted(function(checkStatus) {
    console.log("Verify check (" + checkStatus.check_id + ") started.");
    updateCheckProgress(checkStatus);
});

/**
 * OnTheFly JavaScript API calls this callback when the Verify
 * check has been completed in the device.
 *
 * Parameter checkStatus includes the information about
 * completed Verify check.
 */
OTFAPI.verify.onCheckFinished(function(checkStatus) {
    console.log("Verify check (" + checkStatus.check_id + ") finished with status (" + checkStatus.status + ").");
    updateCheckStatus(checkStatus);
});
```

The API calls these methods as the Verify checks start and complete on the
device. In these callbacks we can access the Verify check status object.
This object give us information about the Verify check. The code above uses
a couple of other helper methods that update our UI. Let's add those as well.

``` JavaScript
// Verify component elements
let $verifyCheckSecurityLockCard = $('#verify-check-security-lock-card');
let $verifyCheckSimCardCard = $('#verify-check-sim-card-card');
let $verifyCheckFindMyiPhoneCard = $('#verify-check-find-my-iphone-card');
let $verifyCheckJailbreakCard = $('#verify-check-jailbreak-card');

/**
 * Updates the Verify check card on UI based on checkStatus
 * parameter to show progress for ongoing Verify check.
 */
function updateCheckProgress(checkStatus) {
    let check = checkStatus.check_id;
    let $checkCard = getVerifyCheckCard(check);

    $checkCard.addClass("card-verify-check-ongoing");
}

/**
 * Updates the Verify check card on UI based on checkStatus
 * parameter to show corresponding Verify check status.
 */
function updateCheckStatus(checkStatus) {
    let check = checkStatus.check_id;
    let checkResult = checkStatus.status;

    let $checkCard = getVerifyCheckCard(check);

    if($checkCard) {
        $checkCard.removeClass("card-verify-check-ongoing");
        $checkCard.removeClass("card-verify-nok");
        $checkCard.removeClass("card-verify-ok");

        // Update card status with new one
        if(checkResult === OTFAPI.verify.checkStatus.VerifyStatus_Passed) {
            $checkCard.addClass("card-verify-ok");
        } else {
            $checkCard.addClass("card-verify-nok");
        }
    }
}

/**
 * Returns the correct Verify check card based on check
 * parameter.
 */
function getVerifyCheckCard(check) {
    switch(check) {
        case OTFAPI.verify.check.VerifyCheck_LockCode: {
            return $verifyCheckSecurityLockCard;
        }
        case OTFAPI.verify.check.VerifyCheck_SIMCard: {
            return $verifyCheckSimCardCard;
        }
        case OTFAPI.verify.check.VerifyCheck_FindMyiPhone: {
            return $verifyCheckFindMyiPhoneCard;
        }
        case OTFAPI.verify.check.VerifyCheck_RootedDevice: {
            return $verifyCheckJailbreakCard;
        }
        default: {
            return null;
        }
    }
}
```

These methods only update the check status in our UI and we won't go through
these in more details. The Verify check result can be accessed from
`checkStatus.status` and the possible status values are documented in the
OnTheFly JavaScript API documentation. For this exercise we only use OK
(OTFAPI.verify.checkStatus.VerifyStatus_Passed) and Not OK
(!OTFAPI.verify.checkStatus.VerifyStatus_Passed) status mappings to keep things
simple.

The last thing to do in this exercise is to generate a PDF report for the
operations we completed for the device. API provides us a method just for
that. Add the following code to our application.

``` JavaScript
/**
 * Button handler for getting PDF report for the session.
 *
 * Download PDF report for the session.
 */
$("#pdf-report-btn").click(function() {
    OTFAPI.getReportPDF();
});
```

Thats it! The API does all the hard lifting for us downloads the
PDF report for the OnTheFly session.

The Verify integration exercise is is now complete. Feel free to
extend this application with your own cool ideas using the
OnTheFly JavaScript API.

## Diagnostics OnTheFly integration

TBAL

``` JavaScript
let mDeviceIdentified = false;

let $loading_error_container    = $('#loading-error-container');
let $loading_error_status       = $('#loading-error-status');
let $loading_error_message      = $('#loading-error-message');

/**
 * Check that OTFAPI is defined after document loading has finished.
 */
if(typeof OTFAPI.error !== "undefined") {
    // OnTheFly JavaScript API loading has failed.
    console.log("OnTheFly JavaScript API loading failed.");

    // Set loading error details
    $loading_error_status.html(OTFAPI.error.status);
    $loading_error_message.html(OTFAPI.error.message);

    // Show the error view as OnTheFly JavaScript loading has failed.
    $loading_error_container.show();
} else {
    // OnTheFly JavaScript API has been successfully loaded.
    console.log("OnTheFly JavaScript API loaded successfully.");

    // Hide the error view in case it was visible.
    $loading_error_container.hide();

    /**
     * OnTheFly JavaScript API calls this callback when the API has been
     * successfully loaded and link to connect the mobile device to the
     * session has been created.
     */
    OTFAPI.onLinkCreated(function(link) {
        console.log("OnTheFly JavaScript API created the link to connect the mobile device.");

        // Embed the generated link to QR code to make it easily accessible for mobile devices.
        // API: https://api.piceasoft.com/otf/v1/qrcode?data=
        let $qrCodeImage = $('#qr-code-image');

        $qrCodeImage.attr("src", "https://api.piceasoft.com/otf/v1/qrcode?data=" + link);
        $qrCodeImage.attr("alt", link);

        // Display the QR code connect container
        let $qrCodeConnectContainer = $('#qr-code-connect-container');
        $qrCodeConnectContainer.show();
    });

    /**
     * OnTheFly JavaScript API calls this callback when the API has
     * detected that mobile device has joined (scanned the QR code) to
     * the OnTheFly session.
     */
    OTFAPI.onMobileDeviceConnected(function() {
        console.log("Mobile device connected to OnTheFly session.");

        // Hide the QR code connect container
        let $qrCodeConnectContainer = $('#qr-code-connect-container');
        $qrCodeConnectContainer.hide();

        // Display the main application container
        let $mainApplicationContainer = $('#main-application-container');
        $mainApplicationContainer.show();
    });

    /**
     * OnTheFly JavaScript API calls this callback when the API has
     * detected that mobile device has disconnected from the OnTheFly
     * session.
     *
     * This can happen when the end user stops the OnTheFly session or
     * closes the PiceaOne app.
     */
    OTFAPI.onMobileDeviceDisconnected(function() {
        console.log("Mobile device disconnected from OnTheFly session.");
    });

    /**
     * OnTheFly JavaScript API calls this callback when the API has
     * identified the device connected to the session. Parameter device
     * includes the detailed information about the device.
     */
    OTFAPI.onDeviceIdentified(function(device) {
        console.log("Device identified by OnTheFly JavaScript API.");
        console.log(device);

        // Display the device information container
        if(!mDeviceIdentified) {
            let $deviceInformationContainer = $('#device-information-container');
            $deviceInformationContainer.show();

            mDeviceIdentified = true;
        }

        // Set device information to device information table
        let deviceManufacturer      = $('#device-manufacturer');
        let deviceModel             = $('#device-model');
        let deviceColor             = $('#device-color');
        let deviceSoftwareVersion   = $('#device-software-version');
        let deviceCapacity          = $('#device-capacity');
        let deviceModelCode         = $('#device-model-code');
        let deviceIMEI              = $('#device-imei');
        let deviceSerialNumber      = $('#device-serial-number');

        deviceManufacturer          .html(device.manufacturer);
        deviceModel                 .html(device.model_name);
        deviceColor                 .html(device.color);
        deviceSoftwareVersion       .html(device.sw_version);
        deviceCapacity              .html(device.storage_str);
        deviceModelCode             .html(device.model_code);
        deviceIMEI                  .html(device.imei);
        deviceSerialNumber          .html(device.serial_number);

        // Set device image
        let deviceImage = $('#device-image');
        deviceImage.attr('src', device.device_img);
    });

    /*******************************************************************
     * OnTheFly JavaScript API Diagnostics integration
     ******************************************************************/

    /**
     * Check that loaded OnTheFly JavaScript API contains the
     * Diagnostics feature.
     */
    if(typeof OTFAPI.diagnostics === "undefined") {
        // OnTheFly JavaScript API has been loaded but Diagnostics
        // feature is not available.
        console.log("OnTheFly JavaScript API is loaded but Diagnostics feature is not available.");

        // Show the error view as OnTheFly JavaScript API does not
        // include Diagnostics feature that we would like to use.
        $loading_error_container.show();
    } else {
        // From here we are safe to use OnTheFly JavaScript API
        // Diagnostics features.

        // Variables for calculating Diagnostics progress.
        let mDiagnosticsTestCount           = 15;
        let mExecutedDiagnosticsTestCount   = 0;

        // Start Diagnostics button
        let $startDiagnosticsButton = $('#start-diagnostics-btn');

        /**
         * Check all Verify checks button handler.
         */
        $startDiagnosticsButton.click(function() {
            console.log("Button for checking jailbreak status clicked.");

            // Reset executed Diagnostics test count.
            mExecutedDiagnosticsTestCount = 0;

            // Set Diagnostics test count in operation.
            mDiagnosticsTestCount = 15;

            // Construct Diagnostics operation configuration.
            let diagnosticsOperationConfig = {
                sets : [
                    {
                        id : OTFAPI.diagnostics.testSet.TS_SOFTWARE,
                        options : {
                            cases : [
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_SOFTWARE_UPDATES,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_STORAGE,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_RAM,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_UPTIME,
                                    options : {}
                                }
                            ]
                        }
                    },
                    {
                        id : OTFAPI.diagnostics.testSet.TS_DISPLAY,
                        options : {
                            cases : [
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_DISPLAY_MULTITOUCH,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_DISPLAY_TOUCH,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_DISPLAY_FORCE_TOUCH,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_DISPLAY_PINCH,
                                    options : {}
                                }
                            ]
                        }
                    },
                    {
                        id : OTFAPI.diagnostics.testSet.TS_HW_BUTTONS,
                        options : {
                            cases : [
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_HWBTN_VOLUME_UP,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_HWBTN_VOLUME_DOWN,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_HWBTN_MUTE,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_HWBTN_POWER,
                                    options : {}
                                }
                            ]
                        }
                    },
                    {
                        id : OTFAPI.diagnostics.testSet.TS_SENSORS,
                        options : {
                            cases : [
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_ACCELEROMETER,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_GYROSCOPE,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_PROXIMITY_SENSOR,
                                    options : {}
                                },
                                {
                                    id : OTFAPI.diagnostics.testCase.TC_FACE_ID,
                                    options : {}
                                }
                            ]
                        }
                    }
                ]
            };

            // Start Diagnostics operation in connected device with
            // OnTheFly JavaScript API.
            OTFAPI.diagnostics.startOperation(diagnosticsOperationConfig);
        });

        /**
         * OnTheFly JavaScript API calls this callback when the
         * Diagnostics operation has been started in the device.
         *
         * Parameter operationStatus includes the information about
         * the started Diagnostics operation.
         */
        OTFAPI.diagnostics.onOperationStarted(function(operationStatus) {
            console.log("Diagnostics operation (" + operationStatus.uid + ") started.");
        });

        /**
         * OnTheFly JavaScript API calls this callback when the
         * Diagnostics operation has been completed in the device.
         *
         * Parameter operationStatus includes the information about
         * the completed Diagnostics operation.
         */
        OTFAPI.diagnostics.onOperationFinished(function(operationStatus) {
            console.log("Diagnostics operation (" + operationStatus.uid + ") finished.");
        });

        /**
         * OnTheFly JavaScript API calls this callback when the
         * Diagnostics test set has been started in the device.
         *
         * Parameter testSetStatus includes the information about
         * the started Diagnostics test set.
         */
        OTFAPI.diagnostics.onTestSetStarted(function(testSetStatus) {
            console.log("Diagnostics test set (" + testSetStatus.set_id + ") started.");
        });

        /**
         * OnTheFly JavaScript API calls this callback when the
         * Diagnostics test set has progressed in the device.
         *
         * Parameter testSetStatus includes the information about
         * the Diagnostics test set.
         */
        OTFAPI.diagnostics.onTestSetProgress(function(testSetStatus) {
            console.log("Diagnostics test set (" + testSetStatus.set_id + ") progress.");
        });

        /**
         * OnTheFly JavaScript API calls this callback when the
         * Diagnostics test set has been completed in the device.
         *
         * Parameter testSetStatus includes the information about
         * the completed Diagnostics test set.
         */
        OTFAPI.diagnostics.onTestSetFinished(function(testSetStatus) {
            console.log("Diagnostics test set (" + testSetStatus.set_id + ") finished.");
        });

        /**
         * OnTheFly JavaScript API calls this callback when the
         * Diagnostics test case has been started in the device.
         *
         * Parameter testCaseStatus includes the information about
         * the started Diagnostics test case.
         */
        OTFAPI.diagnostics.onTestCaseStarted(function(testCaseStatus) {
            console.log("Diagnostics test case (" + testCaseStatus.case_id + ") started.");
            startTestCaseProgress(testCaseStatus.case_id);
        });

        /**
         * OnTheFly JavaScript API calls this callback when the
         * Diagnostics test case has progressed in the device.
         *
         * Parameter testCaseStatus includes the information about
         * the Diagnostics test case.
         */
        OTFAPI.diagnostics.onTestCaseProgress(function(testCaseStatus) {
            console.log("Diagnostics test case (" + testCaseStatus.case_id + ") progress.");
        });

        /**
         * OnTheFly JavaScript API calls this callback when the
         * Diagnostics test case has been completed in the device.
         *
         * Parameter testCaseStatus includes the information about
         * the completed Diagnostics test case.
         */
        OTFAPI.diagnostics.onTestCaseFinished(function(testCaseStatus) {
            console.log("Diagnostics test case (" + testCaseStatus.case_id + ") finished.");

            // Hide test case progress indicator.
            stopTestCaseProgress(testCaseStatus.case_id);

            // Set test case result to UI.
            setTestCaseResult(testCaseStatus.case_id, testCaseStatus.status);

            // Update executed test case count.
            mExecutedDiagnosticsTestCount += 1;

            // Update Diagnostics operation progress.
            let progress = (mExecutedDiagnosticsTestCount / mDiagnosticsTestCount) * 100;
            updateDiagnosticsOperationProgress(progress);
        });

        /**
         * Shows progress indicator for test case provided as parameter.
         *
         * @parameter testCase
         * Test case ID which progress indicator will be shown.
         * Possible values are defined in OTFAPI.diagnostics.testCase.
         */
        function startTestCaseProgress(testCase) {
            // Find the correct progress spinner and result icon
            // element from the DOM
            let $progressSpinner    = $('#test-case-progress-spinner-' + testCase);
            let $resultIcon         = $('#test-case-result-icon-' + testCase);

            // Adjust elements visibility accordingly
            $resultIcon.hide();
            $progressSpinner.show();
        }

        /**
         * Hides progress indicator for test case.
         *
         * @parameter testCase
         * Test case ID which progress indicator will be hidden.
         * Possible values are defined in OTFAPI.diagnostics.testCase.
         */
        function stopTestCaseProgress(testCase) {
            // Find the correct progress spinner and result icon
            // element from the DOM
            let $progressSpinner    = $('#test-case-progress-spinner-' + testCase);
            let $resultIcon         = $('#test-case-result-icon-' + testCase);

            // Adjust elements visibility accordingly
            $progressSpinner.hide();
            $resultIcon.show();
        }

        /**
         * Updated Diagnostics operation progress bar.
         *
         * @Parameter progress
         * Progress of the operation. Range 0 - 100.
         */
        function updateDiagnosticsOperationProgress(progress) {
            // Update diagnostics operation progress:
            let $diagnosticsProgressBar = $('#diagnostics-progress-bar');

            $diagnosticsProgressBar.attr("aria-valuenow", progress);
            $diagnosticsProgressBar.css('width', progress + '%');
        }

        /**
         * Sets result provided as second parameter for test case
         * provided as first parameter.
         *
         * @parameter testCase
         * Test case ID which result will be set. Possible values are
         * defined in OTFAPI.diagnostics.testCase.
         *
         * @parameter result
         * Result of the test. Possible result values are defined in
         * OTFAPI.diagnostics.testCaseResult.
         */
        function setTestCaseResult(testCase, result) {
            // Find the correct result icon element from the DOM
            let $resultIcon = $('#test-case-result-icon-' + testCase);

            // Clear possible previous state from the result icon
            $resultIcon.removeClass("text-success");
            $resultIcon.removeClass("text-danger");
            $resultIcon.html("");

            // Update result element status according to the result
            // parameter.
            if(result === OTFAPI.diagnostics.testCaseResult.TCR_PASSED) {
                $resultIcon.html("check");
                $resultIcon.addClass("text-success");
            } else {
                $resultIcon.html("close");
                $resultIcon.addClass("text-danger");
            }

            // Show the result element if if was hidden
            $resultIcon.show();
        }
    }
}
```

## Trade-In OnTheFly integration

TBAL

``` HTML
<div id="tradein-iframe-container" class="w-100" style="display: none;">
    <iframe id="tradein-iframe" width="100%" scrolling="no" frameborder="none" src="<%=onthefly_trade_in_iframe_url%>"></iframe>
</div>
```

``` JavaScript
/**
 *  Initialize iframe resizer library
 */
iFrameResize({}, '#tradein-iframe');

/**
 * Document scrolling handler. Scrolls to the integration container
 * when the Start >> button is clicked.
 */
$("#start-btn").click(function() {
    let offset = -96;

    $('html, body').animate({
        scrollTop: $("#integration-container").offset().top + offset
    }, 800);
});

let eventMethod     = window.addEventListener ? "addEventListener" : "attachEvent";
let eventer         = window[eventMethod];
let messageEvent    = eventMethod === "attachEvent" ? "onmessage" : "message";
let eventOrigin     = 'https://services.piceasoft.com';

let $loading_error_container  = $('#loading-error-container');
let $loading_error_status     = $('#loading-error-status');
let $loading_error_message    = $('#loading-error-message');

let $iframe_container         = $("#tradein-iframe-container");
let $offer_accepted_container = $("#tradein-offer-accepted-container");
let $offer_rejected_container = $("#tradein-offer-rejected-container");

function messageReceiver(event) {
    // Ignore messages from other domains unless you are specifically
    // waiting for them
    if(event.origin !== eventOrigin) {
        return;
    }

    let message = event.data;

    // Event for accepted Trade-In offer
    if(message.type === 'onDealAccepted') {
        console.log("Trade-In offer was accepted.");

        $iframe_container.hide();
        $offer_accepted_container.show();
        $offer_rejected_container.hide();
    }

    // Event for rejected Trade-In offer
    if(message.type === 'onDealRejected') {
        console.log("Trade-In offer was rejected.");

        $iframe_container.hide();
        $offer_accepted_container.hide();
        $offer_rejected_container.show();
    }

    // Event for error during Trade-In workflow
    if(message.type === 'onError') {
        let error = message.error;

        // Show the error view as OnTheFly Trade-In iframe loading has failed.
        $iframe_container.hide();

        $loading_error_status.html(error.status);
        $loading_error_message.html(error.message);

        $loading_error_container.show();
    }
}
eventer(messageEvent, messageReceiver, false);
```

## Reporting API integration

TBAL
