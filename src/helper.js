var $get_repo_link = function( $elem ) {
	var $form = $elem.getElementsByTagName( 'form' );
	if( $form ) {
		if( typeof $form[ 0 ] !== 'undefined' ) {
			var $action = $form[ 0 ].getAttribute( 'action' );
			$action     = $action.replace( 'start', '' );
			$action     = $action.replace( 'unstar', '' );
			return $action;
		}
	}
	return null;
}

var $helper_button = function( $elem ) {
	var $star = $elem.getElementsByClassName( 'starring-container' );
	for( var $s in $star ) {
		if( typeof $star[ $s ] === 'object' ) {
			if( $star[ $s ].parentNode.tagName === 'LI' ) {
				continue;
			}
			/**
			 * For Quick Clone Button.
			 * @type {HTMLElement}
			 */
			var $eelem = document.createElement( 'a' );
			$eelem.setAttribute( 'class', 'btn btn-sm' );
			$eelem.setAttribute( 'href', 'x-github-client://openRepo/https://github.com/' + $get_repo_link( $star[ $s ] ) );
			$eelem.setAttribute( 'title', 'Clone this repo to your computer and use it in GitHub Desktop.' );
			$eelem.innerHTML = '<svg height="15" class="octicon octicon-desktop-download" viewBox="0 0 16 16" version="1.1" width="15" aria-hidden="true"><path fill-rule="evenodd" d="M4 6h3V0h2v6h3l-4 4-4-4zm11-4h-4v1h4v8H1V3h4V2H1c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h5.34c-.25.61-.86 1.39-2.34 2h8c-1.48-.61-2.09-1.39-2.34-2H15c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1z"></path></svg>';
			$star[ $s ].parentNode.appendChild( $eelem );

			/**
			 * For Download button.
			 * @type {HTMLElement}
			 */
			var $eelem = document.createElement( 'a' );
			$eelem.setAttribute( 'class', 'btn btn-sm' );
			$eelem.setAttribute( 'href', 'https://github.com/' + $get_repo_link( $star[ $s ] ) + '/archive/master.zip' );
			$eelem.setAttribute( 'title', 'Download Contents of this repo.' );
			$eelem.innerHTML = '<svg height="15" class="octicon octicon-cloud-download" viewBox="0 0 16 16" version="1.1" width="15" aria-hidden="true"><path fill-rule="evenodd" d="M9 12h2l-3 3-3-3h2V7h2v5zm3-8c0-.44-.91-3-4.5-3C5.08 1 3 2.92 3 5 1.02 5 0 6.52 0 8c0 1.53 1 3 3 3h3V9.7H3C1.38 9.7 1.3 8.28 1.3 8c0-.17.05-1.7 1.7-1.7h1.3V5c0-1.39 1.56-2.7 3.2-2.7 2.55 0 3.13 1.55 3.2 1.8v1.2H12c.81 0 2.7.22 2.7 2.2 0 2.09-2.25 2.2-2.7 2.2h-2V11h2c2.08 0 4-1.16 4-3.5C16 5.06 14.08 4 12 4z"></path></svg>';
			$star[ $s ].parentNode.appendChild( $eelem );
		}
	}
	return $elem;
};

function init_buttons() {
	/*var $main_elem = document.getElementById( 'user-repositories-list' );

	if( $main_elem ) {
		var $ul_data = $main_elem.getElementsByTagName( 'ul' );
		if( $ul_data ) {
			if( $ul_data.length > 0 ) {
				for( var $key in $ul_data ) {
					var $li = $ul_data[ $key ].getElementsByTagName( 'li' );
					if( $li ) {
						if( $li.length > 0 ) {
							for( var $li_k in $li ) {
								$li[ $li_k ] = $helper_button( $li[ $li_k ] );
							}
						}
					}
				}
			}
		}
	}*/
	$helper_button( document );
}

document.addEventListener( 'pjax:end', init_buttons, false );
init_buttons();