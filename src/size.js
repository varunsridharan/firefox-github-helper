/* global browser */
// - WebExtension -

const getStoredSetting = async( key ) => {
	const storage = await browser.storage.local.get();
	return storage[ key ];
};

const setSetting = async( key, value ) => {
	await browser.storage.local.set( { [ key ]: value } )
};

// - COMMON -
const GITHUB_API       = 'https://api.github.com/repos/'
const REPO_STATS_CLASS = 'numbers-summary'
const REPO_SIZE_ID     = 'addon-repo-size'
const SIZE_KILO        = 1024
const UNITS            = [ 'B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ]
const TOKEN_KEY        = 'grs_gh_token'
const AUTO_ASK_KEY     = 'grs_auto_ask'
const MODAL_ID         = 'grs_token_modal'
const TOKEN_INPUT_ID   = 'grs_token_input'

const handleErr = ( err ) => {
	console.error( err )
}

const checkIsPrivate = ( $elem = false ) => {
	if( false === $elem ) {
		if( document.getElementsByClassName( 'private' ).length > 0 ) {
			return true;
		}
	} else {
		var $classList = $elem.classList;
		for( var $key in $classList ) {
			if( $classList[ $key ] === 'private' ) {
				return true;
			}
		}
	}
	return false;
}

const getRepoSlug = ( url ) => {
	const pathes = url.split( '/' )

	if( pathes.length < 2 ) {
		return null
	}

	if( pathes.length === 2 ) {
		return pathes[ 0 ] + '/' + pathes[ 1 ];
	} else if( pathes.length === 3 && pathes[ 0 ] === '' ) {
		return pathes[ 1 ] + '/' + pathes[ 2 ];
	}
}

const getRepoData = ( slug, token ) => {
	let url = GITHUB_API + slug
	if( token != null ) {
		url += `?access_token=${token}`
	}
	const request = new window.Request( url )

	return window.fetch( request )
				 .then( checkResponse )
				 .then( getRepoSize )
				 .catch( handleErr )
}

const checkResponse = ( resp ) => {
	if( resp.status >= 200 && resp.status < 300 ) {
		return resp.json()
	}

	throw Error( `Invalid response from github ${resp.status} - ${resp.body}` )
}

const getRepoSize = ( repoData ) => {
	return repoData.size
}

const getHumanFileSize = ( size ) => {
	if( size === 0 ) {
		return {
			size: '0',
			unit: UNITS[ 0 ]
		}
	}

	const order = Math.floor( Math.log( size ) / Math.log( SIZE_KILO ) )
	return {
		size: parseFloat( ( size / Math.pow( SIZE_KILO, order ) ) ).toFixed( 2 ),
		unit: UNITS[ order ]
	}
}

const askForToken = async( e ) => {
	if( e != null ) {
		e.preventDefault()
	}

	await createModalElement()
	window.location.hash = MODAL_ID
}

const saveToken = ( e ) => {
	e.preventDefault()
	const token = e.target.elements[ TOKEN_INPUT_ID ].value
	setSetting( TOKEN_KEY, token )
	closeModal()

	if( token != null ) {
		injectRepoSize()
	}
}

const closeModal = () => {
	window.location.hash = ''
	setSetting( AUTO_ASK_KEY, false )
}

const embedRepoSize = async( repoElem, repoSlug = null ) => {

	if( repoSlug === null ) {
		let $h3 = repoElem.getElementsByTagName( 'h3' );
		if( $h3 ) {
			let $a_tag = $h3[ 0 ].getElementsByTagName( 'a' );
			if( $a_tag ) {
				repoSlug = getRepoSlug( $a_tag[ 0 ].getAttribute( 'href' ) );
			}
		}
	} else {
		repoSlug = getRepoSlug( repoSlug );
	}

	if( repoSlug !== null ) {
		var getRepoDataPromise;
		if( checkIsPrivate( repoElem ) ) {
			const token = await getStoredSetting( TOKEN_KEY );
			if( token == null ) {
				const autoAsk = await getStoredSetting( AUTO_ASK_KEY )
				if( autoAsk == null || autoAsk === true ) {
					askForToken()
				}
				return
			}
			getRepoDataPromise = getRepoData( repoSlug, token )
		} else {
			getRepoDataPromise = getRepoData( repoSlug )
		}
		getRepoDataPromise.then( repoSize => {
			if( repoSize == null ) {
				return
			}

			const humanSize = getHumanFileSize( repoSize * 1024 )

			const sizeTag = createSizeElement( humanSize )
			var $a_tag    = sizeTag.getElementsByTagName( 'a' )[ 0 ];
			$a_tag.setAttribute( 'style', 'margin-left:10px;color:inherit;' );
			$a_tag.setAttribute( 'title', sizeTag.getAttribute( 'title' ) );

			var $relativetime = repoElem.getElementsByTagName( 'relative-time' );
			if( typeof $relativetime[ 0 ] !== 'undefined' ) {
				$relativetime[ 0 ].parentNode.appendChild( $a_tag );
			} else {
				var $txt = repoElem.getElementsByClassName( 'mb-0' );
				$txt[ 0 ].appendChild( $a_tag );
			}
		} )
	}
};

const injectRepoSize = async() => {
	const repoSlug = getRepoSlug( window.location.pathname.substring( 1 ) )

	if( repoSlug != null ) {
		const statsCol = document.getElementsByClassName( REPO_STATS_CLASS )

		if( statsCol.length !== 1 ) {
			return
		}

		const statsElt    = statsCol[ 0 ]
		const repoSizeElt = document.getElementById( REPO_SIZE_ID )

		// nothing to do if we already have the size displayed
		if( repoSizeElt != null ) {
			return
		}

		let getRepoDataPromise
		if( checkIsPrivate() ) {
			const token = await getStoredSetting( TOKEN_KEY )
			if( token == null ) {
				const autoAsk = await getStoredSetting( AUTO_ASK_KEY )
				if( autoAsk == null || autoAsk === true ) {
					askForToken()
				}
				return
			}

			getRepoDataPromise = getRepoData( repoSlug, token )
		} else {
			getRepoDataPromise = getRepoData( repoSlug )
		}

		getRepoDataPromise
			.then( repoSize => {
				if( repoSize == null ) {
					return
				}

				const humanSize = getHumanFileSize( repoSize * 1024 )

				const sizeTag = createSizeElement( humanSize )
				statsElt.appendChild( sizeTag )
			} )
	}
}

const createSizeElement = ( repoSizeHuman ) => {
	const li = document.createElement( 'li' )
	li.id    = REPO_SIZE_ID
	li.setAttribute( 'title', 'As reported by the GitHub API, it mays differ from the actual repository size.' )
	const elt = document.createElement( 'a' )
	elt.setAttribute( 'href', '#' )
	elt.onclick            = askForToken
	const icon             = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' )
	icon.className.baseVal = 'octicon octicon-database'
	icon.setAttribute( 'height', 16 )
	icon.setAttribute( 'width', 14 )
	icon.setAttribute( 'viewBox', '0 0 14 16' )
	icon.setAttribute( 'aria-hidden', true )
	icon.setAttribute( 'version', '1.1' )
	const iconPath = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' )
	iconPath.setAttribute( 'd', 'M6,15 C2.69,15 0,14.1 0,13 L0,11 C0,10.83 0.09,10.66 0.21,10.5 C0.88,11.36 3.21,12 6,12 C8.79,12 11.12,11.36 11.79,10.5 C11.92,10.66 12,10.83 12,11 L12,13 C12,14.1 9.31,15 6,15 L6,15 Z M6,11 C2.69,11 0,10.1 0,9 L0,7 C0,6.89 0.04,6.79 0.09,6.69 L0.09,6.69 C0.12,6.63 0.16,6.56 0.21,6.5 C0.88,7.36 3.21,8 6,8 C8.79,8 11.12,7.36 11.79,6.5 C11.84,6.56 11.88,6.63 11.91,6.69 L11.91,6.69 C11.96,6.79 12,6.9 12,7 L12,9 C12,10.1 9.31,11 6,11 L6,11 Z M6,7 C2.69,7 0,6.1 0,5 L0,4 L0,3 C0,1.9 2.69,1 6,1 C9.31,1 12,1.9 12,3 L12,4 L12,5 C12,6.1 9.31,7 6,7 L6,7 Z M6,2 C3.79,2 2,2.45 2,3 C2,3.55 3.79,4 6,4 C8.21,4 10,3.55 10,3 C10,2.45 8.21,2 6,2 L6,2 Z' )
	iconPath.setAttribute( 'fill-rule', 'evenodd' )
	icon.appendChild( iconPath )
	elt.appendChild( icon )
	const size     = document.createElement( 'span' )
	size.className = 'num text-emphasized'
	const sizeText = document.createTextNode( repoSizeHuman.size )
	size.appendChild( sizeText )
	elt.appendChild( size )
	const unitText = document.createTextNode( repoSizeHuman.unit )
	elt.appendChild( unitText )
	li.appendChild( elt )
	return li
}

const createModalElement = async() => {
	const token = await getStoredSetting( TOKEN_KEY )

	let div = document.getElementById( MODAL_ID )
	if( div != null ) {
		if( token != null ) {
			const tokenInput = document.getElementById( TOKEN_INPUT_ID )
			tokenInput.setAttribute( 'value', token )
		}
		return div
	}

	div             = document.createElement( 'div' )
	div.id          = MODAL_ID
	div.className   = 'grs_modal_overlay'
	const modal     = document.createElement( 'div' )
	modal.className = 'grs_modal'
	const title     = document.createElement( 'h2' )
	const titleText = document.createTextNode( 'GitHub Repository Size Settings' )
	title.appendChild( titleText )
	modal.appendChild( title )
	const content     = document.createElement( 'div' )
	content.className = 'grs_modal_content'
	const description = document.createTextNode( `You need to provide a \
    Personal Access Token to access size of private repositories. You can \
    create one in your GitHub settings.\
    (to show this dialog again, click on the size text in any public repository)` )
	content.appendChild( description )
	const form       = document.createElement( 'form' )
	form.onsubmit    = saveToken
	const tokenInput = document.createElement( 'input' )
	tokenInput.id    = TOKEN_INPUT_ID
	tokenInput.setAttribute( 'type', 'text' )
	tokenInput.setAttribute( 'name', 'gh_token' )
	if( token != null ) {
		tokenInput.setAttribute( 'value', token )
	}
	const validateButton = document.createElement( 'input' )
	validateButton.setAttribute( 'type', 'submit' )
	validateButton.setAttribute( 'value', 'Submit' )
	form.appendChild( tokenInput )
	form.appendChild( validateButton )
	content.appendChild( form )
	const closeButton     = document.createElement( 'button' )
	closeButton.onclick   = closeModal
	const closeButtonText = document.createTextNode( 'Close' )
	closeButton.appendChild( closeButtonText )
	content.appendChild( closeButton )
	modal.appendChild( content )
	div.appendChild( modal )

	const body = document.getElementsByTagName( 'body' )[ 0 ]
	body.appendChild( div )

	return div
}

const add_repo_size = async() => {
	var $main_elem = document.getElementById( 'user-repositories-list' );
	if( $main_elem ) {
		var $ul_data = $main_elem.getElementsByTagName( 'ul' );
		if( $ul_data ) {
			if( $ul_data.length > 0 ) {
				for( var $key in $ul_data ) {
					var $li = $ul_data[ $key ].getElementsByTagName( 'li' );
					if( $li ) {
						if( $li.length > 0 ) {
							for( var $li_k in $li ) {
								if( typeof $li[ $li_k ] === 'object' ) {
									embedRepoSize( $li[ $li_k ] );
								}
							}
						}
					}
				}
			}
		}
	}

	var $pinned_repos_list = document.getElementsByClassName( 'pinned-repos-list' );
	if( $pinned_repos_list ) {
		var $lis = $pinned_repos_list[ 0 ].getElementsByTagName( 'li' );
		if( $lis && $lis.length > 0 ) {
			for( var $k in $lis ) {
				if( typeof $lis[ $k ] === 'object' ) {
					var $slug = $lis[ $k ].getElementsByClassName( 'text-bold' );
					embedRepoSize( $lis[ $k ], $slug[ 0 ].getAttribute( 'href' ) );
				}
			}
		}
	}

	var $orgrepos = document.getElementsByClassName( 'org-repos' );
	for( var $k in $orgrepos ) {
		if( typeof $orgrepos[ $k ] === 'object' ) {
			var $lis = $orgrepos[ $k ].getElementsByTagName( 'li' );
			for( var $li in $lis ) {
				if( typeof $lis[ $li ] === 'object' ) {
					var slug       = null;
					var $title_div = $lis[ $li ].getElementsByTagName( 'h3' );
					var $a         = $title_div[ 0 ].getElementsByTagName( 'a' );
					slug           = $a[ 0 ].getAttribute( 'href' );
					if( slug ) {
						embedRepoSize( $lis[ $li ], slug );
					}
				}
			}
		}
	}
};

// define styles once
const style = document.createElement( 'style' )
document.head.appendChild( style )
style.sheet.insertRule( `
.grs_modal_overlay {
  position: fixed;\
  top: 0;\
  bottom: 0;\
  left: 0;\
  right: 0;\
  background: rgba(0,0,0,0.7);\
  transition: opacity 500ms;
  visibility: hidden;
  opacity: 0;
  z-index: 50;
}`, 0 )

style.sheet.insertRule( `
.grs_modal_overlay:target {
  visibility: visible;
  opacity: 1;
}`, 1 )

style.sheet.insertRule( `
.grs_modal {
  margin: 70px auto;
  padding: 20px;
  background: #fff;
  border-radius: 5px;
  width: 30%;
  position: relative;
  transition: all 5s ease-in-out;
}`, 2 )

style.sheet.insertRule( `
.grs_modal .grs_modal_content {
  max-height: 30%;
  overflow: auto;
}`, 3 );


// Update to each ajax event
document.addEventListener( 'pjax:end', injectRepoSize, false )
document.addEventListener( 'pjax:end', add_repo_size, false )

injectRepoSize();
add_repo_size();