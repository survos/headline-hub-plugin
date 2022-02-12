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
        getMediaData(sender.tab.url, sender.tab.id, (response) => {
            // since we're in a tab, we can update here.
            sendResponse(response);
        });
    } else {

        console.log('background received a message from the extension (not a tab)', message);
        console.assert(message.code, "Missing code in message");
        switch (message.code) {
            case 'check_media':
                // this is the cached media

                getMediaData(message.url, getCurrentTab().id, (mediaData) => {
                    sendResponse(mediaData);
                });
                break;
            default:
                console.error('code not handled: ' + message.code);
                sendResponse({'code': 'invalid_code'})
        }
    }
});

//example of using a message handler from the inject scripts
    function getMediaData(newsUrl, tabId, sendResponse) {

        // const base = 'https://staging-5em2ouy-6qpek36k2ejf6.eu.s5y.io';
        const base = 'https://hub.wip';
        const myHeaders =
            {
                'x-plugin-auth-token': email,
                'Content-Type': 'application/json'
            };

        let url = base + '/plugin/check.json';
        // let url = 'https://127.0.0.1:8000/api2.0/tags/2.json';

        const myRequest = new Request(url + '?' + new URLSearchParams({
            url: newsUrl,
            email: email,
        }), {
                // agent: new HttpsProxyAgent('http://127.0.0.1:7080'),
                headers: myHeaders,
                credentials: "include"
            }
        )

        console.log("Fetching " + myRequest.url, myHeaders);


        fetch(myRequest, {
            // agent: new HttpsProxyAgent('http://127.0.0.1:7080'),
            headers: myHeaders,
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

                        console.log('sending a check_url_received message', data, sendResponse);

                        let badgeColor = 'pink';
                        let badgeText = '*';
                        let text = '--';
                        if (data.media) {
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
                            chrome.action.setTitle({title: data.host + " is NOT in the database", tabId: tabId});
                            chrome.action.setBadgeBackgroundColor({color: "yellow"});
                            chrome.action.setBadgeText({ "text": '-', "tabId": tabId });
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


                        chrome.runtime.sendMessage(data); // only if this is coming from the popup.


                        // change the icon color if the media is / isn't in the database.
                        // chrome.tabs.sendMessage(sender.tab.id, data, (response) => {
                        //     sendResponse(response);
                        // });
                        sendResponse(data);
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


