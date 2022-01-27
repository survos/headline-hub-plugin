
console.log('Loading popup.js');
document.getElementById('media-name').textContent = 'somedomain.com';


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    var currentTab = tabs[0]; // there will be only one in this array
    document.getElementById('media-name').textContent = currentTab.url;
    document.getElementById('host').textContent = new URL(currentTab.url).host;
    document.getElementById('media-marking').innerHTML = 'Hey';

    chrome.runtime.sendMessage({
        code: "check_media",
        tabId: currentTab.id,
        url: currentTab.url
    }, (response) => {
        console.log('check_media response', response);
        return true;

    });

});

var a=0;
document.getElementById('do-count').onclick = () => { a+=2; document.getElementById('demo').textContent = a.toString() };

function check_media() {
    console.log('checking to see if this media exists.');

    chrome.storage.local.get(['address'], function(value) {
        console.log('calculating  value');
        // gclient_geocode(value.address);
    });
}

// don't listen, instead initiate
chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        console.log(`popup.js extension received a message.`);
        console.log(message, sender, sendResponse);
        // this document is the popup.html doc.
        document.getElementById('media-name').textContent = 'textContent in popup.js';
        // sendResponse('inside of popup.js listener');

        if (message.media) {
            const media = message.media;
            document.getElementById('media-name').textContent = 'name ' + media.name;
            document.getElementById('host').textContent = media.domain;
            document.getElementById('media-marking').innerHTML = media.marking;
        } else {
            document.getElementById('media-marking').innerHTML = 'Hola?';
            document.getElementById('media-name').textContent = 'no media?';
            document.getElementById('host').textContent = 'not in database';

        }

        return true;
    });

// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         document.getElementById('media-name').textContent = JSON.stringify(request);
//         if (request.msg === "something_completed") {
//             //  To do something
//             console.log(request.data.subject)
//             console.log(request.data.content)
//         }
//     }
// );
//
// window.onload = check_media;
