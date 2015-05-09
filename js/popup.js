var myApp = angular.module('myApp',[]);

myApp.controller('RespokeController', ['$scope', function($scope) {
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
    
    $scope.call = function() {
        var recipientEndpoint = $scope.client.getEndpoint({ id: $scope.friendId });
        $scope.activeCall = recipientEndpoint.startVideoCall(callOptions);
    };
    
    $scope.hangup = function() {
        $scope.activeCall.hangup();
        $scope.activeCall = null;
    };
}]);

function setVideo(elementId, videoElement) {
    var videoParent = document.getElementById(elementId);
    videoParent.innerHTML = "";
    videoParent.appendChild(videoElement);
}
