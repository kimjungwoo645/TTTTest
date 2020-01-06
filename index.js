const uuidv4 = require('uuid/v4');

module.exports = function(server) 
{

    var rooms = [];

    var io = require('socket.io')(server, {transports: ['websocket'],});

    io.on('connection', function(socket) 
    {
        console.log("Connection");

        //방 맹글기
        var createRoom = function() 
        {
            var roomId = uuidv4();
            socket.join(roomId, function() 
            {
                var room = { roomId: roomId, clients: [{ clientId: socket.id, ready: false }] };
                rooms.push(room);

                socket.emit('join', { roomId: roomId, clientId: socket.id });
            });
        }

        //유 효 한 방 찾 기
        var getAvailableRoomId = function() 
        {
            if(rooms.length > 0) 
            {
                for (var i = 0; i < rooms.length; i++) 
                {
                    if(rooms[i].clients.length < 2) 
                    {
                        return i;
                    }
                }
            }
            return -1;
        }

        //빈 방 찾 기
        var roomIndex = getAvailableRoomId();
        if(roomIndex > -1) 
        {
            socket.join(rooms[roomIndex].roomId, function() 
            {
                var client = { clientId : socket.id, ready: false }
                rooms[roomIndex].clients.push(client);

                socket.emit('join', { roomId: rooms[roomIndex].roomId, clientId: socket.id });
            });
        }
        else 
        {
            createRoom();
        }

        //플레이어가 레디를 누를때
        socket.on('ready', function(data) 
        {
            if(!data) 
            {
                return;
            }

            var room = rooms.find(room => room.roomId === data.roomId);

            if(room) 
            {
                var clients = room.clients;
                var client = clients.find(client => client.clientId === data.clientId);

                if(client) 
                {
                    client.ready = true;
                }

                //방 안에 모두가 레디를 하면 
                if(clients.length == 2) 
                {
                    var randomFirst;
                    var first;
                    randomfirst = Math.random(0,1);

                    //플레이어 턴 랜덤
                    if(first == 0)
                    {
                        first = true;
                    }
                    else
                    {
                        first = false;
                    }

                    io.to(clients[0].clientId).emit('play', { first: first });
                    io.to(clients[1].clientId).emit('play', { first: !first });
                }
            }
        });

        //턴 변경
        socket.on('select', function(data) 
        {
            if(!data) 
            {
                return;
            }

            var index = data.index;
            var roomId = data.roomId;

            if(index > -1 && roomId) 
            {
                socket.to(roomId).emit('selected', { index: index });
            }
        });

        //승리
        socket.on('win', function(data) 
        {
            if(!data) 
            {
                return;
            }

            var roomId = data.roomId;
            var index = data.index;

            if(index > -1 && roomId) 
            {
                socket.to(roomId).emit('lose', { index: index });
            }
        });

        //무승부
        socket.on('tie', function(data) 
        {
            if(!data) 
            {
                return;
            }

            var roomId = data.roomId;
            var index = data.index;

            if(index > -1 && roomId) 
            {
                socket.to(roomId).emit('tie', { index: index });
            }
        });

        socket.on('disconnect', function(reason) 
        {
            console.log("Disconnection");
        });
    });
};