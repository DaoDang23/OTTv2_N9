class Player {

    constructor(
        name = "Player",
        color = null
    ) {

        this.name =
            name;

        this.color =
            color;
    }


    setColor(color) {

        this.color =
            color;
    }


    isBlue() {

        return this.color === "blue";
    }


    isRed() {

        return this.color === "red";
    }


    isMyPiece(piece) {

        if (!piece) {
            return false;
        }

        return (
            piece.owner ===
            this.color
        );
    }
}