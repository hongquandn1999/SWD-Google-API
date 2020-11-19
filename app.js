const express = require('express');
const fs = require('fs');
const app = express();
const port = 5000;

const { google } = require('googleapis');
const OAuth2Data = require('./credential.json');


const multer = require('multer');
const { drive } = require('googleapis/build/src/apis/drive');

var Storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./images");
    },
    filename: function (req, file, callback) {
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
});

var upload = multer({
    storage: Storage,
}).single("file"); //Field name and max count

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

// information
var name, pic;

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

// config template engine
app.set('view engine', 'ejs')

// home
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
        var oAuth2 = google.oauth2({
            auth: oAuth2Clients,
            version: 'v2'
        })

        // get user information
        oAuth2.userinfo.get(function (err, response) {
            if (err) throw err

            console.log(response.data);
            name = response.data.name;
            pic = response.data.picture;

            res.render('successAuth', {
                name: name,
                pic: pic,
                success: false
            })

        })
    }
})

// /google/callserver

app.get('/google/callserver', (req, res) => {
    const code = req.query.code;

    if (code) {
        // get an access token
        oAuth2Clients.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Authentication failed !!!!');
                console.log(err)
            } else {
                console.log('Authentication successfully !!!');
                console.log(tokens);
                oAuth2Clients.setCredentials(tokens)

                authed = true;

                res.redirect('/')
            }
        })
    }
})

// Upload file
app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
        if (err) throw err
        console.log(req.file.path);
        const drive = google.drive({
            version: "v3",
            auth: oAuth2Clients
        })

        const fileMetadata = {
            name: req.file.filename
        }

        const media = {
            mimeType: req.file.mimetype,
            body: fs.createReadStream(req.file.path)
        }

        drive.files.create(
            {
                resource: fileMetadata,
                media: media,
                fields: "id",
            },
            (err, file) => {
                if (err) {
                    // Handle error
                    console.error(err);
                } else {
                    fs.unlinkSync(req.file.path)
                    res.render("successAuth", { name: name, pic: pic, success: true })
                }

            }
        );
    })




})

app.listen(port, () => {
    console.log(`App is listening in port ${port}`);
})