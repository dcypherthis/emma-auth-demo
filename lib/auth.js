'use strict';

const url = require('url');
const https = require('https');
const qs = require('querystring');


/**
 * Auth class.
 */
class Auth {

    /**
     * Create an EmmaAuth instance.
     *
     * @param {Object} options Configuration options
     * @param {String} options.redirectUri The redirect URL for the Oauth2 flow
     * @param {String} options.sharedSecret The Shared Secret for the app
     * @param {String} options.apiKey The API Key for the app
     * @param {Number} [options.timeout] The request timeout
     */
    constructor(options) {
        if (
               !options
            || !options.sharedSecret
            || !options.redirectUri
            || !options.apiKey
        ) {
            throw new Error('Missing or invalid options');
        }

        this.timeout = 'timeout' in options ? options.timeout : 60000;
        this.sharedSecret = options.sharedSecret;
        this.redirectUri = options.redirectUri;
        this.apiKey = options.apiKey;
    }

    /**
     * Build the authorization URL.
     *
     * @param {String} state The state parameter
     * @return {String} The authorization URL
     * @public
     */
    generateAuthUrl(state) {

        const query = {
            client_id: this.apiKey,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            state: state
        };

        return url.format({
            hostname: 'login.e2ma.net',
            pathname: '/oauth/authorize',
            protocol: 'https:',
            query
        });
    }


    /**
     * Request an access token.
     *
     * @param {String} code The authorization code
     * @return {Promise} Promise which is fulfilled with the token
     * @public
     */
    getAccessToken(code) {
        return new Promise((resolve, reject) => {
                
            const data = qs.stringify({
                client_id: this.apiKey,
                client_secret: this.sharedSecret,
                redirect_uri: this.redirectUri,
                grant_type: 'authorization_code',
                code
            });

            const request = https.request({
                headers: {
                    'Content-Length': Buffer.byteLength(data),
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                path: '/oauth/token',
                hostname: 'login.e2ma.net',
                method: 'POST'
            });

            let timer = setTimeout(() => {
                request.abort();
                timer = null;
                reject(new Error('Request timed out'));
            }, this.timeout);

            request.on('response', (response) => {
                const status = response.statusCode;
                let body = '';

                response.setEncoding('utf8');
                response.on('data', (chunk) => body += chunk);
                response.on('end', () => {
                    let error;

                    if (!timer) return;

                    clearTimeout(timer);

                    if (status !== 200) {
                        error = new Error('Failed to get access token');
                        error.responseBody = body;
                        error.statusCode = status;
                        return reject(error);
                    }

                    try {
                        body = JSON.parse(body);
                    } catch (e) {
                        error = new Error('Failed to parse the response body');
                        error.responseBody = body;
                        error.statusCode = status;
                        return reject(error);
                    }
                    
                    const result = {
                        access_token: body.access_token,
                        account_id: body.account_ids[0]
                    };

                    resolve(result);
                });
            });

            request.on('error', (err) => {
                if (!timer) return;

                clearTimeout(timer);
                reject(err);
            });

            request.end(data);
        });
    }
}

module.exports = Auth;
