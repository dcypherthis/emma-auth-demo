# emma auth demo

Quick demo showing how to use [express](https://expressjs.com) for the handling of the oauth flow required of [custom integrations](http://myemma.com/services/custom-integrations) with [Emma](http://myemma.com/).


## Usage

First `cp sample.env .env`, then update `.env` with your Emma app's api key,
secret, and redirect uri.

Then ...
```
source .env
npm install
npm start
```

Once you start up the express app, you'll be prompted to open
`http://localhost:8080`.  You can open that url in a browser to initiate the oauth flow, where you'll get redirected to Emma's oauth service and asked to login as an Emma account holder and grant your custom app access to your account.

After getting an authorization code, the express app will request an access
token.  At the tail end of the oauth flow, the `/callback` route will receive
an access token and emma account id:

```
{
  access_token: 'an access token for the returned account id',
  account_id: 'an emma account id'
}
```

The access token can then be used to make API calls for the given account,
e.g.:

```
curl -H "Authorization: Bearer {{ACCESS TOKEN}}" https://api.e2ma.net/{{ACCOUNT
ID}}/response
```

