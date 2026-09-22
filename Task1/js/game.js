const SIZE = 9;

const ROCK = "rock";
const PAPER = "paper";
const SCISSORS = "scissors";

const BLUE = "blue";
const RED = "red";

let board = [];
let currentPlayer = BLUE;
let selected = null;
let gameOver = false;

const boardElement = document.getElementById("board");
const messageElement = document.getElementById("message");
const turnElement = document.getElementById("turn");

const symbols = {
    rock: "✊",
    paper: "📄",
    scissors: "✂️"
};


/*
    ============================================
    KHỞI TẠO BÀN CỜ
    ============================================

    Hàng trên trong ảnh:
    E8 Lá
    F8 Đấm

    E7 Kéo
    F7 Lá
    G7 Đấm

    F6 Kéo
    G6 Lá
    H6 Đấm

    G5 Kéo
    H5 Lá

    Hàng dưới:

    B5 Lá
    C5 Kéo

    B4 Đấm
    C4 Lá
    D4 Kéo

    C3 Đấm
    D3 Lá
    E3 Kéo

    D2 Đấm
    E2 Lá
*/

function createInitialBoard() {

    const newBoard = [];

    for (let row = 0; row < SIZE; row++) {

        newBoard[row] = [];

        for (let col = 0; col < SIZE; col++) {
            newBoard[row][col] = null;
        }
    }


    // =========================
    // XANH
    // =========================

    addPiece(newBoard, 4, 1, BLUE, PAPER);       // B5
    addPiece(newBoard, 4, 2, BLUE, SCISSORS);    // C5

    addPiece(newBoard, 3, 1, BLUE, ROCK);        // B4
    addPiece(newBoard, 3, 2, BLUE, PAPER);       // C4
    addPiece(newBoard, 3, 3, BLUE, SCISSORS);    // D4

    addPiece(newBoard, 2, 2, BLUE, ROCK);        // C3
    addPiece(newBoard, 2, 3, BLUE, PAPER);       // D3
    addPiece(newBoard, 2, 4, BLUE, SCISSORS);    // E3

    addPiece(newBoard, 1, 3, BLUE, ROCK);        // D2
    addPiece(newBoard, 1, 4, BLUE, PAPER);       // E2


    // =========================
    // ĐỎ
    // =========================

    addPiece(newBoard, 7, 4, RED, PAPER);        // E8
    addPiece(newBoard, 7, 5, RED, ROCK);         // F8

    addPiece(newBoard, 6, 4, RED, SCISSORS);     // E7
    addPiece(newBoard, 6, 5, RED, PAPER);        // F7
    addPiece(newBoard, 6, 6, RED, ROCK);         // G7

    addPiece(newBoard, 5, 5, RED, SCISSORS);     // F6
    addPiece(newBoard, 5, 6, RED, PAPER);        // G6
    addPiece(newBoard, 5, 7, RED, ROCK);         // H6

    addPiece(newBoard, 4, 6, RED, SCISSORS);     // G5
    addPiece(newBoard, 4, 7, RED, PAPER);        // H5

    return newBoard;
}


function addPiece(board, row, col, owner, type) {

    board[row][col] = {
        owner: owner,
        type: type
    };
}


/*
    ============================================
    KIỂM TRA QUÂN CÓ ĐI ĐƯỢC 1 Ô KHÔNG
    ============================================
*/

function isOneStep(from, to) {

    const rowDifference =
        Math.abs(from.row - to.row);

    const colDifference =
        Math.abs(from.col - to.col);

    return (
        rowDifference <= 1 &&
        colDifference <= 1 &&
        !(rowDifference === 0 && colDifference === 0)
    );
}


/*
    ============================================
    LUẬT ĂN QUÂN
    ============================================
*/

