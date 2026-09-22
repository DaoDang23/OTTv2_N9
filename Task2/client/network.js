class Network {

    constructor(options) {

        this.room =
            options.room;

        this.name =
            options.name;

        this.onMessage =
            options.onMessage || (
                () => {}
            );

        this.onOpen =
            options.onOpen || (
                () => {}
            );

        this.onClose =
            options.onClose || (
                () => {}
            );

        this.onError =
            options.onError || (
                () => {}
            );


        this.connect();
    }


    connect() {

        const protocol =
            location.protocol === "https:"
                ? "wss:"
                : "ws:";


        const url =
            `${protocol}//${location.host}/ws` +
            `?room=${encodeURIComponent(
                this.room
            )}` +
            `&name=${encodeURIComponent(
                this.name
            )}`;


        this.socket =
            new WebSocket(url);


        this.socket.onopen =
            () => {

                this.onOpen();
            };


        this.socket.onmessage =
            event => {

                try {

                    const data =
                        JSON.parse(
                            event.data
                        );

                    this.onMessage(
                        data
                    );

                } catch (error) {

                    console.error(
                        error
                    );
                }
            };


        this.socket.onclose =
            () => {

                this.onClose();
            };


        this.socket.onerror =
            error => {

                this.onError(
                    error
                );
            };
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


    move(
        from,
        to
    ) {

        this.send({
            type: "move",
            from,
            to
        });
    }


    reset() {

        this.send({
            type: "reset"
        });
    }


    close() {

        if (this.socket) {
            this.socket.close();
        }
    }
}