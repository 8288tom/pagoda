// Filter out all falsy values from an object.
function getValues(obj) {
    return Object.keys(obj).reduce((acc, key) => {
        if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
}


//Getting unique Scene Libraries out of a Storyboard document using regex to find all pal://xxxx/ occurences.
async function extractPalUrls(document) {
    const regex = /pal:\/\/(\d+)\//g;
    const palUrls = new Set();

    function traverse(obj) {
        if (typeof obj === 'string') {
            let match;
            while ((match = regex.exec(obj)) !== null) {
                palUrls.add(match[1]);
            }
        } else if (Array.isArray(obj)) {
            for (const item of obj) {
                traverse(item);
            }
        } else if (obj !== null && typeof obj === 'object') {
            for (const key in obj) {
                traverse(obj[key]);
            }
        }
    }
    traverse(document);
    return palUrls;
}

/**
 * 
 * @param {Boolean} success 
 * @param {String} message 
 * @param {JSON} data
 * @returns 
 */
function responseHandler(success, message, data) {
    return { success, message, data }
}


//promise.all result handler
function multipleResultHandler(results) {
    const successes = results.filter(result => result.success);
    const errors = results.filter(result => !result.success);
    const errorMessages = errors.map(error => error.message).join(', ');
    const successMessages = successes.map(success => success.message).join(', ');

    // errors
    if (errors.length > 0 && successes.length === 0) {
        if (errors.every((err) => err.message.includes("No changes written"))) {
            return { success: true, message: "No changes written" }
        }
        if (errors.some((err) => err.message.includes("No changes written"))) {
            return {
                success: true,
                message: `Partial update: ${(successMessages && errorMessages)
                    ? successMessages + '&' + errorMessages
                    : errorMessages}`
            }
        }
        return { success: false, message: `${errorMessages}` };
    }
    //errors and success 
    if (errors.length > 0 && successes.length > 0) {
        return { success: true, message: `${successMessages} & ${errorMessages}` };
    }
    //success
    if (successes.length > 0) {
        return { success: true, message: `${successMessages}` };
    }

    return { success: true, message: 'No updates performed' };
}


//Storyboard Mutation helper
function overwriteStoryboardDocKeyAndValues(collections, overwriteFields, storyboardID, accountId) {
    for (let i = 0; i < collections.length; i++) {
        if (collections[i] === 'storyboard_interactive_events') {
            overwriteFields['storyboard_interactive_events'] = {
                accountId: Number(accountId),
                storyboardId: storyboardID.toString(),
                document_key: `storyboard_interactive_events_${storyboardID}`,
                storyboardInteractiveEventsId: storyboardID.toString()
            }
        } else {
            overwriteFields[collections[i]] = {
                accountId: Number(accountId),
                storyboardId: storyboardID.toString(),
                document_key: `${collections[i]}_${storyboardID}`
            }
        }
    }
}

const makeId = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getCurrentDateFormat() {
    // Get the current datetime
    const currentDatetime = new Date();

    // Extract the components of the datetime
    const year = currentDatetime.getFullYear();
    const month = currentDatetime.getMonth() + 1; // Months are zero-based, so added 1
    const day = currentDatetime.getDate();
    const hour = currentDatetime.getHours();
    const minute = currentDatetime.getMinutes();
    const second = currentDatetime.getSeconds();

    // Create the datetime array
    const datetimeArray = [year, month, day, hour, minute, second];

    return {
        datetime: datetimeArray,
        timestamp: Math.floor(currentDatetime.getTime() / 1000),
    }
}

function buildNewPublicUrl(oldUrl, newKey) {
    let oldPublicUrl = oldUrl.split('/');
    oldPublicUrl[2] = newKey;
    return oldPublicUrl.join('/');
}

async function streamToBuffer(readStream) {
    const chunks = [];
    for await (const chunk of readStream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

module.exports = { getValues, extractPalUrls, multipleResultHandler, overwriteStoryboardDocKeyAndValues, makeId, responseHandler, getCurrentDateFormat, buildNewPublicUrl, streamToBuffer }