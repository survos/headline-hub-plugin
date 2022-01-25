
console.log('Loading popup.js');
document.getElementById('media-name').textContent = 'somedomain.com';


chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    var currentTab = tabs[0]; // there will be only one in this array
    document.getElementById('media-name').textContent = currentTab.url;

    chrome.runtime.sendMessage({
        code: "check_media",
        url: currentTab.url
    }, (response) => {
        console.log(response);
        if (response.media) {
            const media = response.media;
            document.getElementById('media-name').textContent = media.name;
            document.getElementById('host').textContent = media.domain;
        } else {
            document.getElementById('media-name').textContent = 'host?';
            document.getElementById('host').textContent = 'not in database';

        }
    })


    console.log(currentTab); // also has properties like currentTab.id
});

var a=0;
function count() {
    a++;
    document.getElementById('demo').textContent = a;
}
document.getElementById('do-count').onclick = count;

function check_media() {
    console.log('checking to see if this media exists.');

    chrome.storage.local.get(['address'], function(value) {
        console.log('calculating  value');
        // gclient_geocode(value.address);
    });
}

// don't listen, instead initiate
// chrome.extension.onMessage.addListener(
//     function (request, sender, sendResponse) {
//         console.log(`popup.js extension received a message. ${sender.tab.url}`);
//         console.log(request, sender, sendResponse);
//         document.getElementById('media-name').textContent = sender.tab.url;
//     });
//
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
