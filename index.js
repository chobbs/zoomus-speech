var request = require('request');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var count = require('quickly-count-substrings')

//Include the Zoom.us library
var Zoom = require("zoomus")({
    "key" : "<your_zoom_api_key>",
    "secret" : "<your_zoom_api_secret>"
});

//User Zoom.us ID
var myrecording = {
    host_id: "<your_zoom_host_id>"
}

// Define Google client
var speech = require('@google-cloud/speech');

// Define Google private-key file
var client = new speech.SpeechClient({
    keyFilename: '<your_google_private_key>'
});

// Local file PATH variables
var fileName = "/Users/mrstark/Desktop/convFile.wav";
var fileZoom = '/Users/mrstark/Desktop/zoomFile.mp4';//your path to source file

//init

console.log("Fetching Zoom Cloud Recording Object");
fetchRecording (myrecording);

function fetchRecording(recording) {
    // 1. Get Zoom meeting obj
    Zoom.recording.list(recording, function (res) {
        if (res.error) {
            //handle error
        } else {
            // 3. Variables declaration (this is hackey !!??!!)
            // 2. Download Zoom mp4 file from server
            download(res.meetings[0].recording_files[0].download_url, fileZoom, function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("Downloaded Zoom.mp4 meeting file");
                    // 2. Convert Zoom mp4 to .wav file
                    convertSrc(fileZoom);
                    setTimeout(function(){
                        extractTxt(fileName, function (transcription) {
                            if (transcription) {
                                countTerms(transcription, res)
                            }
                })
                    }, 10000);
                }
            })
        }
    })
};

// MuFunc: Converting MP$ files to proper codec

function convertSrc(trackFile) {
    console.log("Converting (.mp4)-to-(.wav) file");

    ffmpeg(trackFile)
        .toFormat('wav')
        .audioFrequency('16000')
        .audioChannels('1')
        .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
        })
        .on('end', function () {
            console.log('Codec processing finished, writing local file');
        })
        .save(fileName);//path where you want to save your file

};

// MuFunc: GoogleSpeech API

function extractTxt (extFile, cb) {

    console.log('Google-Speech API => Extracting Sales-Taxonomy: ');

// Reads a local audio file and converts it to base64
    var file = fs.readFileSync(extFile);
    var audioBytes = file.toString('base64');

// The audio file's encoding, sample rate in hertz, and BCP-47 language code
    const audio = {
        content: audioBytes,
    };
    const config = {
        encoding: 'LINEAR16',
        //sampleRateHertz: 16000,
        languageCode: 'en-US',
    };
    const request = {
        audio: audio,
        config: config,
    };

// Detects speech in the audio file
    client
        .recognize(request)
        .then(data => {
            const response = data[0];
            const transcription = response.results
                .map(result => result.alternatives[0].transcript)
                .join('\n');
            //console.log(`Transcription: ${transcription}`);
            //countTerms(transcription);
            return cb(transcription);
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}

// MuFunc: Download localFile from URL

function download(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var sendReq = request.get({
        url: url
    });

    // verify response code
    sendReq.on('response', function(response) {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }
    });

    // check for request errors
    sendReq.on('error', function (err) {
        fs.unlink(dest);

        if (cb) {
            return cb(err.message);
        }
    });

    sendReq.pipe(file);

    file.on('finish', function() {
        file.close(cb);  // close() is async, call cb after close completes.
    });

    file.on('error', function(err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)

        if (cb) {
            return cb(err.message);
        }
    });
}

// MuFunc: Extract-Count Sales Taxonomy Terms

function countTerms (transcribe, results) {
    //Get additional values from meeting obj from terms to watch for

    var meetingTopic = results.meetings[0].topic;
    var meetingStart = results.meetings[0].start_time;
    var meetingLength = results.meetings[0].duration;
    console.log("\n" + "Meeting Topic: " + meetingTopic + " , Meeting Start: " + meetingStart + " , Meeting Duration: " + meetingLength + 'min(s)');

    //sales terms to watch for
    // price, legal, cost, demo,
    var terms = ['price','cost','demo', 'legal', 'procurment','blocker', 'value'];
    for(var i=0, l = terms.length; i < l; i++){
        console.log(count(transcribe, terms[i]) + ": " + terms[i]);

    }

}

// MuFunc: Helper

function checkIfFile(file, cb) {
    fs.stat(file, function fsStat(err, stats) {
        if (err) {
            if (err.code === 'ENOENT') {
                return cb(null, false);
            } else {
                return cb(err);
            }
        }
        return cb(null, stats.isFile());
    });
}

// MuFunc: Helper

function displayJSON() {

    var displayResult = function (result) {
        console.log(JSON.stringify(result, null, 2));

    }
};