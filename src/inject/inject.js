// inject our iframe into the HTML, and highlight the title, date, etc. based on the media queries.
console.log('Setting up listener inject.js');


chrome.runtime.sendMessage({
        'code': 'welcome',
        'type': 'tab loaded, sending a kickoff message from inject.'
    },
     (response) => {
        var readyStateCheckInterval = setInterval( () => {
            if (document.readyState === "complete") {
                clearInterval(readyStateCheckInterval);

                // ----------------------------------------------------------
                // This part of the script triggers when page is done loading
                console.log("This message was sent from scripts/inject.js, the tab load is now complete");
                // console.log(response);
                // ----------------------------------------------------------

            }
        }, 10);
    });

chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
    console.log(message, sender, sendResponse);

    console.assert(message.code, "Missing code in message.");
    switch (message.code) {
        case 'check_url_received':
            updateContent(message);
            // if there's no media, we should see if the plugin is active, if so, auto-add the iframe with the new media page.
            console.log(message);
            sendResponse('ok');
            break;
        default:
            console.log(message.code + ' is being handled elsewhere, perhaps in background?');
            sendResponse(message.code);
    }
});

function updateContent(message)
{

    // @todo: refactor different types of messages, no_media, blocked_media, new_article, etc.
    let host = message.host;
    console.log('Received message ' + message.url, message);
    let urlData = new URL(message.url);
    console.log(urlData);

    // if it's not news, don't even open up the site.
    if (message.status == 'not_news') {
        return; //
    }

    console.log(message);
    if (message.media) {
        // removeClutter(message);
    }

    // create a style element
    var style = document.createElement('style');

// add the CSS as a string
    style.innerHTML = `
.iframe-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.responsive-iframe {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  border: none;
}
`

// add it to the head
    document.getElementsByTagName('head')[0].appendChild(style);

    // https://stackoverflow.com/questions/7524585/how-do-i-get-the-information-from-a-meta-tag-with-javascript
    // get the media selectors and apply them to find the right one for title, author, date
    // for meta elements, we should add a sidebar, maybe with a dropdown. Or expanding the elements in the page itself.

    let candidate = findFormAnchor(); // the name of the element, like h1, that marks the start of the relevant content.  Our form will go above this.

    let iframeElement = createIFrame(message);
    let form = GFG_Fun(message, iframeElement);

    let hhDiv = createHeadlineHubDiv(candidate, message);
    hhDiv.insertBefore(form, hhDiv.firstChild);

    let referenceElement = document.querySelector(candidate);
    if (!referenceElement) {
        referenceElement = document.body;
        referenceElement.style['background'] = 'pink';
        referenceElement.style['border-style'] = 'solid';
        document.body.insertBefore(hhDiv, document.body.firstChild);
    } else {
        hhDiv.style['border-style'] = 'solid';
        hhDiv.style['background'] = 'LightGreen';

        referenceElement.style['border-style'] = 'solid';
        referenceElement.style['background'] = 'orange';
        // referenceElement.parentNode.insertBefore(hhDiv, referenceElement);
        referenceElement.innerHTML = candidate + ":" + referenceElement.innerHTML;
    }

    let styles = {
        'subhead': "thick solid #0000FF",
        'headline': "thick dashes #0000FF",
    }

    let m = message.media;
    if (m && false) {
        let domList = document.createElement('ol');
        var table = document.createElement('table');
        for (const [key, value] of Object.entries(m)) {
            if (value !== null) {
                var tr = document.createElement('tr');
                var th = document.createElement('th');
                var td = document.createElement('td');
                th.appendChild(document.createTextNode(key))
                td.appendChild(document.createTextNode(value));
                tr.appendChild(th);
                tr.appendChild(td);
                /*
                                var td = document.createElement('td');
                                let li = document.createElement('li');
                                li.innerText = `${key}: ${value}`;
                                domList.appendChild(li);

                 */
                table.appendChild(tr);
                try {
                    // go through each media dom element selector, if we have it, apply the style
                    let metaElement = document.querySelector(value); //
                    if (metaElement) {
                        metaElement.style.border = styles[key];
                    }
                } catch (err) {
                    // document.getElementById("demo").innerHTML = err.message;
                }
            }
        }
        hhDiv.innerHTML += domList.outerHTML;
        hhDiv.innerHTML += message.links;
        console.log(table.outerHTML);
        hhDiv.innerHTML += table.outerHTML;
        hhDiv.appendChild(table);
    } else {
        hhDiv.innerHTML += "No media!!";
    }

    articleMsg = document.createElement('div');
    if (message.article) {
        const a = message.article;
        articleMsg.innerHTML = `<h2>${a.headlineText}</h2><code>${a.marking}</code> <b>${a.mediaName}</b><hr />`;
        // hhDiv.innerHTML += a.links;
    } else {
        articleMsg.innerHTML = "Article not in database, wanna add it? <button>Add</button>";
    }

    const showIframe = true || message.article;
    if (showIframe) {
        var iframeDiv = document.createElement('div');
        iframeDiv.className = 'iframe-container';
        iframeDiv.appendChild(iframeElement);
        document.body.appendChild(iframeDiv);
        document.body.appendChild(form);
        form.hidden = true;
        form.submit();
    }
    return;


    // const p = document.createElement('div');
    // const articleElems = document.querySelector("h1");
    // if (articleElems.length > 0) {
    // 	articleElems.style['border-style'] = 'dashed';
    // }
    // document.body.insertBefore(p, document.body.firstChild);

    // titleElement = document.body;
    // titleElement.css.style('border-style: dashed;');
    console.log(message.article);
    var primaryDiv;

    // insert as a sibling above the insertElement


    const primaryTagName = 'h1';
    const x = document.getElementsByTagName(primaryTagName);
    if (x.length > 0) {
        console.log(`Found ${primaryTagName} tag`);
        primaryDiv = x[0];
        primaryDiv.style['border-style'] = 'dashed';
    } else {
        primaryDiv = document.body;
    }


    hhDiv.innerHTML += host;
    primaryDiv.insertBefore(hhDiv, primaryDiv.firstChild);

    let mediaMsg = document.createElement('div');
    if (message.media) {
        const m = message.media;
        hhDiv.innerHTML += `<i>${host}</i> ${m.headlineDomSelector}`;
        primaryDiv.insertBefore(mediaMsg, primaryDiv.firstChild);
        console.log(m);
    } else {
        mediaMsg.innerHTML = `<i>Missing media ${host}, add it?</i>`;
        primaryDiv.insertBefore(mediaMsg, primaryDiv.firstChild);
    }


    // return;

    // iframe.src = message.iframe_url  + '?' + new URLSearchParams({
    // 	'headlineText': 'h1',
    // 	'url': message.url
    // })


    // let form = GFG_Fun(message, iframe);
    // // primaryDiv.appendChild(form);
    // console.log(form);
    // console.warn("form created", form);
    // primaryDiv.insertBefore(form, primaryDiv.firstChild);
    primaryDiv.innerHTML += form.outerHTML;
    // return;

    // pass the document in for processing

    // console.log('iframe.contentWindow =', iframe.contentWindow);

}