function canEat(attackerType, defenderType) {

    // Đấm ăn Kéo
    if (
        attackerType === ROCK &&
        defenderType === SCISSORS
    ) {
        return true;
    }

    // Kéo ăn Lá
    if (
        attackerType === SCISSORS &&
        defenderType === PAPER
    ) {
        return true;
    }

    // Lá ăn Đấm
    if (
        attackerType === PAPER &&
        defenderType === ROCK
    ) {
        return true;
    }

    return false;
}


/*
    ============================================
    KIỂM TRA NƯỚC ĐI
    ============================================
*/

function validateMove(from, to) {

    const movingPiece =
        board[from.row][from.col];

    const targetPiece =
        board[to.row][to.col];


    if (!movingPiece) {

        return {
            valid: false,
            message: "Không có quân ở ô này."
        };
    }


    if (movingPiece.owner !== currentPlayer) {

        return {
            valid: false,
            message: "Đây không phải quân của bạn."
        };
    }


    if (!isOneStep(from, to)) {

        return {
            valid: false,
            message:
                "Mỗi quân chỉ được đi 1 ô theo 8 hướng."
        };
    }


    // Ô trống
    if (!targetPiece) {

        return {
            valid: true,
            capture: false
        };
    }


    // Quân cùng phe
    if (targetPiece.owner === currentPlayer) {

        return {
            valid: false,
            message:
                "Không thể đi vào ô đang có quân cùng phe."
        };
    }


    // Hai quân cùng loại
    if (movingPiece.type === targetPiece.type) {

        return {
            valid: false,
            message:
                "Hai quân cùng loại không thể ăn nhau."
        };
    }


    // Kiểm tra luật Đấm - Lá - Kéo
    if (
        !canEat(
            movingPiece.type,
            targetPiece.type
        )
    ) {

        return {
            valid: false,
            message:
                "Quân này không thể ăn quân ở ô đích."
        };
    }


    return {
        valid: true,
        capture: true
    };
}


/*
    ============================================
    THỰC HIỆN NƯỚC ĐI
    ============================================
*/

function makeMove(from, to) {

    const result =
        validateMove(from, to);

    if (!result.valid) {

        messageElement.textContent =
            result.message;

        selected = null;

        renderBoard();

        return;
    }


    const movingPiece =
        board[from.row][from.col];


    const capturedPiece =
        board[to.row][to.col];


    board[to.row][to.col] =
        movingPiece;

    board[from.row][from.col] =
        null;


    selected = null;


    if (capturedPiece) {

        messageElement.textContent =
            "Ăn quân thành công!";
    }
    else {

        messageElement.textContent =
            "Đã di chuyển.";
    }


    /*
        Kiểm tra thắng do vào A1 hoặc I9
    */

    if (isGoalPosition(to)) {

        gameOver = true;

        messageElement.textContent =
            getPlayerName(currentPlayer)
            + " THẮNG! Đã đưa quân vào ô đích.";

        renderBoard();

        return;
    }


    /*
        Kiểm tra thắng do ăn hết một loại quân
    */

    if (
        hasDestroyedOneTypeOfOpponent(
            currentPlayer
        )
    ) {

        gameOver = true;

        messageElement.textContent =
            getPlayerName(currentPlayer)
            + " THẮNG! Đã ăn hết một loại quân.";

        renderBoard();

        return;
    }


    switchPlayer();

    renderBoard();
}


/*
    ============================================
    Ô ĐÍCH
    ============================================
*/

function isGoalPosition(position) {

    // A1
    if (
        position.row === 0 &&
        position.col === 0
    ) {
        return true;
    }

    // I9
    if (
        position.row === 8 &&
        position.col === 8
    ) {
        return true;
    }

    return false;
}


/*
    ============================================
    KIỂM TRA ĐÃ ĂN HẾT MỘT LOẠI QUÂN
    ============================================
*/

