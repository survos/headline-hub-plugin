console.log('no-media.js');
document.getElementById('host').textContent = 'now in no-media.js';

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

// console.log(getCurrentTab());
var currentTab;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTab = tabs[0]; // there will be only one in this array
    const host = new URL(currentTab.url).host;
    document.getElementById('host').textContent = host;

    chrome.runtime.sendMessage({
        code: "check_media",
        tabId: currentTab.id,
        url: currentTab.url
    }, (message) => {

        document.getElementById('iframe_div').src = message.iframe_url;
        document.getElementById('iframe_debug').href = message.iframe_url;
        console.log('setting iframe_div to ' + message.iframe_url);

        console.log('check_media response', response);
        return true;
    });

});
