"use strict";

var note_id = 0;

var last_click_pos = {
    "x" : 0,
    "y" : 0
}

/*!
* Since the contextmenu handler is attached on the background page,
* we need to locally store the last right click.
*/
$( window ).contextmenu( function( e ) {
    last_click_pos.x = e.pageX;
    last_click_pos.y = e.pageY;
});

function set_selection( div, line, index ) {
    var range = document.createRange( );

    if( div.childNodes.length == 0 )
        return;

    if( div.childNodes[ line ].childNodes.length == 0 ) {
        range.setStart( div.childNodes[ line ], index );
    }
    else {
        range.setStart( div.childNodes[ line ].childNodes[ 0 ], index );
    }
    range.collapse( true );

    var selection = window.getSelection( );
    selection.removeAllRanges( );
    selection.addRange( range );
}

/*!
* Checks for the existance of an embedded pdf that is being rendered via Chrome's 
* native pdf reader or Adobe.
*/
function pdf_embedded( ) {
    return $('embed[type="application/pdf"]').length > 0;
}

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

        /*!
        * If we are creating a note for a pdf, we need to render an extra hidden
        * input that will keep track of the current line we are navigating on.
        */
        if( pdf_embedded( ) ) {
            $( '<input/>', {
                'id' : 'current_line',
                'type': 'hidden',
                'value' : '0'
            }).appendTo( '#note-parent-' + note_id );
        }

        /*!
        * Event handlers
        */
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

        $( '#note-' + note_id ).on( 'focus', function( ) {
            //if pdf, change currnet line
            if( pdf_embedded( ) ) {
                var $current_line = $( this ).parent( ).find( '#current_line' );
                $current_line.val( this.childNodes.length - 1 > 0 ? this.childNodes.length - 1 : 0 );
            }

            //set cursor to end of selection
            var range = document.createRange( );
            range.selectNodeContents( this );
            range.collapse( false);

            var selection = window.getSelection( );
            selection.removeAllRanges( );
            selection.addRange( range );
        });

        //if we have a pdf active we need to make some hacks
        if( pdf_embedded( ) ) {
            $( '#note-' + note_id ).on( 'keydown', function( e ) {
                var $current_line = $( this ).parent( ).find( '#current_line' );
                var selection = window.getSelection( );

                switch( e.which ) {
                    case 8:             //backspace
                        var current_pos = selection.anchorOffset;
                        var $current_text = $( this.childNodes[ $current_line.val( ) ] );

                        if( this.childNodes.length == 0 || ( current_pos == 0 && $current_line.val( ) == 0 ) ) 
                            break;

                        if( this.childNodes[ $current_line.val( ) ].childNodes.length == 0 ) {
                            $current_text.parent( ).text( $current_text.parent( ).text().substring( 0, current_pos - 1 ) + $current_text.parent( ).text( ).substring( current_pos ) );
                        }
                        else {
                            $current_text.text( $current_text.text().substring( 0, current_pos - 1 ) + $current_text.text( ).substring( current_pos ) );
                        }

                        if( current_pos > 0 && !( current_pos == 1 && $( this.childNodes[ $current_line.val( ) ] ).text( ).length == 0) ) {
                            set_selection( this, $current_line.val( ), current_pos - 1 < 0 ? 0 : current_pos - 1 );
                        }
                        else {
                            if( $current_line.val( ) > 0 ) {
                                $current_line.val( parseInt( $current_line.val( ) ) - 1 );
                                set_selection( this, $current_line.val( ), $( this.childNodes[ $current_line.val( ) ] ).text( ).length  );
                            }
                        }

                        break;
                    case 13:            //enter
                        $current_line.val( parseInt( $current_line.val( ) ) + 1 );
                        break;
                    case 37:            //left
                        if( selection.anchorOffset > 0 ) {
                            set_selection( this, $current_line.val( ), selection.anchorOffset - 1 );
                        }
                        break;
                    case 38:            //up
                        if( $current_line.val( ) > 0 ) {
                            $current_line.val( parseInt( $current_line.val( ) ) - 1 );
                            set_selection( this, $current_line.val( ), 0 );
                        }
                        break;
                    case 39:            //right
                        if( selection.anchorNode.wholeText != undefined && selection.anchorOffset < selection.anchorNode.wholeText.length ) {
                            set_selection( this, $current_line.val( ), selection.anchorOffset + 1 );
                        }
                        break;
                    case 40:            //down
                        if( $current_line.val( ) < this.childNodes.length - 1 ) {
                            $current_line.val( parseInt( $current_line.val( ) ) + 1 );
                            set_selection( this, $current_line.val( ), 0 );
                        }
                        break;
                }
            }); 
        }

        note_id++;
    }
});
