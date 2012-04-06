Ext.define("JS.view.Main", {
    extend: 'Ext.tab.Panel',
    requires: [
        'Ext.TitleBar',
        'Ext.Img'
    ],
    
    config: {
        tabBarPosition: 'bottom',
        items: [
            {
                xclass: 'JS.view.Invitation'
            },
            {
                xclass: 'JS.view.Photos'
            },
            {
                xclass: 'JS.view.Location'
            }
        ]
    }
});