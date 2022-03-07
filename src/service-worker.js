// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

// chrome.tabs.onUpdated.addListener(function (tabId , info) {
//     if (info.status === 'complete') {
//         console.log(tabId, info);
//         chrome.tabs.get(tabId, (tab) => {
//             // first, do we have this media.
//             checkMedia(tab.url)
//             console.log(tab);
//             chrome.tabs.sendMessage(tabId, {
//                 url: tab.url,
//                 host: (new URL(tab.url)).host,
//                 status: 'has media, etc...'
//             });
//         })
//     }
// });

// chrome.action.onClicked.addListener(function(tab) { alert('icon clicked')});

chrome.runtime.onInstalled.addListener((reason) => {
    if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({
            url: 'onboarding.html'
        });
    }
});

// only on startup?
// chrome.action.setBadgeText({"text": '-'} );
async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

// chrome.tabs.onActivated.addListener(activeInfo => move(activeInfo));

async function move(activeInfo) {
    try {
        console.log('check media for ' + URL(activeInfo.url).host)

        await chrome.tabs.move(activeInfo.tabId, {index: 0});
        console.log('Success.');
    } catch (error) {
        if (error == 'Error: Tabs cannot be edited right now (user may be dragging a tab).') {
            setTimeout(() => move(activeInfo), 50);
        }
    }
}

// was onClicked.
chrome.action.onClicked.addListener( (tab) => {
    // Send a message to the active tab
    console.log('tab clicked?', tab);

    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var activeTab = tabs[0];
        // chrome.tabs.sendMessage(activeTab.id, {"code": "clicked_browser_action"});
    });
});

// function checkMedia(url) {
//     let urlData = new URL(url);
//     console.log(urlData, urlData.host);
// }
//

let email = '';
chrome.identity.getProfileUserInfo( (userInfo) => {
    console.log(userInfo);
    email = userInfo.email;
    /* Use userInfo.email, or better (for privacy) userInfo.id
       They will be empty if user is not signed in in Chrome */
});

chrome.runtime.onMessage.addListener(
(message, sender, sendResponse) => {
    console.log(sender.tab ?
        "message from a content script (tab):" + sender.tab.url :
        "message from the extension", message);



    if (sender.tab) {
        console.log(`background received a message from tab ${sender.tab.id} (${sender.tab.url} is now loaded.`);
        getMediaData(sender.tab.url, sender.tab.id, message.html, (response) => {
            // since we're in a tab, we can update here.
            sendResponse(response);
        });
    } else {

        console.log('background received a message from the extension, e.g. inject.js (not a tab)', message);
        console.assert(message.code, "Missing code in message");
        switch (message.code) {
            case 'check_media':
                // this is the cached media

                getMediaData(message.url, getCurrentTab().id, message.html, (mediaData) => {
                    sendResponse(mediaData);
                });
                break;
            default:
                console.error('code not handled: ' + message.code);
                sendResponse({'code': 'invalid_code'})
        }
    }
});


