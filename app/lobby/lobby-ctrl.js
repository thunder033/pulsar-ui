'use strict';
/**
 * Created by gjr8050 on 2/24/2017.
 */

const IOEvent = require('event-types').IOEvent;
const MatchEvent = require('event-types').MatchEvent;

module.exports = {LobbyCtrl,
resolve: ADT => [
    ADT.network.Connection,
    ADT.ng.$scope,
    ADT.game.ClientMatch,
    ADT.network.Client,
    ADT.ng.$state,
    ADT.network.NetworkEntity,
    ADT.network.ClientRoom,
    ADT.shared.Status,
    LobbyCtrl]};

function LobbyCtrl(Connection, $scope, ClientMatch, Client, $state, NetworkEntity, ClientRoom, Status) {

    const status = {
        LOADING        : 0,
        UNAUTHENTICATED: 1,
        READY          : 2,
        STAGING        : 4,
    };

    $scope.curStatus = status.UNAUTHENTICATED;

    // reference to match list that is updated by factory
    $scope.matches = ClientMatch.getMatchSet();
    $scope.user = null;
    $scope.status = status;
    $scope.activeRoom = null;
    $scope.rooms = [];
    $scope.fields = {
        username: 'user1',
        matchLabel: 'match1',
        selectedMatch: null,
        activeDiagram: 'api',
    };

    $scope.getPing = function() {
        return Connection.getPing();
    };

    $scope.getStatusName = function(index) {
        return Object.keys(status).reduce((name, curName) => {
            return status[curName] === index ? curName : name;
        }, '');
    };

    // creates a callback to assign a value to the scope
    function assignScope(property) {
        return function(value) {
            $scope[property] = value;
        };
    }

    function addRoom(room, active) {
        console.log('joined room ', room.getName());

        if(active || $scope.activeRoom === null) {
            $scope.activeRoom = room;
        }

        $scope.rooms.push(room);

        if($scope.activeRoom.getName() === 'lobby') {
            $scope.curStatus = status.READY;
        } else {
            $scope.curStatus = status.STAGING;
        }
    }

    Client.addEventListener(IOEvent.joinedRoom, (e) => {
        addRoom(e.room, true);
    });

    Client.addEventListener(IOEvent.leftRoom, (e) => {
        console.log('left room ', e.room.getName());
        const roomIndex = $scope.rooms.indexOf(e.room);
        if(roomIndex > -1) {
            $scope.rooms.splice(roomIndex, 0);
        }

        if(e.room.getName() !== 'lobby') {
            $scope.activeRoom = $scope.rooms[0];
            $scope.curStatus = status.READY;
        }
    });

    Client.addEventListener(MatchEvent.matchStarted, (e) => {
        console.log('start game');
        $state.go('play', {gameId: e.gameId});
    });

    Connection.ready().then(() => {
        $scope.curStatus = status.READY;

        Connection.getSocket().get().on(IOEvent.serverError, Status.error);

        Connection.getSocket().request('requestRooms').then((rooms) => {
            $scope.rooms.length = 0;
            $scope.activeRoom = null;
            console.log(rooms);
            rooms.map(id => NetworkEntity.getById(ClientRoom, id).then(addRoom));
        });

        $scope.user = Connection.getUser();
    });

    $scope.authenticate = (username) => {
        if (username.length > 0) {
            Client.authenticate({name: username})
                .then(assignScope('user'));
            $scope.curStatus = status.LOADING;
        }
    };

    $scope.joinMatch = (name) => {
        if (name && name.length > 0) {
            Client.emit(MatchEvent.requestJoin, {name});
            $scope.curStatus = status.LOADING;
        }
    };

    $scope.createMatch = (matchName) => {
        if (matchName && matchName.length > 0) {
            Client.emit(MatchEvent.requestMatch, {label: matchName});
            $scope.curStatus = status.LOADING;
        }
    };
}
