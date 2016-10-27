var note_id = 0;

var last_click_pos = {
    "x" : 0,
    "y" : 0
}

$( 'body' ).contextmenu( function( e ) {
    last_click_pos.x = e.pageX;
    last_click_pos.y = e.pageY;
});

chrome.extension.onMessage.addListener( function ( message, sender, callback ) {
    if ( message.function == "context_menu_clicked" ) {
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
            'class' : 'toggle-color',
            'contenteditable' : 'false'
        }).appendTo( '#note-parent-' + note_id );

        $( '<span/>', {
            'id' : 'close-' + note_id,
            'class' : 'close',
            'contenteditable' : 'false'
        }).appendTo( '#note-parent-' + note_id );

        $( '#note-parent-' + note_id ).draggable( );
        $( '#note-' + note_id ).focus( );

        $( '#note-parent-' + note_id ).on( 'click', function() {
            $(this).children( '.note-div' ).focus( );
        });

        $( '#close-' + note_id ).on( 'click', function( ) {
            $( this ).parents( '.note-div-parent' ).remove( );
        });

        $( '#toggle-' + note_id ).on( 'click', function() {
            $( this ).parents( '.note-div-parent' ).toggleClass( 'note-div-dark note-div-light')
        });

        note_id++;
    }
});
