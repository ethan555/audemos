var apiBaseURL = "https://tdyubs8tnh.execute-api.us-east-1.amazonaws.com/dev"
var drop = document.getElementById('drop');
var list = document.getElementById('list');
var accessKey = getURLVars()["AccessKey"];

function cancel(e) {
  e.preventDefault();
  return false;
}

// Get the variables stored in our URL.
function getURLVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value;
  });
  return vars;
}

// Handle when the user drops a file into the dropzone
function handleDrop(e) {
  e.preventDefault();
  var dataTransfer = e.dataTransfer;
  var files = dataTransfer.files;

  // Give progress message
  document.getElementById("progressMessage").innerHTML = "Uploading...";
  show("progressBars");

  document.getElementById('sectionBottom').classList.add("autoHeight");

  // Iterate over the dropped files and read them
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var timestamp = "";
    var key = file.name.split(" ").join("");
    var reader = new FileReader();

    // Add an event listener to the reader reading the file
    reader.addEventListener('loadend', function (e) {
      // Send a request to Lambda to get an upload URL
      fetch(apiBaseURL + "/getURL", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size
        })
      })
        .then(function (response) {
          // Receive the upload URL
          return response.json();
        })
        .then(function (json) {
          // Make sure the file was accepted
          if (json.key === "denied") { return "denied"; }
          if (json.key === "size") { return "size"; }
          // Construct the key and send the file to s3
          timestamp = "" + json.timestamp;
          key = json.key;
          return fetch(json.uploadURL, {
            method: "PUT",
            body: new Blob([reader.result], { key: key, type: file.type })
          });
        })
        .then(function (value) {
          hide("progressBars");
          if (value === "denied") {
            document.getElementById("progressMessage").innerHTML = "Unsupported filetype";
            return false;
          } else if (value === "size") {
            document.getElementById("progressMessage").innerHTML = "File larger than 200MB";
            return false;
          }
          document.getElementById("progressMessage").innerHTML = "Uploaded";
          // Load the file and add the key
          getAudioFile(key);
        });
    });

    reader.readAsArrayBuffer(file);
  }
  return false;
}

// Handle when the user enters a key into the form
function handleKey() {
  getAudioFile(accessKey);
}

function getAudioFile(key) {
  var url = "";

  // Request the URL using our accesskey from Lambda
  fetch(apiBaseURL + "/getFileURL", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: key,
    })
  })
  .then(function (response) {
    return response.json();
  })
  .then(function (json) {
    // If we found the file, update the audio player
    if (json.url === "not_found") {
      // The file was not found, say so
      console.log("File not found");
      document.getElementById('audioFile').innerHTML = "Not Found";
    } else {
      // The file was found, update the elements to the file URL
      url = json.url;
      downloadURL = json.downloadurl;

      // Update the source of the audio player
      document.getElementById('audioURL').src = url;
      document.getElementById('audioFile').innerHTML = key.split("_", 2)[1];
      show("audioBlock");
      document.getElementById('audio').load();
      document.getElementById('sectionTop').style = "top: 0px;";
      document.getElementById('sectionBottom').style = "top: 0px;";

      // Update the download link
      document.getElementById('downloadLink').href = downloadURL;

      // Update the list of keys
      addAccessKey(key);
    }
  });
}

function addAccessKey(accessKey) {
  show('keysSection');
  var audioNode = document.createElement('div');
  var url = window.location.origin + window.location.pathname + "?AccessKey=" + accessKey;
  audioNode.innerHTML = '<a id="' + accessKey + '" href="' + url + '" class="list hidden">' + accessKey + '</a>';

  var valArray = [url, accessKey];
  audioNode.value = valArray;
  list.appendChild(audioNode);

  show(accessKey);
}

// Copy the latest uploaded url
function copyURL() {
  if (list.childElementCount > 1) {
    var text = list.children[list.childElementCount - 1].value[0];
    console.log(text);
    navigator.clipboard.writeText(text).then(function () {
      console.log('Async: Successfully copied URL');
    }, function (err) {
      console.error('Async: Could not copy URL');
    });
  }
}

// Copy the latest uploaded key
function copyKey() {
  if (list.childElementCount > 1) {
    var text = list.children[list.childElementCount - 1].value[1];
    console.log(text);
    navigator.clipboard.writeText(text).then(function () {
      console.log('Async: Successfully copied URL');
    }, function (err) {
      console.error('Async: Could not copy URL');
    });
  }
}

function show(elementId) {
  document.getElementById(elementId).classList.remove("hidden");
  document.getElementById(elementId).classList.add("visible");
}

function hide(elementId) {
  document.getElementById(elementId).classList.remove("visible");
  document.getElementById(elementId).classList.add("hidden");
}

// Tell the browser we can drop on this target
drop.addEventListener('dragenter', cancel);
drop.addEventListener('dragover', cancel);
drop.addEventListener('drop', handleDrop);

// Check if the access key is set, if it is, load the file
if (accessKey != null) {
  handleKey();
} else {
  document.getElementById('audioFile').innerHTML = "No File Loaded";
}