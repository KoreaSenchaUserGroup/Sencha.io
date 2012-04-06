Ext.define('JS.view.Invitation', {
	extend: 'Ext.Container',
	requires: [
        'Ext.Panel',
        'Ext.Img'
    ],
	xtype: 'invitation',

	config: {

		title: 'Invitation',
		iconCls: 'compose',
        layout:'fit',
		items: [
			{
				docked: 'top',
				xtype: 'toolbar',
				title: 'Invitation'
			},
            {
                xtype: 'panel',
                layout:'fit',
                items: [
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