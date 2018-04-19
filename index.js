var request = require('request');
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var count = require('quickly-count-substrings')

//Include the zoom library
var Zoom = require("zoomus")({
    "key" : "mBWDvhfBQvKiNrblHA600Q",
    "secret" : "QryWblvWsu3lqMKFcs8Gfxx1LybtJL9PNzsf"
});

var myrecording = {
    host_id: "ryfKyUS0S3CQnxW95_u00Q"
}

// Define Google client and auth
var speech = require('@google-cloud/speech');

var client = new speech.SpeechClient({
    keyFilename: '/Users/mrstark/Documents/gsuite/VoiceToSpeech-a4b2c3d045a2.json'
});

var fileName = "/Users/mrstark/Desktop/myzoom.wav";
var dest = '/Users/mrstark/Desktop/myzoom.mp4';//your path to source file


//Debug-only console print message

var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));

};

console.log("Fetching Zoom Cloud Meeting Details");
fetchRecording (myrecording);

function fetchRecording(recording) {
    Zoom.recording.list(recording, function (res) {
        if (res.error) {
            //handle error
        } else {
            // 1. Download Zoom mp4 from server
            var downloadURL = res.meetings[0].recording_files[0].download_url;
            download(downloadURL, dest, function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("Downloaded Zoom.mp4 meeting file.");
                    // 2. Convert Zoom mp4 to .wav file
                    convertSrc(dest);
                    setTimeout(function(){
                        extractTxt();
                    }, 10000);
                }
            })
        }
    })
};


function convertSrc(track) {
    console.log("Converting to new Zoom.wav file.");


    ffmpeg(track)
        .toFormat('wav')
        .audioFrequency('16000')
        .audioChannels('1')
        .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
        //})
        //.on('progress', function (progress) {
            // console.log(JSON.stringify(progress));
            //console.log('Processing: ' + progress.targetSize + ' KB converted');
        })
        .on('end', function () {
            console.log('File conversion processing finished !');
        })
        .save(fileName);//path where you want to save your file

};

function extractTxt () {

    console.log('Google Extracting Sales-Taxonomy =>');

// Reads a local audio file and converts it to base64
    var file = fs.readFileSync(fileName);
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
            countTerms(transcription);
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}

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

function countTerms (transcribe) {
    //sales terms to watch for
    // price, legal, cost, demo,

    var terms = ['price','cost','demo', 'legal', 'procurment'];
    for(var i=0, l = terms.length; i < l; i++){
        //count(str, items[i])
        //console.log(terms[i] + " : " + count(transcribe, terms[i]));
        console.log(count(transcribe, terms[i]) + ": " + terms[i]);

    }

}

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