'use strict';

var note_id = 0;

var last_click_pos = {
    "x" : 0,
    "y" : 0
}

var last_scroll_top = 0;

/*!
* For a contenteditable div, set the cursor to the given index position on the given line number.
*
* div: A document selector to the contenteditable div. Not a jQuery selector.
* line: The line to place the cursor on. 0-based.
* index: The index on the line to place the cursor at. 0-based.
*/
function set_selection( div, line, index ) {
    var range = document.createRange( );

    if( div.childNodes.length == 0 )
        return;

    //If we are at the top element of the contenteditable, it needs to be treated as text and not a div.
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

/*!
* Check if we are currently on a Google document.
*/
function google_doc( ) {
    return window.location.href.indexOf( 'docs.google.' ) != -1;
}

$(document).ready( function( ) {
    /*!
    * Since the contextmenu handler is attached on the background page,
    * we need to locally store the last right click.
    */
    $( window ).contextmenu( function( e ) {
        last_click_pos.x = e.pageX;
        last_click_pos.y = e.pageY;

        /*!
        * If we are on a google doc, create a menu item in the context-menu.
        *
        * We have to do this inside the context-menu handler because these items aren't
        * created until a right-click is registered.
        *
        * We have to remove the entry each time otherwise the context-menu will throw
        * the creation all around.
        */
        if( google_doc() && $( '#doc-temp-notes' ).length > 0 ) {
            $( '#doc-temp-notes' ).remove( );
        }

        if( google_doc( ) ) {
            var $context_menu = $( '.goog-menuitem-label' ).filter( function( ) { 
                return $( this ).text( ) == 'Link...' && this.childNodes.length == 1; 
            }).parent( ).parent( );

            $( '<div/>', {
                'id' : 'doc-temp-notes',
                'class' : 'goog-menuitem apps-menuitem',
                'role' : 'menuitem',
                'style' : 'user-select: none;'
            }).insertBefore( $context_menu );

            $( '<div/>', {
                'id' : 'doc-temp-notes-layer-2',
                'class' : 'goog-menuitem-content'
            }).appendTo( '#doc-temp-notes' );

            $( '<span>Temp Note</span>', {
                'class' : 'goog-menuitem-label'
            }).appendTo( '#doc-temp-notes-layer-2' );
        }
    });

    /*!
    * If we are on google docs, implement some special logic so scrolling inside the frame works.
    *
    * Also add support for hovering and the click event.
    */
    if( google_doc( ) ) {
        $( '.kix-appview-editor' ).scroll( function(e) { 
            var scroll_top = $( this ).scrollTop( );
            var kix_top_offset = $( this ).offset( ).top;

            $( '.note-div-parent' ).each( function() {
                var new_top_for_div = $( this ).offset( ).top + ( last_scroll_top - scroll_top );
                $( this ).css( 'top', new_top_for_div );
            });

            last_scroll_top = scroll_top;
        });

        $( 'body' ).on( 'mouseenter mouseleave', '#doc-temp-notes', function() {
            $( this ).toggleClass( 'goog-menuitem-highlight' );
        });

        $( 'body' ).on( 'click', '#doc-temp-notes', function() {
            append_temp_note_to_page( );
        });
    }
});

/*!
* Attach a holder div to the page. The layout is as follows:
* ----------------- <- (note-parent)
* |         ⎘ 🖌 ✕| <- (copy, toggle-color, close)
* | ------------  |
* | (note)        |
* | ------------  |
* -----------------
*
* The draggable event is attached to the note-parent.
* The only editable content is the note div.
*/
function append_temp_note_to_page( ) {
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
        'id' : 'copy-' + note_id,
        'class' : 'copy-note not-copied',
        'contenteditable' : 'false'
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

    $( '#copy-' + note_id ).on( 'click', function( ) {
        var range = document.createRange();
        range.selectNode( $( this ).parents( '.note-div-parent' ).children( '.note-div')[ 0 ] );

        var selection = window.getSelection( );
        selection.addRange( range );

        var successful = document.execCommand('copy');  

        /*!
        * If we have a successful copy, fadeOut and switch the class descriptor to give feedback.
        * We have to make use of two classes since ::before attributes are not part of the DOM
        * and can't be modified through jQuery.
        */
        if( successful ) {
            var $copy_indicator = $( this );

            $copy_indicator.fadeOut( 'fast', function() {
                $copy_indicator.toggleClass( 'not-copied copied' );
                $copy_indicator.css( 'top', '4px' );
                $copy_indicator.show( );
                
                setTimeout( function() {
                    $copy_indicator.fadeOut( 'fast', function() {
                        $copy_indicator.toggleClass( 'not-copied copied' );
                        $copy_indicator.css( 'top', '3px' );
                        $copy_indicator.show( );
                    });
                }, 1000 );
            });
        }

        selection.removeAllRanges( );
    });

    /*!
    * There was an attempt to add a scroll handler to check for the pdf scrolling.
    * This was an abysmal failure.
    */

    $( '#note-' + note_id ).on( 'focus', function( ) {
        /*!
        * If we are viewing a pdf, set the current_line element to the max length, since focusing
        * places our cursor there.
        */
        if( pdf_embedded( ) ) {
            var $current_line = $( this ).parent( ).find( '#current_line' );
            $current_line.val( this.childNodes.length - 1 > 0 ? this.childNodes.length - 1 : 0 );
        }

        //Set the cursor to the end of the selection.
        var range = document.createRange( );
        range.selectNodeContents( this );
        range.collapse( false);

        var selection = window.getSelection( );
        selection.removeAllRanges( );
        selection.addRange( range );
    });

    /*!
    * By default, both pdf.js and Adobe's embedded pdf reader capture keypresses 
    * (mainly to prevent accidentally navigation). Chrome treats embedded elements
    * with a higher precedence than anything else. As a result, keypresses are captured 
    * by the pdf and never passed on to our contenteditable. To resolve this, we need to
    * recreate basic navigation functionality. 
    */
    if( pdf_embedded( ) ) {
        $( '#note-' + note_id ).on( 'keydown', function( e ) {
            var $current_line = $( this ).parent( ).find( '#current_line' );
            var selection = window.getSelection( );

            switch( e.which ) {
                case 8:             //backspace
                    var current_pos = selection.anchorOffset;
                    var $current_text = $( this.childNodes[ $current_line.val( ) ] );

                    //If there is nothing, prevent the deletion of the contenteditable object.
                    if( this.childNodes.length == 0 || ( current_pos == 0 && $current_line.val( ) == 0 ) ) 
                        break;

                    //The first element of contenteditable's are treated as text nodes,
                    //with future elements being wrapped divs.
                    if( this.childNodes[ $current_line.val( ) ].childNodes.length == 0 ) {
                        $current_text.parent( ).text( $current_text.parent( ).text().substring( 0, current_pos - 1 ) + $current_text.parent( ).text( ).substring( current_pos ) );
                    }
                    else {
                        $current_text.text( $current_text.text().substring( 0, current_pos - 1 ) + $current_text.text( ).substring( current_pos ) );
                    }

                    if( $current_text.text().length == 0 ) {
                        $current_text.remove( );
                        if( $current_line.val( ) > 0 ) {
                            $current_line.val( parseInt( $current_line.val( ) ) - 1 );
                        }
                    }

                    //If we still have text, move one left, otherwise, jump up to the previous line.
                    if( current_pos > 0 && !( current_pos == 1 && $( this.childNodes[ $current_line.val( ) ] ).text( ).length == 0) ) {
                        set_selection( this, $current_line.val( ), current_pos - 1 < 0 ? 0 : current_pos - 1 );
                    }
                    else {
                        set_selection( this, $current_line.val( ), $( this.childNodes[ $current_line.val( ) ] ).text( ).length  );
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

chrome.extension.onMessage.addListener( function ( message, sender, callback ) {
    switch( message.function ) {
        case "context_menu_clicked":
            append_temp_note_to_page( );
            break;
        case "add_note":
            last_click_pos.x = window.outerWidth / 2;
            last_click_pos.y = ( window.outerHeight + window.scrollY / 2 ) - 50;
            append_temp_note_to_page( );
            break;
        case "clear_notes":
            $( '.note-div-parent' ).remove( );
            break;
    }
});
