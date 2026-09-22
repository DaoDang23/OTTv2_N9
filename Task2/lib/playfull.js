class Playfull {

    constructor(url) {

        this.url = url;

        this.socket = null;

        this.events = {};

    }


    connect() {

        return new Promise(
            (resolve, reject) => {

                this.socket =
                    new WebSocket(this.url);


                this.socket.addEventListener(
                    "open",
                    () => {

                        this.emit("open");

                        resolve();

                    }
                );


                this.socket.addEventListener(
                    "message",
                    (event) => {

                        let data;

                        try {

                            data =
                                JSON.parse(
                                    event.data
                                );

                        }
                        catch (error) {

                            return;

                        }


                        if (data.type) {

                            this.emit(
                                data.type,
                                data
                            );

                        }

                    }
                );


                this.socket.addEventListener(
                    "close",
                    () => {

                        this.emit("close");

                    }
                );


                this.socket.addEventListener(
                    "error",
                    (error) => {

                        this.emit(
                            "error",
                            error
                        );

                        reject(error);

                    }
                );

            }
        );
    }


    send(data) {

        if (
            this.socket &&
            this.socket.readyState ===
            WebSocket.OPEN
        ) {

            this.socket.send(
                JSON.stringify(data)
            );

        }

    }


    on(event, callback) {

        if (!this.events[event]) {

            this.events[event] = [];

        }


        this.events[event].push(
            callback
        );

    }


    emit(event, data) {

        const handlers =
            this.events[event] || [];


        for (const handler of handlers) {

            handler(data);

        }

    }

}