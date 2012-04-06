Ext.define('Ext.util.LoggerConstants', {
  statics: {
    NONE: 10,
    ERROR: 4,
    WARNING: 3,
    INFO: 2,
    DEBUG: 1,

    STR_TO_LEVEL: {
      "debug": 1,
      "info": 2,
      "warn": 3,
      "error": 4,
      "none": 10,
    },
  }
});

Ext.define('Ext.util.Logger', {
  statics: {
    level: Ext.util.LoggerConstants.ERROR,

    setLevel: function(levelString) {
      if(Ext.util.LoggerConstants.STR_TO_LEVEL[levelString]) {
        Ext.util.Logger.level = Ext.util.LoggerConstants.STR_TO_LEVEL[levelString];
      } else {
        Ext.util.Logger.level = Ext.util.LoggerConstants.NONE;
      }
    },

    debug: function() {
      if(Ext.util.Logger.level <= Ext.util.LoggerConstants.DEBUG) {
        console.log.apply(console, arguments);
      }
    },

    info: function() {
      if(Ext.util.Logger.level <= Ext.util.LoggerConstants.INFO) {
        console.log.apply(console, arguments);
      }
    },

    warn: function() {
      if(Ext.util.Logger.level <= Ext.util.LoggerConstants.WARNING) {
        console.log.apply(console, arguments);
      }
    },

    error: function() {
      if(Ext.util.Logger.level <= Ext.util.LoggerConstants.ERROR) {
        console.log.apply(console, arguments);
      }
    }
  }
});

