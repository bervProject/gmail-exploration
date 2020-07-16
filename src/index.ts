import fs from 'fs';
import readline from 'readline';
import { google, gmail_v1 } from 'googleapis';

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.

  authorize(JSON.parse(content.toString()), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials: any, callback: any) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token.toString()));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client: any, callback: any) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err: any, token: any) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth: any) {
  const gmail = google.gmail({ version: 'v1', auth });
  /*gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`${label.id} - ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });*/
  setupLabels(gmail, undefined);
}

let totalProccess = 0;

function setupLabels(gmail: any, nextPageToken: any) {

  gmail.users.messages.list({
    userId: 'me',
    q: 'from:postmaster@invoices.go-jek.com',
    pageToken: nextPageToken,
  }, (err: any, res: any) => {
    if (err) return console.log('The API returned an error: ' + err);
    const messages = res.data.messages;
    totalProccess += res.data.resultSizeEstimate;
    console.log(totalProccess);
    console.log(res.data.resultSizeEstimate);
    console.log(res.data.nextPageToken);
    if (messages.length) {
      console.log('Messages:');
      //var pesan = JSON.stringify(messages);
      var labels = ['Label_7272199323353827738'];
      var messagesId = messages.map((q) => q.id);
      //messages.forEach((message) => {
      //  console.log(`- ${message.id}`);
      //});
      gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messagesId,
          addLabelIds: labels
        }
      }
        , (err: any, res: any) => {
          if (err)
            return console.log(err);
          console.log("Success batch update");
        });

      //console.log(pesan);
    } else {
      console.log('No messages found.');
    }
    if (res.data.nextPageToken) {
      setupLabels(gmail, res.data.nextPageToken);
    } else {
      return;
    }
  });

}