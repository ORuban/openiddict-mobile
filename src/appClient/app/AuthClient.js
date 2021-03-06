import React from 'react';

import SafariView from 'react-native-safari-view';
import QueryString from 'query-string';
import { Linking } from 'react-native';
import { sha256 } from 'react-native-sha256';

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

        this.nonce = 'nonce_random_value'; //todo: should be a random string
        this.state = 'state_random_value'; //todo: should be a random string

        // PKCE (Proof Key for Code Exchange)
        // From "Proof Key for Code Exchange by OAuth Public Clients" RFC: https://tools.ietf.org/html/rfc7636
        //  code verifier
        //     A cryptographically random string that is used to correlate the
        //     authorization request to the token request.
    
        //  code challenge
        //     A challenge derived from the code verifier that is sent in the
        //     authorization request, to be verified against later.
    
        //  code challenge method
        //     A method that was used to derive code challenge.
        this.code_challenge_method = 'S256';
        this.code_verifier = 'code_verifier_random_value';
 
        this.handleUrl = this.handleUrl.bind(this);
     }

    async login(){
        Linking.addEventListener('url', this.handleUrl);
        
        const code_challenge = await this.getCodeChallenge(this.code_verifier);

        SafariView.show({
            url: [
                this.base_provider_url+'connect/authorize',
                '?response_type=code',
                '&client_id='+this.client_id,
                '&client_secret='+this.client_secret,
                '&scope=offline_access',
                '&redirect_uri='+this.redirect_uri,
                '&code_challenge='+code_challenge,
                '&code_challenge_method='+this.code_challenge_method,
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
            'redirect_uri': this.redirect_uri,
            'code_verifier': this.code_verifier
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

    async getCodeChallenge(code)
    {
        const hash = await sha256(code);
        let hash_bytes = parseHexString(hash);
    
        let Buffer = require('buffer/').Buffer;
        let b = new Buffer(hash_bytes);
        let base64Hash = b.toString('base64')
            .replace('+','-')
            .replace('/','_')
            .replace('=','');
        
        return base64Hash;
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

function parseHexString(str) { 
    var result = [];
    let x = 0;
    while (x < str.length) { 
        result.push(parseInt(str.substring(x, x+2), 16));
        x += 2;
    }

    return result;
}