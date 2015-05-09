var myApp = angular.module('myApp',['ngMaterial']);

myApp.controller('RespokeController', function($scope, $http) {

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
    {"name": "english", "short": "en"},
    {"name": "espanol", "short": "es"}
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
        var recipientEndpoint = $scope.client.getEndpoint({ id: $scope.friendId });
        $scope.activeCall = recipientEndpoint.startVideoCall(callOptions);
    };
    
    $scope.hangup = function() {
        $scope.activeCall.hangup();
        $scope.activeCall = null;
    };


    $scope.testTranslate = function(){
        console.log('sending...');
        var text = "Hola, me gusta Nicaragua";
        $http.get("https://www.googleapis.com/language/translate/v2?key=AIzaSyA-CYOljOaH_9kRWZ2yOhSd0Ra4FHkAyZQ&q="+encodeURI(text)+"&source=es&target=en")
        .success(function(data){
            console.log('it worked!');
            $scope.output = data.data.translations[0].translatedText;
            chrome.tts.speak($scope.output, {'lang': 'en', 'voiceName': $scope.voice, 'rate': 1.3});
        })
        .error(function(data){
            console.log('it broke :(');
        });
    }
});



myApp.filter('langFilt', function(){
    return function(objects, language){
        var return_list = [];
        console.log('objects', objects);
        if (language){
            console.log('language', language);
            console.log('objects', objects);
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
