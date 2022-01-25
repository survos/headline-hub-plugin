# HH Ext

## Process

* background.js: sets up listeners
* inject.js: called when a page is loaded.  Sends a message (to background.js) to check.json.
    * If there's an article, inject a top line (or sidebar) with a button to edit the article or stories
    * If no article but media, highlight media and open iframe.
    * If neither, do nothing, this will be handled by popup.html
* popup.html/js: call check.json and add a link to "Add Media", OR better, inject an iframe with the addMedia.

Certain media could open add article/story.  Or check could do a search for keywords and tags.

### Other Resources to check out
https://24ways.org/2018/my-first-chrome-extension/#author
