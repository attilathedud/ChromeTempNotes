var note_id = 0;

var last_click_pos = {
    "x" : 0,
    "y" : 0
}

$( 'body' ).contextmenu( function( e ) {
    last_click_pos.x = e.pageX;
    last_click_pos.y = e.pageY;
});

//TODO: fix up bug with deleting X icon
//TODO: add color switcher
chrome.extension.onMessage.addListener( function ( message, sender, callback ) {
    if ( message.function == "context_menu_clicked" ) {

        $( '<div/>', {
            'id' : 'note-' + note_id,
            'class' : 'note-div',
            'contenteditable' : 'true'
        }).css({
            left : last_click_pos.x - 100,
            top : last_click_pos.y - 50
        }).appendTo( 'body' );

        $( '<span/>', {
            'id' : 'close-' + note_id,
            'class' : 'close',
            'contenteditable' : 'false'
        }).appendTo( '#note-' + note_id );

        $( '#note-' + note_id ).draggable( );
        $( '#note-' + note_id ).focus( );

        $( '#close-' + note_id ).on( 'click', function( ) {
            $( this ).parents( '.note-div' ).remove( );
        });

        note_id++;
    }
});
