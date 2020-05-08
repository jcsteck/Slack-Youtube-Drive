require('dotenv').config();
const WebSocket = require('ws');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';
var youtubedl = require('youtube-dl');
var crypto = require('crypto');
var qs = require('qs');
var request = require('request');
var server = 'wss://my.webhookrelay.com/v1/socket';
var reconnectInterval = 1000 * 3;
var ws;
var apiKey = process.env.RELAY_KEY;
var apiSecret = process.env.RELAY_SECRET;
var connect = function () {
    ws = new WebSocket(server);
    ws.on('open', function () { 
        console.log('Connected, sending authentication request');
        ws.send(JSON.stringify({ action: 'auth', key: apiKey, secret: apiSecret }));
    });
    ws.on('message', function incoming(data) {
        //   console.log(data)
        var msg = JSON.parse(data);
        if (msg.type === 'status' && msg.status === 'authenticated') {
            console.log('Authenticated, subscribing to the bucket...')
            ws.send(JSON.stringify({ action: 'subscribe', buckets: ['slash'] }));
            return
        }
        if (msg.type === 'webhook') {
            processWebhook(qs.parse(msg.body))
        }
    });
    ws.on('error', function () {
        console.log('socket error');
    });

    ws.on('close', function () {
        console.log('socket closed, reconnecting');
        setTimeout(connect, reconnectInterval);
    });
};
var respond = function (payload, result) {
    request.post(
        payload.response_url, {
            json: result
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body)
                return
            }
            console.log(error)
        }
    );
}

var actualFilename = ''
var processWebhook = function (payload) {
    console.log('URL: ', payload.text)


    const video = youtubedl(payload.text,
      // Optional arguments passed to youtube-dl.
      ['--format=18'],
      // Additional options can be given for calling `child_process.execFile()`.
      { cwd: __dirname })
      video.on('info', function(info) {
        videoID = info.id.toString() + '.mp4';
        actualFilename = info.title.toString() + '.mp4';
        respond(payload, {
          response_type: 'in_channel',
          text: 'Getting ' + actualFilename
      })

  var videoDownload = youtubedl.exec(payload.text, ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio', '--merge-output-format', 'mp4', '-o', '%(id)s.mp4'], {}, function(err, output) {
        if (err) throw err
       
      console.log(output.join('\n'))
       

          // Will be called when the download starts.
          respond(payload, {
            response_type: 'in_channel',
            text: 'Uploading to Drive'
        })
    
    

         
        fs.readFile('credentials.json', (err, content) => {
            if (err) return console.log('Error loading client secret file:', err);
          
            authorize(JSON.parse(content), storeFiles);
          });
          
          
          function authorize(credentials, callback) {
             
              const {client_secret, client_id, redirect_uris} = credentials.installed;
              const oAuth2Client = new google.auth.OAuth2(
                  client_id, client_secret, redirect_uris[0]);
          
              fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) 
                {
                  return getAccessToken(oAuth2Client, callback);
                
                }
                oAuth2Client.setCredentials(JSON.parse(token));
                callback(oAuth2Client);
              });
            }
            
          
          
            function getAccessToken(oAuth2Client, callback) {
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
                oAuth2Client.getToken(code, (err, token) => {
                  if (err) return console.error('Error retrieving access token', err);
                  oAuth2Client.setCredentials(token);
            
                  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                  });
                  callback(oAuth2Client);
                });
              });
            }
           
    
            function storeFiles(auth) {
                console.log//("auth", JSON.stringify(auth));
                ('Authorizing Drive Credentials')
              const drive = google.drive({version: 'v3', auth});
              var fileMetadata = {
                      'name': actualFilename
              };
              var media = {
                      mimeType: 'video/mp4',
                      //PATH OF THE FILE FROM YOUR COMPUTER
                      body: fs.createReadStream(videoID)
              };
              drive.files.create({
                  resource: fileMetadata,
                  media: media,
                  fields: 'id'
              }, function (err, file) {
              if (err) {
                  // Handle error
                  console.error(err);
              } else {
                  console.log('File Id: ', file.data.id);
                  var fileURL = "https://drive.google.com/file/d/" + file.data.id + "/view";
                  console.log(fileURL)
                
                  respond(payload, {
                    response_type: 'in_channel',
                    text: fileURL
                })
                
              }
              fs.unlinkSync(videoID);
            });
            
            }
          })
      
          })
        
}
console.log('Relay Secret' + process.env.RELAY_SECRET)
console.log('Relay key' + process.env.RELAY_KEY)
connect();