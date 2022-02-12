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

chrome.action.setBadgeText({"text": 'bg'} );

chrome.action.onClicked.addListener( (tab) => {
    // Send a message to the active tab
    console.log('tab clicked?', tab);
    chrome.action.setBadgeText({ details: {"text": tab.id} });
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

// chrome.runtime.onMessage.addListener(
//     function(message, sender, sendResponse) {
//         console.assert(message.code, "Missing code in message");
//         if (message.code  === "check_media") {
//             //  To do something
//             console.log(message, sender);
//         }
//     }
// );

chrome.runtime.onMessage.addListener(
(message, sender, sendResponse) => {
    console.log(sender.tab ?
        "message from a content script (tab):" + sender.tab.url :
        "message from the extension", message);

    if (sender.tab) {
        console.log(`background received a message from tab ${sender.tab.id} (${sender.tab.url} is now loaded.`);
        getMediaData(sender.tab.url, sender, (response) => sendResponse(response));
    } else {
        console.assert(message.code, "Missing code in message");
        switch (message.code) {
            case 'check_media':
                // this is the cached media
                getMediaData(message.url, sender, (mediaData) => {
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
    function getMediaData(newsUrl, sender, sendResponse) {

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

        // const myRequest = new Request(url, {
        //     method: 'GET',
        //     headers: myHeaders,
        //     mode: 'cors',
        //     cache: 'default',
        // });

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
                        chrome.runtime.sendMessage(data);

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