// async function getOptions()
// {
//     let options = {x:'x'};
//     await chrome.storage.sync.get({favoriteColor: 'cyan', hhUrl: 'someUrl'}, (result) => {
//         base = result.hhUrl;
//         options = result;
//         console.log('Value currently is ' + result.hhUrl, result);
//         return result;
//     });
//     return options;
//
// }
//example of using a message handler from the inject scripts
    async function getMediaData(newsUrl, tabId, html, sendResponse) {

        // need sync, not async
        // let options = await getOptions();
        // console.log(options);

        let base =  'https://hub.wip';
        console.log(base, storageCache);
        const myHeaders =
            {
                'x-plugin-auth-token': email,
                'Content-Type': 'application/json'
            };

        let url = base + '/plugin/check.json';
        // let url = 'https://127.0.0.1:8000/api2.0/tags/2.json';

        let bodyData = {
            html: html,
            url: newsUrl,
            email: email
        }

        const myRequest = new Request(url + '?' + new URLSearchParams({
            url: newsUrl,
            email: email,
        }), {
            method: 'POST',
                // agent: new HttpsProxyAgent('http://127.0.0.1:7080'),
                headers: myHeaders,
            body: JSON.stringify(bodyData),
                credentials: "include"
            }
        )

        console.log("Fetching " + myRequest.url, myHeaders, bodyData);


        fetch(myRequest, {
            // agent: new HttpsProxyAgent('http://127.0.0.1:7080'),
            headers: myHeaders,
            method: 'POST',
            body: JSON.stringify(bodyData),
            credentials: "include"
        })
            .then(
                 (response) => {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' +
                            response.status);
                        return;
                    }



                    // Examine the text in the response
                    response.json().then((data) => {
                        data.tabId = tabId; // send the media message only to this tab.
                        console.log(data);
                        // let msg = {
                        //     originalUrl: sender.tab.url,
                        //     color: '#AE00B1',
                        //     article: data.article,
                        //     media: data.media,
                        //     host: data.host,
                        //     html: data.html
                        // };
                        data.iframe_url = base + data.iframe_path;
                        data.host = new URL(newsUrl).host;
                        data.code = 'check_url_received';

                        let badgeColor = 'pink';
                        let badgeText = '*';
                        let text = '--';
                        if (data.media) {
                            // chrome.action.setPopup({popup: "/popup/popup.html", tabId: tabId});
                            let media = data.media;
                            text = media.marking;
                            chrome.action.setTitle({title: data.host + " IS in the database: " + media.marking, tabId: tabId});
                            switch (media.marking) {
                                case "active":
                                    badgeColor = "green";
                                    ;

                            }
                            chrome.action.setBadgeBackgroundColor({color: badgeColor, tabId: tabId});
                            chrome.action.setBadgeText({ "text": badgeText, "tabId": tabId });

                        } else {
                            text = 'NO';
                            // chrome.action.setPopup({popup: "/popup/no_media.html", tabId: tabId});
                            chrome.action.setTitle({title: data.host + " is NOT in the database", tabId: tabId});
                            chrome.action.setBadgeBackgroundColor({color: "red"});
                            chrome.action.setBadgeText({ "text": '!', "tabId": tabId });
                            chrome.action.setBadgeText({ "text": '', "tabId": tabId });
                        }

                        const canvas = new OffscreenCanvas(16, 16);
                        const context = canvas.getContext('2d');
                        // context.font = '12pt sans-serif';
                        context.textAlign = 'top';
                        // context.fillStyle = `hsl(${delta / 40}, 80%, 50%)`;

                        context.clearRect(0, 0, 16, 16);
                        context.fillStyle = 'lightGray'; // '#00FF00';  // Green
                        context.fillRect(0, 0, 16, 16);


                        context.fillStyle = "black"; //<======= and here
                        context.fillText(text, 0, 8);
                        const imageData = context.getImageData(0, 0, 16, 16);

                        chrome.action.setIcon({tabId: tabId, imageData: imageData}, () => { /* ... */ });


                        // now that the popup is set, send a message to the tab with the media and article data.
                        console.log('sending a ' + data.code + ' message', data, sendResponse);
                        if (tabId) {
                            chrome.tabs.sendMessage(tabId, data);
                        } else {
                            chrome.runtime.sendMessage(data);
                        }


                        // change the icon color if the media is / isn't in the database.
                        // chrome.tabs.sendMessage(sender.tab.id, data, (response) => {
                        //     sendResponse(response);
                        // });
                        // sendResponse(data); // ?
                        // chrome.pageAction.show(sender.tab.id);
                        // return;



                    });
                }
            )
            .catch(function (err) {
                console.log('Fetch Error :-S', err);
            });
        return true;
        // sendResponse(mediaData);
    }

// Where we will expose all the data we retrieve from storage.sync.
const storageCache = {};
// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = getAllStorageSyncData().then(items => {
    // Copy the data retrieved from storage into storageCache.
    Object.assign(storageCache, items);
    console.log("storage", items);
});

chrome.action.onClicked.addListener(async (tab) => {
    try {
        await initStorageCache;
    } catch (e) {
        // Handle error that occurred during storage initialization.
    }
    // Normal action handler logic.
});

// Reads all data out of storage.sync and exposes it via a promise.
//
// Note: Once the Storage API gains promise support, this function
// can be greatly simplified.
function getAllStorageSyncData() {
    // Immediately return a promise and start asynchronous work
    return new Promise((resolve, reject) => {
        // Asynchronously fetch all data from storage.sync.
        chrome.storage.sync.get(null, (items) => {
            // Pass any observed errors down the promise chain.
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            // Pass the data retrieved from storage down the promise chain.
            resolve(items);
        });
    });
}


