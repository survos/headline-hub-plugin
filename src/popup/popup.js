console.log('Loading popup.js');
// import "./stimulus";

console.log('popup.js extension is listening...');
// document.getElementById('media-name').textContent = 'somedomain.com';
// document.getElementById('host').textContent = 'now in popup.js';

// Where we will expose all the data we retrieve from storage.sync.
const storageCache = {};
// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = getAllStorageSyncData().then(items => {
    // Copy the data retrieved from storage into storageCache.
    Object.assign(storageCache, items);
    console.log("storage", items);
});

// const sendMessageButton = document.getElementById('sendMessage')
// sendMessageButton.onclick = async function(e) {
//     let queryOptions = { active: true, currentWindow: true };
//     let tabs = await chrome.tabs.query(queryOptions);
//     chrome.tabs.sendMessage(tabs[0].id, {color: "#00FF00"}, function(response) {
//         console.log(response.status);
//     });
// }

var currentTab;

chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    currentTab = tabs[0]; // there will be only one in this array
    const host = new URL(currentTab.url).host;

    // document.getElementById('media-name').textContent = currentTab.url;
    document.getElementById('host').textContent = host;
    // document.getElementById('media-marking').innerHTML = 'marking';
    chrome.action.setTitle({title: host + " is beging checked", tabId: currentTab.id});
    chrome.action.setBadgeText({text: "*"});


    // the problem is that popup.js doesn't have access to the dom.
    // console.warn(currentTab);

    // send a message to inject to get the html
    console.log("Sending a tab_content message from popup.js to tab " + currentTab.url);
            console.log("Sending a check_media message from popup.js, tabID is " + currentTab.id + ' ' + currentTab.url);
            chrome.runtime.sendMessage({
                code: "check_media",
                tabId: currentTab.id,
                url: currentTab.url
            }, (response) => {

                // if it's no media, we can add the media buttons
                console.warn(response.status + ' for '  + response.url, response);
                document.getElementById('host').setAttribute('value', response.host);
                document.getElementById('url').setAttribute('value', response.url);
                document.getElementById('html_response').innerHTML = response.status;

                let articleForm = document.querySelector('#add_article_form');
                if (response.status === 'no_media') {
                    articleForm.style.display = 'none';
                } else {
                    let form = document.getElementById('add_article_form');
                    form.setAttribute('action', response.submitUrl);
                    console.assert(response.mediaId);
                    document.getElementById('mediaId').setAttribute('value', response.mediaId);
                    document.getElementById('html_response').innerHTML = response.html;
                    document.getElementById('mediaId').setAttribute('value', response.mediaId);

                }

                let mediaForm = document.querySelector('#media_form');
                mediaForm.setAttribute('action', response.mediaSubmitUrl);
                console.log('media form action set to ' + mediaForm.getAttribute('action'));

                // if we have a media and it's active, get the tab content.
                chrome.tabs.sendMessage(currentTab.id, {
                        code: 'tab_content',
                    },
                    (response) => {
                        console.warn(response);

                        if (response.webpage_html) {
                            console.warn(response.webpage_html.length, response);
                            document.getElementById('webpage_html').setAttribute('value', response.webpage_html);
                        }
                        // console.log('setting iframe_div to ' + response.iframe_path);
                        console.log('check_media response', response);

                    });

            });
    return true;
});

// var a=0;
// document.getElementById('do-count').onclick = () => {
//     a+=2; document.getElementById('demo').textContent = a.toString();
//     chrome.action.setBadgeText({"text": a.toString(), tabId: currentTab.id});
// };

// function check_media() {
//     console.log('checking to see if this media exists.');
//
//     chrome.storage.local.get(['address'], function(value) {
//         console.log('calculating  value');
//         // gclient_geocode(value.address);
//     });
// }

const options = {};

let base = '';
async function getOptions() {
    await
        chrome.storage.sync.get({favoriteColor: 'cyan', hhUrl: 'someUrl'},
            (result) => {
                base = result.hhUrl;
                return result;
            });
}

console.log('adding submit listeners.');
document.querySelectorAll('.js-form').forEach(el => {
        console.log(el);
        el.addEventListener('submit', (event) => {
            event.preventDefault();
            event.stopPropagation();
            console.log(event, event.target, event.currentTarget);

            fetch(event.target.action, {
                method: 'POST',
                body: new FormData(event.target) // event.target is the form
            }).then((resp) => {
                return resp.json(); // or resp.text() or whatever the server sends
            }).then((body) => {
                if (body.url_to_open) {
                    chrome.tabs.create({url: body.url_to_open});
                }
                console.log(body)
                el.innerHTML = body.status;
                // TODO handle body
            }).catch((error) => {
                // TODO handle error
            });
        });
    }
);

// don't listen, instead initiate>
getOptions()
    .then( (data) => {
        // console.log(data);
        // if (data.code === "check_media") {
        //     document.getElementById('add_article_form').setAttribute('action', data['hhUrl'] + '/plugin/add-article');
        // }
    })
    // .then(() => { console.log('2')});


// window.onload = check_media;

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

if (0)
chrome.action.onMessage.addListener(
    (message, sender, sendResponse) => {
        console.log(`popup.js extension received message ${message.code}`, message);

        console.log(getOptions().hhUrl, storageCache);

        // though really we should do a sumbit on click, this is a hack.

        getOptions()
            .then((options) => {
                console.log(options);
            });

        let form = document.getElementById('add_article_form');
        form.setAttribute('action', result['hhUrl'] + '/plugin/add-article');
        console.log('form action set to ' + form.getAttribute('action'));

        chrome.action.setBadgeText({"text": "??"});
        let color = "green";
        chrome.action.setBadgeBackgroundColor({color: color});
        console.log(message, sender, sendResponse);
        // this document is the popup.html doc.
        document.getElementById('media-name').textContent = 'textContent in popup.js';
        // sendResponse('inside of popup.js listener');
        // let tab = sender.tab;
        console.log(message);

        if (message.iframe_url) {
            document.getElementById('iframe_div').src = message.iframe_url;
            document.getElementById('iframe_debug').href = message.iframe_url;
        }
        console.log('setting iframe_div to ' + message.iframe_url);
        document.getElementById('html_response').innerHTML = message.html;

        document.getElementById('webpage_html').setAttribute('value', message.html);
        document.getElementById('url').setAttribute('value', message.url);


        if (message.media) {
            chrome.action.setBadgeText({"text": "X"});

            const media = message.media;
            console.log(media);
            chrome.action.setBadgeText({"text": media.marking, "tabId": currentTab.id});
            chrome.action.setTitle({title: message.host + " is in the database (popup.js)", tabId: currentTab.id});
            document.getElementById('media-name').textContent = 'name ' + media.name;
            document.getElementById('host').setAttribute('value', media.host);
            document.getElementById('media-marking').innerHTML = media.marking;
        } else {
            // use message, not media.
            document.getElementById('host').setAttribute('value', message.host);
            document.getElementById('media-marking').innerHTML = 'Add ' + message.host;
            document.getElementById('media-name').textContent = '';

        }

        return true;
    });