function GFG_Fun(message, iframe) {

    const submitUrl = message.iframe_url;

    var br = document.createElement("br");

    // Create a form synamically
    var form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", submitUrl);
    form.setAttribute("target", iframe.id);

    // Create an input element for document HTML, which the PHP will parse
    var docBody = document.createElement("textarea");
    docBody.setAttribute("name", "document");
    // docBody.setAttribute("value", document.outerHTML);
    // docBody.value = document.body.innerText;

    docBody.innerHTML = document.head.outerHTML;
    if (message.mediaId) {
        docBody.innerHTML += document.body.outerHTML;
    }
    // console.log(docBody.value);
    form.appendChild(docBody);
    form.appendChild(br.cloneNode());

    // Create an input element for Full Name
    var FN = document.createElement("input");
    FN.setAttribute("type", "text");
    FN.setAttribute("name", "url");
    FN.setAttribute("placeholder", message.url);
    FN.setAttribute("value", message.url);
    FN.value = message.url;

    // // Create an input element for the host
    // var HOST = document.createElement("input");
    // HOST.setAttribute("type", "text");
    // HOST.setAttribute("name", "host");
    // HOST.setAttribute("value", message.host);

    // Create an input element for mediaID
    var mediaId = document.createElement("input");
    mediaId.setAttribute("type", "number");
    mediaId.setAttribute("name", "media_id");
    mediaId.setAttribute("value", message.media_id);
    mediaId.setAttribute("placeholder", "Media ID");

    // Create an input element for password
    var PWD = document.createElement("input");
    PWD.setAttribute("type", "password");
    PWD.setAttribute("name", "password");
    PWD.setAttribute("placeholder", "Password");

    // Create an input element for retype-password
    var RPWD = document.createElement("input");
    RPWD.setAttribute("type", "password");
    RPWD.setAttribute("name", "reTypePassword");
    RPWD.setAttribute("placeholder", "ReEnter Password");

    // create a submit button
    var s = document.createElement("input");
    s.setAttribute("type", "submit");
    s.setAttribute("value", iframe.id);
    // Append the full name input to the form
    form.appendChild(FN);

    // Inserting a line break
    form.appendChild(br.cloneNode());

    // Append the HOST to the form
    // form.appendChild(HOST);
    // form.appendChild(br.cloneNode());

    // Append the emailID to the form
    form.appendChild(mediaId);
    form.appendChild(br.cloneNode());

    // Append the Password to the form
    form.appendChild(PWD);
    form.appendChild(br.cloneNode());

    // Append the ReEnterPassword to the form
    form.appendChild(RPWD);
    form.appendChild(br.cloneNode());

    // Append the submit button to the form
    form.appendChild(s);

    return form;

}

