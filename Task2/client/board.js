class Board {

    constructor(element, onCellClick) {

        this.element = element;

        this.onCellClick =
            onCellClick || (() => {});

        this.state = {
            board: {}
        };

        this.selected = null;

        this.validTargets = [];

        this.render();
    }


    setState(state) {

        this.state = state || {
            board: {}
        };

        this.render();
    }


    setSelection(
        selected,
        validTargets = []
    ) {

        this.selected =
            selected;

        this.validTargets =
            validTargets;

        this.render();
    }


    clearSelection() {

        this.selected = null;

        this.validTargets = [];

        this.render();
    }


    createCell(
        coord,
        row,
        col
    ) {

        const cell =
            document.createElement("div");

        cell.className = "cell";


        /*
         * Ô đích của Xanh: A1
         */

        if (coord === "A1") {

            cell.classList.add(
                "goal-blue"
            );
        }


        /*
         * Ô đích của Đỏ: I9
         */

        if (coord === "I9") {

            cell.classList.add(
                "goal-red"
            );
        }


        /*
         * Quân cờ
         */

        const piece =
            this.state.board
                ? this.state.board[coord]
                : null;


        if (piece) {

            const pieceElement =
                document.createElement("div");

            pieceElement.classList.add(
                "piece",
                piece.owner
            );


            const icon =
                document.createElement("span");

            icon.className =
                "piece-icon";


            const symbols = {

                rock: "✊",

                paper: "📄",

                scissors: "✂️"
            };


            icon.textContent =
                symbols[piece.type] || "";


            pieceElement.appendChild(
                icon
            );


            cell.appendChild(
                pieceElement
            );
        }


        /*
         * Quân đang được chọn
         */

        if (
            this.selected === coord
        ) {

            cell.classList.add(
                "selected"
            );
        }


        /*
         * Ô có thể đi tới
         */

        if (
            this.validTargets.includes(
                coord
            )
        ) {

            cell.classList.add(
                "valid"
            );
        }


        cell.addEventListener(
            "click",
            () => {

                this.onCellClick(
                    coord
                );
            }
        );


        return cell;
    }


    render() {

        this.element.innerHTML = "";


        /*
         * Góc trên bên trái
         */

        const corner =
            document.createElement("div");

        corner.className =
            "board-corner";

        this.element.appendChild(
            corner
        );


        /*
         * Nhãn cột A -> I
         */

        for (
            let col = 0;
            col < 9;
            col++
        ) {

            const label =
                document.createElement("div");

            label.className =
                "col-label";

            label.textContent =
                String.fromCharCode(
                    65 + col
                );

            this.element.appendChild(
                label
            );
        }


        /*
         * Bàn cờ:
         *
         * Hàng 9 ở trên
         * Hàng 1 ở dưới
         */

        for (
            let row = 9;
            row >= 1;
            row--
        ) {

            /*
             * Nhãn hàng
             */

            const rowLabel =
                document.createElement("div");

            rowLabel.className =
                "row-label";

            rowLabel.textContent =
                row;

            this.element.appendChild(
                rowLabel
            );


            /*
             * 9 ô trong hàng
             */

            for (
                let col = 0;
                col < 9;
                col++
            ) {

                const coord =
                    String.fromCharCode(
                        65 + col
                    ) + row;


                const cell =
                    this.createCell(
                        coord,
                        row,
                        col
                    );


                /*
                 * Màu bàn cờ xen kẽ
                 */

                if (
                    (row + col) % 2 === 0
                ) {

                    cell.classList.add(
                        "cell-light"
                    );

                } else {

                    cell.classList.add(
                        "cell-dark"
                    );
                }


                /*
                 * Goal phải được giữ màu
                 * riêng
                 */

                if (
                    coord === "A1"
                ) {

                    cell.classList.add(
                        "goal-blue"
                    );
                }


                if (
                    coord === "I9"
                ) {

                    cell.classList.add(
                        "goal-red"
                    );
                }


                this.element.appendChild(
                    cell
                );
            }
        }
    }
}