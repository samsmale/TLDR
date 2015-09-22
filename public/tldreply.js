var CLIENT_ID = '923076974159-n6e31h5v73cai19i93e7enb3v6ghkr90.apps.googleusercontent.com';

var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send','https://www.googleapis.com/auth/gmail.modify'];

function checkAuth() {
  gapi.auth.authorize(
  {
    'client_id': CLIENT_ID,
    'scope': SCOPES,
    'immediate': true
  }, handleAuthResult);
}

function handleAuthResult(authResult) {
  var authorizeDiv = document.getElementById('authorize-div');
  if (authResult && !authResult.error) {
    authorizeDiv.style.display = 'none';
    loadGmailApi();
  } else {
      authorizeDiv.style.display = 'inline';
    }
}

function handleAuthClick(event) {
  gapi.auth.authorize(
    {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
  handleAuthResult);
  return false;
}

function loadGmailApi() {
  gapi.client.load('gmail', 'v1', listLabels);
}

function listLabels() {
  var request = gapi.client.gmail.users.labels.list({
                'userId': 'me'
  });
  request.execute(function(res) {
    var labels = res.labels;
    if (labels && labels.length > 0) {
      for (i = 0; i < labels.length; i++) {
        var label = labels[i];
          if (label.name == "TLDR") {
            labelId = label.id
              listMessages(labelId);
          };
      }
    } else {     
      }
  });
}

function listMessages(labelId) {
  var request = gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'labelIds': labelId
  });
  request.execute(function(res) {
    var messages = res.messages;
    if (messages && messages.length > 0) {
      console.log(messages)
      for (i = 0; i < messages.length; i++) {
        var message = messages[i].id;
        console.log(message)
        getMessage('me', message)
      }  
    } else {
      var noMessage = document.createElement("h2");
      var noNode = document.createTextNode('No Messages found.')
      noMessage.appendChild(noNode)
      document.getElementById('output').appendChild(noMessage)
      
      }
  });
}

function getMessage(userId, messageId) {
  var request = gapi.client.gmail.users.messages.get({
                'userId': 'me',
                'id': messageId,
                'format': 'full'
  });
  request.execute(function(req, res){
    var bigDiv = document.createElement("div")
    bigDiv.className += "pure-g"
    document.body.appendChild(bigDiv)
    var messageDiv = document.createElement("div");
    messageDiv.className += "pure-u-1"
    messageDiv.setAttribute("id", messageId);
    bigDiv.appendChild(messageDiv);
    var resJSON = JSON.parse(res);
    var resObj = resJSON[0].result.payload.parts[0].body.data
    for (var i = 0; i < resJSON[0].result.payload.headers.length; i++) {
      var headerName = resJSON[0].result.payload.headers[i].name
      
      if (headerName === "From" ) {
        var from = resJSON[0].result.payload.headers[i].value
        
      }
    };
    console.log(resObj)
    var data = atob(resObj)
    console.log(resJSON[0].result.payload)
    var questions = data.match(/(.*)[^! .?]+\?/g)
    var fromHeading = document.createElement("div");
    fromHeading.className += "pure-u-1-2 heading";
    fromName = from.replace(/\<.*?\>/g, "")
    console.log(fromName)
    var fromNode = document.createTextNode("From: " + fromName)
    fromHeading.appendChild(fromNode)
    document.getElementById(messageId).appendChild(fromHeading) 
    for (var i = 0; i < questions.length; i++) {
      var node = document.createElement("div");
      node.className += "pure-input-1 question"
      var textNode = document.createTextNode(questions[i])
      node.appendChild(textNode)
      document.getElementById(messageId).appendChild(node)
    };
    var textBox = document.createElement("textarea")
    textBox.id = "text"+messageId;
    textBox.className += "pure-input-1 textbox"
    document.getElementById(messageId).appendChild(textBox)
    var button = document.createElement("button")
    button.className += "pure-button pure-button-primary"
    button.addEventListener("click", function(){ 
      var body = document.getElementById("text"+messageId).value + "\n\n\n\n\n\nThis email response was sent with TL;DREPLY keep it shorter next time!"
      console.log(from)
      var email = 'From:'+"me"+'\r\n' +
                  'To:'+from+'\r\n' +
                  'Subject: In response to your questions\r\n\r\n'+
                  body;
      var base64EncodedEmail = btoa(email).replace(/\//g, '_').replace(/\+/g, '-');
      console.log(base64EncodedEmail)
      var request = gapi.client.gmail.users.messages.send({
                    'userId': 'me',
                    'raw': base64EncodedEmail
      });
      window.location.reload()
      request.execute(modifyMessage(messageId, labelId));
    })
    button.innerText = "Send"
    document.getElementById(messageId).appendChild(button)
  });            
}

function modifyMessage(messageId, labelsToRemove, callback) {
  var request = gapi.client.gmail.users.messages.modify({
                'userId': 'me',
                'id': messageId,
                'removeLabelIds': [labelsToRemove]
  });
  request.execute(function(req, res){
    console.log(res)
  });
}