function removeClutter(message) {
    // without all gets first..
    console.log(message.media);
    message.media.scrubSelectorsArray.forEach((selector) => {
        document.querySelectorAll(selector.trim()).forEach((elem) => {
            elem.parentNode.removeChild(elem);
        });
    });

}

function findFormAnchor() {
    // loop through h1, header, etc, to find a good element to anchor to
    let candidate = ['h1', 'h2', 'article', '.main', '#main', 'body'].find((selector) => {
        return document.querySelector(selector);
    });
    console.log(candidate);
    return candidate;
}

function createIFrame(message) {

    var iframe = document.createElement('iframe');
    // iframe.className = 'responsive-iframe';
    iframe.style.background = "LightGreen"; // color based on media, site, ignored, new art, existing art, story?
    iframe.style.height = "100%";
    // iframe.style.width = "360px";
    iframe.style.width = "30%";
    iframe.style.position = "fixed";
    iframe.style.top = "0px";
    iframe.style.right = "0px";
    iframe.style.zIndex = "9000000000000000000";
    iframe.frameBorder = "solid";
    iframe.id = "hh_iframe";
    iframe.name = "hh_iframe";
    // iframe.scrolling = "yes";
    iframe.overflow = "visible";

    var html = '<body>' +
        // articleMsg.innerHTML +
        // mediaMsg.innerHTML +
        message.host +
        // hhDiv.innerHTML +
        '</body>';

    iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
    return iframe;
}

function createHeadlineHubDiv(candidate, message) {
    // get the insert element selector, or a list?
    const hhDiv = document.createElement('div');
    hhDiv.innerHTML = '';

    hhDiv.innerHTML += `<h1>...Loading before ...${candidate} </h1>`;
    // hhDiv.innerHTML += message.suggestion_form;
    hhDiv.innerHTML += message.html;

    hhDiv.style['border-style'] = 'dashed';
    hhDiv.style['background'] = 'Pink';

    return hhDiv;
}
