Ext.define('JS.view.Photos', {
	extend: 'Ext.Container',
	requires: [
        'Ext.carousel.Carousel',
        'Ext.Img'
    ],
	xtype: 'photos',

	config: {

		title: 'Photos',
		iconCls: 'star',

		layout: 'fit',

		items: [
			{
				docked: 'top',
				xtype: 'toolbar',
				title: 'Photos'
			},
            {
                xtype: 'carousel',
                direction: 'horizontal',
                directionLock: true,
                items: [
                    {
                        xtype: 'image',
                        src: 'resources/images/39385139.3.jpg',
                        cls: 'my-carousel-item-img'
                    },
                    {
                        xtype: 'image',
                        src: 'resources/images/39385139.3.jpg',
                        cls: 'my-carousel-item-img'
                    },
                    {
                        xtype: 'image',
                        src: 'resources/images/39385139.3.jpg',
                        cls: 'my-carousel-item-img'
                    },
                    {
                        xtype: 'image',
                        src: 'resources/images/39385139.3.jpg',
                        cls: 'my-carousel-item-img'
                    }
                ]
            }
		]
	}
});