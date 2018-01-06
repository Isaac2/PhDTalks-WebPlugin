/**
 * Main app routes
 */
'use strict';

var express = require('express');
var fs = require('fs');
var multer = require('multer');
var path = require('path')

//FFMPEG
var ffmpeg = require('fluent-ffmpeg');
var command = ffmpeg();


module.exports = function(app) {
  //Routes for the API
  var router = express.Router();

  router.use(function(req, res, next) {
    // Necessary in order to receive and write files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,contenttype'); // If needed
    res.setHeader('Access-Control-Allow-Credentials', true); // If needed

    next();
  });

  //general routes
  router.get('/', function(req, res) {
    res.json({
      microservice: 'taks-microservice',
      owner: 'PhDTalks'
    });
  });

  // Server route /file is marked as the one in charge of receive the file
  router.post('/file', function(req, res) {

    var upload = multer({
      storage: multer.memoryStorage()
    }).single('userVideo')
    upload(req, res, function(err) {

      var buffer = req.file.buffer
      var type = (req.file.originalname.split("."))[1]

      // Metadata is received and then a file is written within
      var filename = req.file.fieldname + '-' + Date.now() + path.extname(req.file.originalname) + ".webm";
      fs.writeFile('./uploads/' + filename, buffer, 'binary', function(err) {
        if (err){
          res.status(500).end("File couldn't be saved");
        }else {
          console.log("Save file was a success!");
          getVideoSize("./uploads/" + filename, handleConcatVideos);
        }
      });
      res.status(200).end('File is uploaded!');

    });

  });

  function handleConcatVideos(pathToVideoRecorded, sizes){
    // Path to videos with different resolutions
    var pathTo480 = "PhD_Talks_Intro_480.mp4";
    var pathTo720 = "PhD_Talks_Intro_720.mp4";
    var pathTo1080= "PhD_Talks_Intro_1080.mp4";

    var introToUse = null;

    var width = sizes.width;
    var height = sizes.height;

    if(width === 1920 && height === 1080){
      introToUse = pathTo1080;
    }
    else if(width === 1280 && height === 720){
      introToUse = pathTo720;
    }
    else if(width === 640 && height === 480){
      introToUse = pathTo480;
    }

    if(introToUse !== null){
      console.log("Video has correct size");
      var newFileName = "TestingMerge.webm" + '-' + Date.now();
      concatVideos(introToUse, pathToVideoRecorded, newFileName);
    }
    else{
      return "Video recorded has no appropiate size (resolution)";
    }
    
  }

  // Both videos's size need to match, so this function retrieves the size
  // reading a file is an async method
  function getVideoSize(pathToVideo, callbackFunction){
    console.log("\nGetting size of recorded video");

    ffmpeg(pathToVideo)
      .ffprobe(0, function(err, data) {
        if(err){
          console.log("Error while obtaining sizes");
          console.log(err);
          return false;
        }

        var sizes = {
          width: data.streams[0].width,
          height: data.streams[0].height,
        }

        console.dir(sizes);
        callbackFunction(pathToVideo, sizes);
      }
    );
  }

  function getWidth(pathToVideo){
    ffmpeg(pathToVideo)
      .ffprobe(0, function(err, data) {
        if(err){
          console.log("Error obtaining Width");
          console.log(err);
          return false;
        }

        console.dir("Width: " + data.streams[0].width);
        return data.streams[0].width;
      }
    );
  }

  function getHeight(pathToVideo){
    ffmpeg(pathToVideo)
      .ffprobe(0, function(err, data) {
        if(err){
          console.log("Error obtaining Height");
          console.log(err);
          return false;
        }
        
        console.dir("Height: " + data.streams[0].height);
        return data.streams[0].height;
      }
    );
  }  

  function concatVideos(introVideo, recordedVideo, newFileName){

    console.log("Merging video");

    var tempPath = '/tempFiles/';
    newFileName = "./merged/" + newFileName;
  
    ffmpeg()
    // Videos (order matters) that are going to be added
      .input(introVideo)
      .input(recordedVideo)
      .input(introVideo)
      .on('error', function(err) {
      console.log('An error occurred: ' + err.message);
    })
      .on('end', function() {
        console.log('Merging finished !');
      })
      .concat(newFileName, tempPath);
  }

  // All routes use "/api/" in their path. So /file would be /api/file
  app.use('/api', router);
};
