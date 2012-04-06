Ext.define('Ext.io.AuthStrategies', {

  statics: {
    nc: 0, // request counter used in Digest auth
    
    getRequestCounter: function() {
      return ++Ext.io.AuthStrategies.nc;
    },
    
    strategies: {
      'digest': function(realm, params, callback, scope) {
        var username = params.username;
        var password = params.password;
        
        // step 1
        // send call without digest 'response' field, causing server to return the server nonce
        realm.messaging.getService('authorization', function(authService) {
          authService.realmAuthDigest(function(result) {
            if(result.status == "success") {
              var nonce = result.value.nonce;
              var qop = "auth";
              var nc = '' + Ext.io.AuthStrategies.getRequestCounter();
              var cnonce = Ext.util.UUIDGenerator.generate();

              // http://en.wikipedia.org/wiki/Digest_access_authentication#Example_with_explanation

              // HA1 = MD5( "Mufasa:testrealm@host.com:Circle Of Life" )
              // = 939e7578ed9e3c518a452acee763bce9
              var ha1 = Ext.util.MD5(username + ":" + realm.key + ":" + password);

              var uri = realm.messaging.transport.getUrl();

              // HA2 = MD5( "GET:/dir/index.html" )
              // = 39aff3a2bab6126f332b942af96d3366
              var ha2 = Ext.util.MD5("POST:" + uri);

              /* Response = MD5( "939e7578ed9e3c518a452acee763bce9:\
                    dcd98b7102dd2f0e8b11d0f600bfb0c093:\
                    00000001:0a4f113b:auth:\
                    39aff3a2bab6126f332b942af96d3366" ) */
              var response = Ext.util.MD5(ha1 + ":" + nonce + ":" + nc +
                ":" + cnonce + ":" + qop + ":" + ha2);

              authService.realmAuthDigest(function(result) {
                if(result.status == "success" && result.value._bucket && result.value._bucket == "Users") {
                  callback.call(scope, false, Ext.create('Ext.io.User', result.value._bucket, result.value._key, result.value.data, realm.messaging));
                } else {
                  callback.call(scope, true, null);
                }
              }, realm.key, username, nonce, uri, qop, nc, cnonce, response);

            } else {
              // too bad
              callback.call(scope, true, null);
            }
          }, realm.key);
        }, this);
      }     
    }
  }
});
