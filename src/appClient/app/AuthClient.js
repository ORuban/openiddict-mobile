import React from 'react';

import SafariView from 'react-native-safari-view';
//import QueryString from 'query-string';
import { Linking } from 'react-native';

export class AuthClient {
    
    constructor (config) {
        // This is the what AuthorizationServer is listening on. B
        // By default ASP.NET COre app based on Kestrel uses 500 port
        // 
        // If you need to use another port you need to  change port here 
        // and change server listening port using --urls args, like
        // > dotnet run --urls http://*:5001
        // or consider to use `WebHostBuilder.UseUrls` method
        this.base_provider_url = 'http://localhost:5000/';
 
        this.handleUrl = this.handleUrl.bind(this);
     }

    login(){
        Linking.addEventListener('url', this.handleUrl);
        
        SafariView.show({
            url: [
                this.base_provider_url+'connect/authorize',
                '?response_type=code',
                '&client_id=appClient',
                '&client_secret=ECF8D87D-F510-405A-96D7-4D989D177840',
                '&scope=offline_access',
                '&redirect_uri=openiddictmobilesample://signin-oidc',
                '&nonce=nonce',
                '&state=state'
                 ].join('')
               });
     }

    handleUrl (event) {
        console.log('handleUrl executing');        
        Linking.removeEventListener('url', this.handleUrl);

        SafariView.dismiss();
        
        // event.url
    }
}