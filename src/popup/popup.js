
console.log('Loading popup.js');
// import "./stimulus";

document.getElementById('media-name').textContent = 'somedomain.com';
document.getElementById('host').textContent = 'now in popup.js';


var currentTab;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTab = tabs[0]; // there will be only one in this array
    const host = new URL(currentTab.url).host;
    document.getElementById('media-name').textContent = currentTab.url;
    document.getElementById('host').textContent = host;
    document.getElementById('media-marking').innerHTML = 'marking';
    chrome.action.setTitle({title: host + " is beging checked", tabId: currentTab.id});
    chrome.action.setBadgeText({text: "*"});



    chrome.runtime.sendMessage({
        code: "check_media",
        tabId: currentTab.id,
        url: currentTab.url
    }, (response) => {
        console.log('check_media response', response);
        return true;
    });

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

async function getOptions()
{
    let options = {x:'x'};
    await chrome.storage.sync.get({favoriteColor: 'cyan', hhUrl: 'someUrl'}, (result) => {
        base = result.hhUrl;
        options = result;
        console.log('Value currently is ' + result.hhUrl, result);
        return result;
    });
    return options;
}

// don't listen, instead initiate>
getOptions()
    .then((data) => {
        console.log(data);
        this.options = data;
    })
    .then(() => { console.log('2')});

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        console.log(this.options);


        // though really we should do a sumbit on click, this is a hack.
        document.getElementById('add_article_form').setAttribute('action',  options['hhUrl'] + '/plugin/add-article');

        document.querySelector('form').addEventListener('submit', (e) =>
        {
            e.preventDefault();
            e.stopPropagation();
            console.log(e);

            // Add code for functionality you need here
        })

        console.log(`popup.js extension received a message.`);
        chrome.action.setBadgeText({"text": "??"});
        let color = "green";
        chrome.action.setBadgeBackgroundColor({color: color});
        console.log(message, sender, sendResponse);
        // this document is the popup.html doc.
        document.getElementById('media-name').textContent = 'textContent in popup.js';
        // sendResponse('inside of popup.js listener');
        // let tab = sender.tab;
        console.log(message);

        // document.getElementById('iframe_div').src = message.iframe_url;
        document.getElementById('iframe_debug').href = message.iframe_url;
        console.log('setting iframe_div to ' + message.iframe_url);
        document.getElementById('html_response').innerHTML =  message.html;

        document.getElementById('html').setAttribute('value', message.html);
        document.getElementById('url').setAttribute('value', message.url);


        if (message.media) {
            chrome.action.setBadgeText({ "text": "X" });

            const media = message.media;
            console.log(media);
            chrome.action.setBadgeText({ "text": media.marking, "tabId": currentTab.id} );
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

// window.onload = check_media;
