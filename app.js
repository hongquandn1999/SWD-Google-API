const express = require('express');

const app = express();
const port = 5000;

const { google } = require('googleapis');
const OAuth2Data = require('./credential.json');


// get data from file credential.json

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URIS = OAuth2Data.web.redirect_uris[0];

const oAuth2Clients = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URIS
);

var authed = false;

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

// config template engine
app.set('view engine', 'ejs')


app.get('/', (req, res) => {
    if (!authed) {
        var url = oAuth2Clients.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        })
        console.log(url);
        res.render('index', {
            url: url
        })
    } else {

    }
})

app.listen(port, () => {
    console.log(`App is listening in port ${port}`);
})