import React from 'react';

import SafariView from 'react-native-safari-view';
import QueryString from 'query-string';
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

        this.client_id = 'appClient';
        this.client_secret = 'ECF8D87D-F510-405A-96D7-4D989D177840';
        this.redirect_uri = 'openiddictmobilesample://signin-oidc';

        this.nonce = 'nonce'; //todo: should be a random string
        this.state = 'state'; //todo: should be a random string
 
        this.handleUrl = this.handleUrl.bind(this);
     }

    login(){
        Linking.addEventListener('url', this.handleUrl);
        
        SafariView.show({
            url: [
                this.base_provider_url+'connect/authorize',
                '?response_type=code',
                '&client_id='+this.client_id,
                '&client_secret='+this.client_secret,
                '&scope=offline_access',
                '&redirect_uri='+this.redirect_uri,
                // From: http://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
                // nonce: OPTIONAL. String value used to associate a Client session with an ID Token, and to mitigate replay attacks.
                // The value is passed through unmodified from the Authentication Request to the ID Token. Sufficient entropy MUST be present in the nonce values used to prevent attackers from guessing values.
                // For implementation notes, see Section 15.5.2 (http://openid.net/specs/openid-connect-core-1_0.html#NonceNotes).
                '&nonce='+this.nonce,
                // state: RECOMMENDED. Opaque value used to maintain state between the request and the callback.
                '&state='+this.state
                 ].join('')
               });
     }

    async handleUrl (event) {
        console.log('handleUrl executing');        
        Linking.removeEventListener('url', this.handleUrl);

        SafariView.dismiss();
        
        const parsed = parseUrl(event.url);

        // todo: app MUST verify that the state value is equal to the value of state parameter in the Authorization Request.
        // const state = parsed["queryParams"]["state"];
         
        const code = parsed["queryParams"]["code"];
        
        let accessToken = await this.getAccessToken(code);
        console.log('Access Token: ' + accessToken);
    }

    async getAccessToken(code) {

        const body = {
            'client_id': this.client_id,
            'client_secret': this.client_secret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': this.redirect_uri
        };
      
        
        try {
            let rawResponse = await postForm(this.base_provider_url+'connect/token', body);
            let jsonResponse = await rawResponse.json();
            return jsonResponse.access_token;
        }
        catch(err) {
            console.log('There was an error' + err);
            // Handle exceptions
        }
    }
}

function postForm(path, form) {
    const str = [];
    for (let p in form) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(form[p]));
    }
    const body = str.join("&");
    const req = {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    };
    return fetch(path, req);
}

function parseUrl (str, opts) {
	return {
		url: str.split('?')[0] || '',
		queryParams: QueryString.parse(QueryString.extract(str), opts)
	};
};