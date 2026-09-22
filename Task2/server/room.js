const {
    createInitialState
} = require("./game");

const ROOM_COUNT = 6;

class Room {

    constructor(id) {

        this.id = id;

        this.players = {
            blue: null,
            red: null
        };

        this.state = createInitialState();

        this.resetTimer = null;
    }

    getPlayerCount() {

        let count = 0;

        if (this.players.blue) {
            count++;
        }

        if (this.players.red) {
            count++;
        }

        return count;
    }

    getStatus() {

        const count = this.getPlayerCount();

        let status = "empty";

        if (count === 1) {
            status = "waiting";
        }

        if (count === 2) {
            status = "playing";
        }

        return {
            id: this.id,
            count: count,
            status: status
        };
    }

    getFreeColor() {

        if (!this.players.blue) {
            return "blue";
        }

        if (!this.players.red) {
            return "red";
        }

        return null;
    }

    addPlayer(ws, name) {

        const color = this.getFreeColor();

        if (!color) {
            return null;
        }

        this.players[color] = {
            ws: ws,
            name: name || "Player",
            color: color
        };

        return color;
    }

    removePlayer(color) {

        if (!this.players[color]) {
            return;
        }

        this.players[color] = null;

        /*
         * Chỉ reset khi cả 2 người
         * đã thoát khỏi room.
         */
        if (this.getPlayerCount() === 0) {

            this.cancelReset();

            this.reset();
        }
    }

    reset() {

        this.cancelReset();

        this.state = createInitialState();
    }

    scheduleReset(callback) {

        this.cancelReset();

        this.resetTimer = setTimeout(() => {

            this.resetTimer = null;

            callback();

        }, 4000);
    }

    cancelReset() {

        if (this.resetTimer) {

            clearTimeout(this.resetTimer);

            this.resetTimer = null;
        }
    }
}


class RoomManager {

    constructor() {

        this.rooms = new Map();

        /*
         * TẠO SẴN 6 ROOM
         *
         * Không có create room.
         * Không có delete room.
         */

        for (let i = 1; i <= 6; i++) {

            const roomId = `ROOM${i}`;

            const room = new Room(roomId);

            this.rooms.set(
                roomId,
                room
            );
        }
    }

    getRoom(id) {

        return this.rooms.get(id);
    }

    getRooms() {

        return Array.from(
            this.rooms.values()
        );
    }

    getStatuses() {

        return this.getRooms().map(
            room => room.getStatus()
        );
    }
}


module.exports = {
    Room,
    RoomManager
};