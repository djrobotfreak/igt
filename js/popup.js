var myApp = angular.module('myApp',['ngMaterial']);
var recognition;


myApp.controller('RespokeController', function($scope, $http, $timeout, socket) {

    $scope.connected = false;
    $scope.translating = false;
    $scope.activeCall = null;
    $scope.username = "";
    $scope.friendId = "";
    $scope.message = "";
    
    var callOptions = {
        
        onLocalMedia: function(evt) {
            setVideo('localVideoSource', evt.element)
        },
        
        onConnect: function(evt) {
            setVideo('remoteVideoSource', evt.element)
            $scope.translating = true;
            evt.element.volume = $scope.volume;
        }
        
    };
    $scope.languages = [
    {"name": "en"},
    {"name": "es"}
    ];
    chrome.tts.getVoices(
          function(voices) {
            $scope.voices = voices;
          });

    $scope.client = new respoke.Client({
        appId: "2a56901d-78ca-4436-b698-4a7a66cdc1fc",
        baseURL: "https://api.respoke.io",
        developmentMode: true
    });
    
    // Listen for the 'connect' event
    $scope.client.listen('connect', function() {
        $scope.connected = true;
        $scope.$apply();
    });
    
    // Listen for the 'call' event
    $scope.client.listen('call', function(evt) {
        
        $scope.activeCall = evt.call;
        
        if ($scope.activeCall.initiator !== true) 
        {
            $scope.activeCall.answer(callOptions);
            $scope.activeCall.listen('hangup', function() {
                $scope.activeCall = null;
                $scope.$apply();
            });
        }
        $scope.$apply();
    });
    
    $scope.client.listen('send', function(evt) {
      $scope.$apply();
    }); 
    
    $scope.send = function(text) {
      
    };
    
    
    $scope.connect = function() {
        $scope.client.connect({
            endpointId: $scope.username
        });
        socket.emit('StartConnection', {
        name: $scope.username,
        language: $scope.language,
        voice: $scope.voice
        }, function (result) {
          if (!result) {
            console.log('Connection Not Established');
          } else {
            console.log('connection established!');
          }
        });
    };
    
    $scope.disconnect = function() {
        $scope.client.disconnect({
            endpointId: $scope.username
        });
        $scope.connected = false;
        $scope.$apply();
    };
    
    $scope.call = function() {
        var recipientEndpoint = $scope.client.getEndpoint({ id: $scope.friendID });
        $scope.activeCall = recipientEndpoint.startVideoCall(callOptions);
    };
    
    $scope.hangup = function() {
        $scope.activeCall.hangup();
        socket.emit('HangUp', ""
        );
        $scope.activeCall = null;
    };

    $scope.answer = function(data){
        var recipientEndpoint = $scope.client.getEndpoint({ id: data.name });
        $scope.activeCall = recipientEndpoint.startVideoCall(callOptions);
        socket.emit('Answer', '');
    }

    socket.on('Message', function (data) {
        translateAndSpeak(data);
    });

    socket.on('IncomingCall', function(data){
        $scope.incomingName = data.name;
    });

    socket.on('DroppedCall', function(data){
        $scope.activeCall.hangup();
        $scope.activeCall = null;
    })


    function translateAndSpeak(data){
        $http.get("https://www.googleapis.com/language/translate/v2?key=AIzaSyA-CYOljOaH_9kRWZ2yOhSd0Ra4FHkAyZQ&q="+encodeURI(data.content)+"&source="+data.lang_in+"&target="+data.lang_out)
        .success(function(data){
            $scope.output = data.data.translations[0].translatedText;
            chrome.tts.speak($scope.output, {'lang': data.lang_out, 'voiceName': data.voice, 'rate': 1.0});
        })
        .error(function(data){
            console.log('translation failed');
        });
    }


    $scope.translate = function(text){
        console.log('translating text: ', text);
        $http.get("https://www.googleapis.com/language/translate/v2?key=AIzaSyA-CYOljOaH_9kRWZ2yOhSd0Ra4FHkAyZQ&q="+encodeURI(text)+"&source="+$scope.lang_in+"&target="+$scope.lang_out)
        .success(function(data){
            // console.log('it worked!');
            $scope.output = data.data.translations[0].translatedText;
            chrome.tts.speak($scope.output, {'lang': $scope.lang_out, 'voiceName': $scope.voice, 'rate': 1.0});
        })
        .error(function(data){
            console.log('it broke :(');
        });
    }

    var last_transcript = "";
    var recognizing = false;
    function setup(){
        var final_transcript = '';
        
        var ignore_onend;
        var start_timestamp;
        if (!('webkitSpeechRecognition' in window)) {
          upgrade();
        } else {
          recognition = new webkitSpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onstart = function() {
            recognizing = true;
            // showInfo('info_speak_now');
            // start_img.src = 'images/mic-animate.gif';
          };

          recognition.onerror = function(event) {
            if (event.error == 'no-speech') {
              start_img.src = 'images/mic.gif';
              showInfo('info_no_speech');
              ignore_onend = true;
            }
            if (event.error == 'audio-capture') {
              start_img.src = 'images/mic.gif';
              showInfo('info_no_microphone');
              ignore_onend = true;
            }
            if (event.error == 'not-allowed') {
              if (event.timeStamp - start_timestamp < 100) {
                showInfo('info_blocked');
              } else {
                showInfo('info_denied');
              }
            }
          };

          recognition.onend = function() {
          recognition.start();
          };
          var timout;
          recognition.onresult = function(event) {
            $timeout.cancel(timout);
            var interim_transcript = '';
            if (typeof(event.results) == 'undefined') {
              recognition.onend = null;
              recognition.stop();
              upgrade();
              return;
            }
            for (var i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
                interim_transcript = '';
              } else {
                interim_transcript = event.results[i][0].transcript;
              }
            }
            final_transcript = capitalize(final_transcript);
            $scope.transcript = interim_transcript;
            timout = $timeout(function(){
                if (last_transcript){
                    var ndx = $scope.transcript.indexOf(last_transcript.slice(last_transcript.length < 20 ? 0 : last_transcript.length-20,  last_transcript.length));
                    console.log('found index', ndx, last_transcript);
                    if (ndx != -1){
                        $scope.transcript = $scope.transcript.slice(ndx+1, $scope.transcript.length-1);
                    }
                }
                if ($scope.transcript){
                    $scope.send($scope.transcript);

                    // last_transcript = $scope.transcript;
                    interim_transcript = '';
                    $scope.transcript = '';
                    final_transcript = '';
                    recognition.stop();
                }
            }, 600);
            // if (final_transcript || interim_transcript) {
            //   showButtons('inline-block');
            // }
          };
        }
        var two_line = /\n\n/g;
        var one_line = /\n/g;
        function linebreak(s) {
          return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
        }
        var first_char = /\S/;
        function capitalize(s) {
          return s.replace(first_char, function(m) { return m.toUpperCase(); });
        }
    }

    setup();
    

    $scope.toggle = function() {
        if (!recognizing) {
            recognition.lang = 'es-MX';
            recognition.start();
            return;
        }
        recognition.stop();
        recognizing = true;
    }



    $scope.send = function(transcript){
        socket.emit('StartConnection', {
            content: transcript,
        }, function (result) {
          if (!result) {
            console.log('Message Sent');
          } else {
            console.log('Message Failed');
          }
        });
    }
});


myApp.filter('langFilt', function(){
    return function(objects, language){
        var return_list = [];
        // console.log('objects', objects);
        if (language){
            // console.log('language', language);
            // console.log('objects', objects);
            for(var i = 0; i < objects.length; i++){
                var item = objects[i];
                if(item.lang) {
                    if (item.lang.indexOf(language) != -1){
                        return_list.push(item);
                    }
                }
            }
        }
        return return_list;
    }
})




myApp.factory('socket', function ($rootScope) {
  var socket = io.connect('http://23.239.13.253:1357');
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});

function setVideo(elementId, videoElement) {
    var videoParent = document.getElementById(elementId);
    videoParent.innerHTML = "";
    videoParent.appendChild(videoElement);
}




