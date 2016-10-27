var note_id = 0;

var last_click_pos = {
    "x" : 0,
    "y" : 0
}

/*!
* Since the contextmenu handler is attached on the background page,
* we need to locally store the last right click.
*/
$( 'body' ).contextmenu( function( e ) {
    last_click_pos.x = e.pageX;
    last_click_pos.y = e.pageY;
});

chrome.extension.onMessage.addListener( function ( message, sender, callback ) {
    if ( message.function == "context_menu_clicked" ) {
        /*!
        * Attach a holder div to the page. The layout is as follows:
        * ----------------- <- (note-parent)
        * |(toggle-color)->🖌 ✕ <- (close)|
        * | ------------  |
        * | (note)        |
        * | ------------  |
        * -----------------
        *
        * The draggable event is attached to the note-parent.
        * The only editable content is the note div.
        */
        $( '<div/>', {
            'id' : 'note-parent-' + note_id,
            'class' : 'note-div-parent note-div-dark',
            'contenteditable' : 'false'
        }).css({
            left : last_click_pos.x - 100,
            top : last_click_pos.y - 50
        }).appendTo( 'body' );

        $( '<div/>', {
            'id' : 'note-' + note_id,
            'class' : 'note-div',
            'contenteditable' : 'true'
        }).appendTo( '#note-parent-' + note_id );

        $( '<span/>', {
            'id' : 'toggle-' + note_id,
            'class' : 'toggle-color-note',
            'contenteditable' : 'false'
        }).appendTo( '#note-parent-' + note_id );

        $( '<span/>', {
            'id' : 'close-' + note_id,
            'class' : 'close-note',
            'contenteditable' : 'false'
        }).appendTo( '#note-parent-' + note_id );

        $( '#note-parent-' + note_id ).draggable( );
        $( '#note-' + note_id ).focus( );

        $( '#note-parent-' + note_id ).on( 'click', function( ) {
            $( this ).children( '.note-div' ).focus( );
        });

        $( '#close-' + note_id ).on( 'click', function( ) {
            $( this ).parents( '.note-div-parent' ).remove( );
        });

        $( '#toggle-' + note_id ).on( 'click', function( ) {
            $( this ).parents( '.note-div-parent' ).toggleClass( 'note-div-dark note-div-light' );
        });

        /*!
        * Due to a quirk in Chrome, for contenteditable divs the focus event fires 
        * before the native browser selection takes place.
        * It's also ridiculously retarded to place the cursor at the end of active text.
        * This is a hack described here:
        * https://stackoverflow.com/questions/2871081/jquery-setting-cursor-position-in-contenteditable-div/2948573#2948573
        */
        var div = document.getElementById( 'note-' + note_id );

        $( '#note-' + note_id ).on( 'focus', function( ) {
            window.setTimeout( function( ) {
                var range = document.createRange( );
                range.selectNodeContents( div );
                range.collapse( false) ;

                var selection = window.getSelection( );
                selection.removeAllRanges( );
                selection.addRange( range );
            }, 1 );
        });

        note_id++;
    }
});
