class Game {

    constructor() {

        this.params =
            new URLSearchParams(
                window.location.search
            );


        this.roomId =
            this.params.get(
                "room"
            );


        this.playerName =
            this.params.get(
                "name"
            ) || "Player";


        this.state = {
            board: {},
            turn: "blue",
            winner: null
        };


        this.myColor =
            null;


        this.started =
            false;


        this.selected =
            null;


        this.network =
            null;


        this.board =
            new Board(
                document.getElementById(
                    "board"
                ),
                coord =>
                    this.handleCell(
                        coord
                    )
            );


        this.setupUI();

        this.connect();
    }


    setupUI() {

        this.roomTitle =
            document.getElementById(
                "roomTitle"
            );


        this.gameStatus =
            document.getElementById(
                "gameStatus"
            );


        this.turnStatus =
            document.getElementById(
                "turnStatus"
            );


        this.bluePlayerName =
            document.getElementById(
                "bluePlayerName"
            );


        this.redPlayerName =
            document.getElementById(
                "redPlayerName"
            );


        this.message =
            document.getElementById(
                "message"
            );


        this.resetButton =
            document.getElementById(
                "resetBtn"
            );


        this.leaveButton =
            document.getElementById(
                "leaveRoomBtn"
            );


        this.roomTitle.textContent =
            this.roomId.replace(
                "ROOM",
                "ROOM "
            );


        this.resetButton.addEventListener(
            "click",
            () => {

                if (this.network) {
                    this.network.reset();
                }
            }
        );


        this.leaveButton.addEventListener(
            "click",
            () => {

                if (this.network) {
                    this.network.close();
                }

                window.location.href =
                    "index.html";
            }
        );
    }


    connect() {

        this.network =
            new Network({

                room:
                    this.roomId,

                name:
                    this.playerName,


                onOpen: () => {

                    this.showMessage(
                        "Đã kết nối server."
                    );
                },


                onMessage: data => {

                    this.handleMessage(
                        data
                    );
                },


                onClose: () => {

                    this.showMessage(
                        "Đã mất kết nối."
                    );
                },


                onError: () => {

                    this.showMessage(
                        "Không thể kết nối server."
                    );
                }
            });
    }


    handleMessage(data) {

        if (
            data.type ===
            "joined"
        ) {

            this.myColor =
                data.color;

            return;
        }


        if (
            data.type ===
            "state"
        ) {

            this.myColor =
                data.yourColor;


            this.started =
                data.started;


            this.state =
                data.state;


            this.updatePlayers(
                data.players
            );


            this.board.setState(
                this.state
            );


            this.board.clearSelection();


            this.updateStatus();

            return;
        }


        if (
            data.type ===
            "error"
        ) {

            this.showMessage(
                data.message
            );
        }
    }


    updatePlayers(
        players
    ) {

        this.bluePlayerName.textContent =
            players.blue
                ? players.blue.name
                : "Chưa có người";


        this.redPlayerName.textContent =
            players.red
                ? players.red.name
                : "Chưa có người";
    }


    updateStatus() {

        if (!this.started) {

            this.gameStatus.textContent =
                "Đang chờ người chơi thứ 2";

            this.turnStatus.textContent =
                "Chưa bắt đầu";

            return;
        }


        if (this.state.winner) {

            const winner =
                this.state.winner ===
                "blue"
                    ? this.bluePlayerName
                        .textContent
                    : this.redPlayerName
                        .textContent;


            this.gameStatus.textContent =
                `🏆 ${winner} thắng!`;


            this.turnStatus.textContent =
                "Ván đấu sẽ reset sau 4 giây.";

            return;
        }


        this.gameStatus.textContent =
            "Đang chơi";


        if (
            this.state.turn ===
            this.myColor
        ) {

            this.turnStatus.textContent =
                "👉 Đến lượt bạn";

        } else {

            this.turnStatus.textContent =
                "⏳ Đang chờ đối thủ";
        }
    }


    handleCell(coord) {

        if (!this.started) {

            this.showMessage(
                "Chưa đủ 2 người chơi."
            );

            return;
        }


        if (this.state.winner) {
            return;
        }


        /*
         * Chưa chọn quân.
         */
        if (!this.selected) {

            const piece =
                this.state.board[
                    coord
                ];


            if (!piece) {
                return;
            }


            if (
                piece.owner !==
                this.myColor
            ) {

                this.showMessage(
                    "Đây không phải quân của bạn."
                );

                return;
            }


            if (
                this.state.turn !==
                this.myColor
            ) {

                this.showMessage(
                    "Chưa đến lượt bạn."
                );

                return;
            }


            this.selected =
                coord;


            const targets =
                this.getValidTargets(
                    coord
                );


            this.board.setSelection(
                coord,
                targets
            );


            return;
        }


        /*
         * Click lại quân đang chọn.
         */
        if (
            coord ===
            this.selected
        ) {

            this.selected =
                null;

            this.board.clearSelection();

            return;
        }


        /*
         * Click quân khác của mình.
         */
        const clickedPiece =
            this.state.board[
                coord
            ];


        if (
            clickedPiece &&
            clickedPiece.owner ===
            this.myColor
        ) {

            this.selected =
                coord;


            const targets =
                this.getValidTargets(
                    coord
                );


            this.board.setSelection(
                coord,
                targets
            );


            return;
        }


        const targets =
            this.getValidTargets(
                this.selected
            );


        if (
            !targets.includes(
                coord
            )
        ) {

            this.showMessage(
                "Nước đi không hợp lệ."
            );

            return;
        }


        /*
         * Gửi move lên server.
         */
        this.network.move(
            this.selected,
            coord
        );


        this.selected =
            null;


        this.board.clearSelection();
    }


    getValidTargets(from) {

        const targets = [];


        for (
            let row = 1;
            row <= 9;
            row++
        ) {

            for (
                let col = 0;
                col < 9;
                col++
            ) {

                const coord =
                    String.fromCharCode(
                        65 + col
                    ) + row;


                const result =
                    this.validateLocalMove(
                        from,
                        coord
                    );


                if (result) {
                    targets.push(
                        coord
                    );
                }
            }
        }


        return targets;
    }


    validateLocalMove(
        from,
        to
    ) {

        const piece =
            this.state.board[
                from
            ];


        if (!piece) {
            return false;
        }


        if (
            piece.owner !==
            this.myColor
        ) {
            return false;
        }


        if (
            this.state.turn !==
            this.myColor
        ) {
            return false;
        }


        const fromCol =
            from.charCodeAt(0) - 65;

        const fromRow =
            Number(
                from.substring(1)
            );


        const toCol =
            to.charCodeAt(0) - 65;

        const toRow =
            Number(
                to.substring(1)
            );


        const dx =
            Math.abs(
                fromCol - toCol
            );


        const dy =
            Math.abs(
                fromRow - toRow
            );


        if (
            dx === 0 &&
            dy === 0
        ) {
            return false;
        }


        if (
            dx > 1 ||
            dy > 1
        ) {
            return false;
        }


        const target =
            this.state.board[
                to
            ];


        /*
         * Ô trống.
         */
        if (!target) {
            return true;
        }


        /*
         * Quân mình.
         */
        if (
            target.owner ===
            this.myColor
        ) {
            return false;
        }


        /*
         * Cùng loại.
         */
        if (
            target.type ===
            piece.type
        ) {
            return false;
        }


        const beats = {

            rock:
                "scissors",

            scissors:
                "paper",

            paper:
                "rock"
        };


        return (
            beats[piece.type] ===
            target.type
        );
    }


    showMessage(text) {

        this.message.textContent =
            text;
    }
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        new Game();
    }
);