'use strict';

const crypto = require('crypto');
const express = require('express');
const Auth = require('./lib/auth.js');

const auth = new Auth({
    'apiKey': process.env.EMMA_API_KEY,
    'sharedSecret': process.env.EMMA_SECRET,
    'redirectUri': process.env.EMMA_REDIRECT_URI
});

const app = express();


app.get('/', (req, res) => {

    const state = crypto.randomBytes(16).toString('hex');

    // generate the authorization URL
    const uri = auth.generateAuthUrl(state);
    res.redirect(uri);
});


app.get('/callback', (req, res) => {

    // exchange auth code for permanent access token
    auth.getAccessToken(req.query.code)
        .then((result) => {
            console.log(result);
            res.send.bind(res)(result);
        })
        .catch((err) => {

            console.error(err.stack);
            res.status(500).send(err);
        });
});


const msg = 'open http://localhost:8080';
app.listen(8080, () => console.log(msg));
