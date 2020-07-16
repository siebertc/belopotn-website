'use strict';

// [START app]

const express = require('express');
const bodyParser = require('body-parser');
const projectId = 'kole-sred';
const nodemailer = require('nodemailer');

var geoip = require('geoip-lite');
 
const app = express();
app.enable('trust proxy');
app.use(express.static(__dirname + '/views'));
const handlebars = require('express-handlebars').create({defaultLayout:'index'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// [START enable_parser]
app.use(bodyParser.urlencoded({extended: true}));
// [END enable_parser]

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
const {Datastore} = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = new Datastore({projectId:projectId});

/**
 * Insert a visit record into the database.
 *
 * @param {object} visit The visit record to insert.
 */
const insertVisit = visit => {
  return datastore.save({
    key: datastore.key('visit'),
    data: visit,
  });
};

/**
 * Retrieve the latest 10 visit records from the database.
 */
const getVisits = () => {
  const query = datastore
    .createQuery('visit')
    .order('timestamp', {descending: true})
    .limit(10);

  return datastore.runQuery(query);
};

app.use (function (req, res, next) {
  if (req.secure) {
          // request was via https, so do no special handling
          next();
  } else {
          // request was via http, so redirect to https
          res.redirect('https://' + req.headers.host + req.url);
  }
});

app.get('/', async (req, res, next) => {  
  res.render('main');
    console.log(req.headers);
    // Create a visit record to be stored in the database
    var geopeo = geoip.lookup((req.ip).substring(7));
    
    if(geo != null) {
      const visit = {
        timestamp: new Date(),
        // Store a hash of the visitor's ip address
        userIp: req.ip,
        browser: req.headers['user-agent'],
        userHost: req.headers.host,
        country: geo.country,
        region: geo.region,
        longlad: geo.ll,
        timezone: geo.timezone
      };

      try {
          await insertVisit(visit);

      } catch (error) {
          next(error);
      }
    } 
});

app.get('/dev', async (req, res, next) => {  
  res.render('main', {});

  //console.log(req.headers);

});

// app.get('/visits', async (req, res, next) => {

// });

app.post('/contact', (req, res) => {
    // Instantiate the SMTP server
    const smtpTrans = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
        user: "",
        pass: ""
        }
    })

    // Specify what the email will look like
    const mailOpts = {
        from: '[No-Reply] Mail Handler', // This is ignored by Gmail
        to: "test@test.com",
        subject: `[Contact-Form] test: ${req.body.contactsubject}`,
        text: `${req.body.contactname} (${req.body.contactemail}) says: ${req.body.contactmessage}`
    }
    if( (req.body.contactsubject == '') || (req.body.contactname == '') || (req.body.contactemail == '') || (req.body.contactmessage == '') ) {
      res.render('contact-main', {mailSent: false}); // Show a page indicating failure

    } else {
      // Attempt to send the email
      smtpTrans.sendMail(mailOpts, (error, response) => {
          if (error) {
            res.render('contact-main', {mailSent: false}); // Show a page indicating failure
          } else {
            res.render('contact-main', {mailSent: true});
          }
      })
    }
});


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
// [END app]

module.exports = app;
