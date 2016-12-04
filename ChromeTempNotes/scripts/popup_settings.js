 chrome.tabs.query({
    "active"        : true,
    "currentWindow" : true
}, function ( tabs ) {
    tab_id = tabs[ 0 ].id;
            
    document.getElementById( 'add_note' ).onclick = function() {
        chrome.tabs.sendMessage( tab_id, { "function" : "add_note" } );
    }

    document.getElementById( 'clear_notes' ).onclick = function() {
        chrome.tabs.sendMessage( tab_id, { "function" : "clear_notes" } );
    }
});