function hasDestroyedOneTypeOfOpponent(player) {

    const opponent =
        player === BLUE ? RED : BLUE;


    const types = [
        ROCK,
        PAPER,
        SCISSORS
    ];


    for (const type of types) {

        let count = 0;


        for (let row = 0; row < SIZE; row++) {

            for (let col = 0; col < SIZE; col++) {

                const piece =
                    board[row][col];

                if (
                    piece &&
                    piece.owner === opponent &&
                    piece.type === type
                ) {
                    count++;
                }
            }
        }


        if (count === 0) {
            return true;
        }
    }


    return false;
}


/*
    ============================================
    ĐỔI LƯỢT
    ============================================
*/

function switchPlayer() {

    if (currentPlayer === BLUE) {
        currentPlayer = RED;
    }
    else {
        currentPlayer = BLUE;
    }

    turnElement.textContent =
        currentPlayer === BLUE
            ? "XANH"
            : "ĐỎ";
}


/*
    ============================================
    CLICK VÀO BÀN CỜ
    ============================================
*/

function handleCellClick(row, col) {

    if (gameOver) {
        return;
    }


    const clickedPiece =
        board[row][col];


    /*
        Chưa chọn quân
    */

    if (!selected) {

        if (
            clickedPiece &&
            clickedPiece.owner === currentPlayer
        ) {

            selected = {
                row: row,
                col: col
            };

            messageElement.textContent =
                "Đã chọn quân. Hãy chọn ô đích.";

            renderBoard();

            return;
        }


        messageElement.textContent =
            "Hãy chọn quân của bạn.";

        return;
    }


    /*
        Đang chọn quân
        => click ô đích
    */

    const from = selected;

    const to = {
        row: row,
        col: col
    };


    makeMove(from, to);
}


/*
    ============================================
    HIỂN THỊ BÀN CỜ
    ============================================
*/

function renderBoard() {

    boardElement.innerHTML = "";


    /*
        Vì bàn cờ hiển thị từ hàng 9 xuống hàng 1
        nên render row từ 8 -> 0.
    */

    for (
        let row = SIZE - 1;
        row >= 0;
        row--
    ) {

        for (
            let col = 0;
            col < SIZE;
            col++
        ) {

            const cell =
                document.createElement("div");

            cell.className = "cell";


            /*
                A1
            */

            if (
                row === 0 &&
                col === 0
            ) {

                cell.classList.add("goal-a1");
            }


            /*
                I9
            */

            if (
                row === 8 &&
                col === 8
            ) {

                cell.classList.add("goal-i9");
            }


            /*
                Quân cờ
            */

            const piece =
                board[row][col];


            if (piece) {

                const pieceElement =
                    document.createElement("div");

                pieceElement.classList.add(
                    "piece"
                );

                pieceElement.classList.add(
                    piece.owner
                );


                pieceElement.textContent =
                    symbols[piece.type];


                cell.appendChild(
                    pieceElement
                );
            }


            /*
                Quân đang được chọn
            */

            if (
                selected &&
                selected.row === row &&
                selected.col === col
            ) {

                cell.classList.add(
                    "selected"
                );
            }


            cell.addEventListener(
                "click",
                function () {

                    handleCellClick(
                        row,
                        col
                    );

                }
            );


            boardElement.appendChild(cell);
        }
    }
}


/*
    ============================================
    TÊN NGƯỜI CHƠI
    ============================================
*/

function getPlayerName(player) {

    if (player === BLUE) {
        return "NGƯỜI CHƠI XANH";
    }

    return "NGƯỜI CHƠI ĐỎ";
}


/*
    ============================================
    RESET GAME
    ============================================
*/

function resetGame() {

    board =
        createInitialBoard();

    currentPlayer =
        BLUE;

    selected =
        null;

    gameOver =
        false;

    turnElement.textContent =
        "XANH";

    messageElement.textContent =
        "Người chơi XANH đi trước.";

    renderBoard();
}


document
    .getElementById("restart")
    .addEventListener(
        "click",
        resetGame
    );


/*
    ============================================
    START
    ============================================
*/

resetGame();