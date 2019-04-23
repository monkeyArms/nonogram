


App.Navigation =
{
	
	init: function()
	{
		var self = this;
		

		$( document ).ready( function()
		{
			// common properties
			
			self.$window 				= $( window );
			self.$hamburger				= $( '#hamburger' );
			self.$siteHeader			= $( '#site-header' );
			self.$mainNav				= $( '#main-nav' );

			// mobile menu
			
			//self.resizeMenu();
			
			self.$hamburger.click( function()
			{
				self.$siteHeader.toggleClass( 'show-nav' );
				//self.resizeMenu();
			});

			self.$window.resize( function()
			{
				//self.resizeMenu();
			});
		});
	},
	
	
	
	resizeMenu: function()
	{
		if(!this.$siteHeader.hasClass( 'show-nav' )) {	return;	}
		
		
		var self		= this,
			navHeight	= self.$window.height() - self.$siteHeader.height(),
			numLinks	= self.$mainNavLinks.length,
			linkHeight	= (navHeight / numLinks);
		
		self.$mainNav.css( 'height', navHeight+'px' );
		
		self.$mainNavLinks.css( {
			height:		linkHeight+'px',
			lineHeight:	linkHeight+'px',
		});
	}

};



