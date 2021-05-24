import fs from "fs";
import readline from "readline";
import gmail from "@googleapis/gmail";
import logger from "./logger";

// If modifying these scopes, delete token.json.
const SCOPES = [
  // 'https://www.googleapis.com/auth/gmail.modify'
  "https://mail.google.com/",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

/**
 * Starting point
 */
function start() {
  // Load client secrets from a local file.
  const content = fs.readFileSync("credentials.json");
  authorize(JSON.parse(content.toString()), removeSpam);
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials: any, callback: any) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new gmail.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

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
    access_type: "offline",
    scope: SCOPES,
  });
  logger.info("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err: any, token: any) => {
      if (err) return logger.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return logger.error(err);
        logger.info("Token stored to", TOKEN_PATH);
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
function removeSpam(auth: any) {
  const gmailClient = gmail.gmail({ version: "v1", auth });
  gmailClient.users.messages
    .list({
      labelIds: ["SPAM"],
      userId: "me",
    })
    .then((result) => {
      const messages = result.data.messages;
      logger.info(`Filter result: ${JSON.stringify(messages)}`);
      if (messages && messages.length > 0) {
        const messagesId = messages
          .map((message) => message.id)
          .filter((data) => data !== undefined && data !== null)
          .map((data) => data as string);
        logger.info(`Will remove: ${JSON.stringify(messagesId)}`);
        gmailClient.users.messages
          .batchDelete({
            userId: "me",
            requestBody: {
              ids: messagesId,
            },
          })
          .then((response) => {
            logger.info(`Success remove with status code: ${response.status}`);
          })
          .catch((err) => {
            logger.error("Error when delete");
            logger.error(err);
          });
      }
    })
    .catch((error) => {
      logger.error(error);
    });
}

export default { start, removeSpam };
