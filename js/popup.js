var myApp = angular.module('myApp',['ngMaterial']);
var recognition;


myApp.controller('RespokeController', function($scope, $http, $timeout) {

    $scope.connected = false;
    $scope.activeCall = null;
    $scope.username = "";
    $scope.friendId = "";
    
    var callOptions = {
        
        onLocalMedia: function(evt) {
            setVideo('localVideoSource', evt.element)
        },
        
        onConnect: function(evt) {
            setVideo('remoteVideoSource', evt.element)
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
    
    
    $scope.connect = function() {
        $scope.client.connect({
            endpointId: $scope.username
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
        $scope.activeCall = null;
    };


    $scope.translate = function(text){
        console.log('translating text: ', text);
        $http.get("https://www.googleapis.com/language/translate/v2?key=AIzaSyA-CYOljOaH_9kRWZ2yOhSd0Ra4FHkAyZQ&q="+encodeURI(text)+"&source="+$scope.lang_in+"&target="+$scope.lang_out)
        .success(function(data){
            console.log('it worked!');
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
              ignore_onend = true;
            }
          };

          recognition.onend = function() {
            // recognizing = false;
            console.log("I'm ending");
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
                // console.log(event.results[i][0].transcript);
              } else {
                interim_transcript = event.results[i][0].transcript;
                // console.log(event.results[i][0].transcript);
              }
            }
            // console.log(final_transcript);
            final_transcript = capitalize(final_transcript);
            $scope.transcript = interim_transcript;
            // final_span.innerHTML = linebreak(final_transcript);
            // interim_span.innerHTML = linebreak(interim_transcript);

            timout = $timeout(function(){
                if (last_transcript){
                    var ndx = $scope.transcript.indexOf(last_transcript.slice(last_transcript.length < 20 ? 0 : last_transcript.length-20,  last_transcript.length));
                    console.log('found index', ndx, last_transcript);
                    if (ndx != -1){
                        $scope.transcript = $scope.transcript.slice(ndx+1, $scope.transcript.length-1);
                    }
                }
                $scope.translate($scope.transcript);
                // last_transcript = $scope.transcript;
                interim_transcript = '';
                $scope.transcript = '';
                final_transcript = '';
                recognition.stop();
            }, 800);
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
            recognition.start();
            return;
          }
          recognition.stop();
          recognizing = true;
          ignore_onend = false;
          // final_span.innerHTML = '';
          // interim_span.innerHTML = '';
          // start_img.src = 'images/mic-slash.gif';
          // showInfo('info_allow');
          // showButtons('none');
          // start_timestamp = event.timeStamp;
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
                if (item.lang.indexOf(language) != -1){
                    return_list.push(item);
                }
            }
        }
        return return_list;
    }
})

function setVideo(elementId, videoElement) {
    var videoParent = document.getElementById(elementId);
    videoParent.innerHTML = "";
    videoParent.appendChild(videoElement);
}

// for (var i = 0; i < langs.length; i++) {
//   select_language.options[i] = new Option(langs[i][0], i);
// }
// select_language.selectedIndex = 7;
// updateCountry();
// select_dialect.selectedIndex = 6;
// showInfo('info_start');

// function updateCountry() {
//   for (var i = select_dialect.options.length - 1; i >= 0; i--) {
//     select_dialect.remove(i);
//   }
//   var list = langs[select_language.selectedIndex];
//   for (var i = 1; i < list.length; i++) {
//     select_dialect.options.add(new Option(list[i][1], list[i][0]));
//   }
//   select_dialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
// }




