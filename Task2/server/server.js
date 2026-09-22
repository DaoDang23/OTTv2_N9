const express = require("express");
const http = require("http");
const path = require("path");

const {
    WebSocketServer,
    WebSocket
} = require("ws");

const {
    RoomManager
} = require("./room");

const {
    applyMove
} = require("./game");


const app = express();

const server =
    http.createServer(app);


const wss =
    new WebSocketServer({
        server: server,
        path: "/ws"
    });


const roomManager =
    new RoomManager();


const PORT = 3000;


/*
 * Serve toàn bộ Task2
 */
app.use(
    express.static(
        path.join(
            __dirname,
            ".."
        )
    )
);


/*
 * Lấy trạng thái 6 room.
 */
app.get(
    "/api/rooms",
    (req, res) => {

        res.json({
            rooms:
                roomManager.getStatuses()
        });
    }
);


app.get(
    "/api/health",
    (req, res) => {

        res.json({
            status: "ok"
        });
    }
);


function send(ws, data) {

    if (
        ws.readyState ===
        WebSocket.OPEN
    ) {

        ws.send(
            JSON.stringify(data)
        );
    }
}


function broadcastRoom(room) {

    const players =
        room.players;


    for (
        const color of
        ["blue", "red"]
    ) {

        const player =
            players[color];


        if (!player) {
            continue;
        }


        send(
            player.ws,
            {
                type: "state",

                room: room.id,

                yourColor: color,

                started:
                    room.getPlayerCount() === 2,

                players: {

                    blue:
                        players.blue
                            ? {
                                name:
                                    players.blue.name
                            }
                            : null,

                    red:
                        players.red
                            ? {
                                name:
                                    players.red.name
                            }
                            : null
                },

                state:
                    room.state
            }
        );
    }
}


function broadcastLobby() {

    const data = {

        type: "rooms",

        rooms:
            roomManager.getStatuses()
    };


    for (
        const client of
        wss.clients
    ) {

        send(
            client,
            data
        );
    }
}


function broadcastEverything(room) {

    broadcastRoom(room);

    broadcastLobby();
}


wss.on(
    "connection",
    (ws, request) => {

        const url =
            new URL(
                request.url,
                `http://${request.headers.host}`
            );


        const roomId =
            url.searchParams.get(
                "room"
            );


        const name =
            (
                url.searchParams.get(
                    "name"
                ) ||
                "Player"
            ).substring(
                0,
                20
            );


        /*
         * Chỉ được join 1 trong 6 room.
         */
        const room =
            roomManager.getRoom(
                roomId
            );


        if (!room) {

            send(
                ws,
                {
                    type: "error",

                    message:
                        "Room không tồn tại."
                }
            );

            ws.close();

            return;
        }


        /*
         * Đã đủ 2 người.
         */
        if (
            room.getPlayerCount() >= 2
        ) {

            send(
                ws,
                {
                    type: "error",

                    message:
                        "Room đã đủ 2 người."
                }
            );

            ws.close();

            return;
        }


        /*
         * Join vào room có sẵn.
         */
        const color =
            room.addPlayer(
                ws,
                name
            );


        if (!color) {

            send(
                ws,
                {
                    type: "error",

                    message:
                        "Không thể join room."
                }
            );

            ws.close();

            return;
        }


        ws.roomId =
            roomId;

        ws.color =
            color;


        send(
            ws,
            {
                type: "joined",

                room: roomId,

                color: color
            }
        );


        /*
         * Gửi trạng thái hiện tại.
         *
         * Nếu người mới vào thay người cũ:
         * KHÔNG reset board.
         */
        broadcastEverything(room);


        ws.on(
            "message",
            raw => {

                let data;


                try {

                    data =
                        JSON.parse(
                            raw.toString()
                        );

                } catch {

                    return;
                }


                /*
                 * MOVE
                 */
                if (
                    data.type === "move"
                ) {

                    if (
                        room.getPlayerCount()
                        !== 2
                    ) {

                        send(
                            ws,
                            {
                                type: "error",

                                message:
                                    "Cần đủ 2 người chơi."
                            }
                        );

                        return;
                    }


                    const result =
                        applyMove(
                            room.state,
                            color,
                            data.from,
                            data.to
                        );


                    if (!result.ok) {

                        send(
                            ws,
                            {
                                type: "error",

                                message:
                                    result.error
                            }
                        );

                        return;
                    }


                    room.state =
                        result.state;


                    broadcastEverything(
                        room
                    );


                    /*
                     * Có người thắng.
                     *
                     * Giữ board 4 giây.
                     * Sau đó reset.
                     */
                    if (
                        room.state.winner
                    ) {

                        room.scheduleReset(
                            () => {

                                if (
                                    room.getPlayerCount()
                                    > 0
                                ) {

                                    room.reset();

                                    broadcastEverything(
                                        room
                                    );
                                }
                            }
                        );
                    }
                }


                /*
                 * RESET thủ công.
                 */
                if (
                    data.type === "reset"
                ) {

                    room.reset();

                    broadcastEverything(
                        room
                    );
                }
            }
        );


        ws.on(
            "close",
            () => {

                const currentRoom =
                    roomManager.getRoom(
                        ws.roomId
                    );


                if (!currentRoom) {
                    return;
                }


                const player =
                    currentRoom
                        .players[
                            ws.color
                        ];


                if (
                    player &&
                    player.ws === ws
                ) {

                    currentRoom.removePlayer(
                        ws.color
                    );

                    broadcastEverything(
                        currentRoom
                    );
                }
            }
        );
    }
);


server.listen(
    PORT,
    () => {

        console.log(
            "OTTv2 server running:"
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            "6 rooms are ready."
        );
    }
);