// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

var email;
chrome.identity.getProfileUserInfo(function(userInfo) {
    console.log(userInfo);
    email = userInfo.email;
    /* Use userInfo.email, or better (for privacy) userInfo.id
       They will be empty if user is not signed in in Chrome */
});


//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(

  function(request, sender, sendResponse) {
  	console.log(sender.tab.url);
  	// const base = 'https://staging-5em2ouy-6qpek36k2ejf6.eu.s5y.io';
  	const base = 'https://news.wip';
      let url = base + '/plugin/check.json';
      // let url = 'https://127.0.0.1:8000/api2.0/tags/2.json';

      const myHeaders =
          {
              'X-PLUGIN-AUTH-TOKEN': email,
              'Content-Type': 'application/json'
          };

      const myRequest = new Request(url + '?' + new URLSearchParams({
          url: sender.tab.url,
          email: email,
      }), {
          // agent: new HttpsProxyAgent('http://127.0.0.1:7080'),
          headers: myHeaders,
          credentials: "include"})

      // const myRequest = new Request(url, {
      //     method: 'GET',
      //     headers: myHeaders,
      //     mode: 'cors',
      //     cache: 'default',
      // });

      console.log("Fetching " + myRequest.url);


      fetch(myRequest)
          .then(
              function(response) {
                  if (response.status !== 200) {
                      console.log('Looks like there was a problem. Status Code: ' +
                          response.status);
                      return;
                  }


                  // Examine the text in the response
                  response.json().then( (data) =>  {
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
                      data.host = sender.tab.hostname;
                      chrome.tabs.sendMessage(sender.tab.id, data);
                      chrome.pageAction.show(sender.tab.id);

                  });
              }
          )
          .catch(function(err) {
              console.log('Fetch Error :-S', err);
          });


    sendResponse();
  });


