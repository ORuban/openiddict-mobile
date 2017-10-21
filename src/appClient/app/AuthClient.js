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
                '&nonce=nonce',
                '&state=state'
                 ].join('')
               });
     }

    handleUrl (event) {
        console.log('handleUrl executing');        
        Linking.removeEventListener('url', this.handleUrl);

        SafariView.dismiss();
        
        const parsed = parseUrl(event.url);
        const code = parsed["queryParams"]["code"];
        
        this.getAccessToken(code)
            .then( (token) => console.log('Access Token: ' + token));
    }

    getAccessToken(code) {

        const body = {
            'client_id': this.client_id,
            'client_secret': this.client_secret,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': this.redirect_uri
        };
      
        return postForm(this.base_provider_url+'connect/token', body)
          .then((response) => response.json())
          .then((responseJson) => {
            return responseJson.access_token;
          })
          .catch(err => {
            console.log('There was an error' + err);
          }
          );;
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