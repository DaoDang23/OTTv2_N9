const TYPES = ["rock", "paper", "scissors"];

const BEATS = {
    rock: "scissors",
    scissors: "paper",
    paper: "rock"
};

function createInitialBoard() {

    return {

        // =========================
        // XANH
        // =========================

        B5: {
            owner: "blue",
            type: "paper"
        },

        C5: {
            owner: "blue",
            type: "scissors"
        },

        B4: {
            owner: "blue",
            type: "rock"
        },

        C4: {
            owner: "blue",
            type: "paper"
        },

        D4: {
            owner: "blue",
            type: "scissors"
        },

        C3: {
            owner: "blue",
            type: "rock"
        },

        D3: {
            owner: "blue",
            type: "paper"
        },

        E3: {
            owner: "blue",
            type: "scissors"
        },

        D2: {
            owner: "blue",
            type: "rock"
        },

        E2: {
            owner: "blue",
            type: "paper"
        },


        // =========================
        // ĐỎ
        // =========================

        E8: {
            owner: "red",
            type: "paper"
        },

        F8: {
            owner: "red",
            type: "rock"
        },

        E7: {
            owner: "red",
            type: "scissors"
        },

        F7: {
            owner: "red",
            type: "paper"
        },

        G7: {
            owner: "red",
            type: "rock"
        },

        F6: {
            owner: "red",
            type: "scissors"
        },

        G6: {
            owner: "red",
            type: "paper"
        },

        H6: {
            owner: "red",
            type: "rock"
        },

        G5: {
            owner: "red",
            type: "scissors"
        },

        H5: {
            owner: "red",
            type: "paper"
        }
    };
}

function createInitialState() {
    return {
        board: createInitialBoard(),
        turn: "blue",
        winner: null,
        lastMove: null
    };
}


function otherPlayer(player) {
    return player === "blue"
        ? "red"
        : "blue";
}


function parseCoordinate(coord) {

    if (
        typeof coord !== "string" ||
        coord.length < 2
    ) {
        return null;
    }

    const col =
        coord.charCodeAt(0) - 65;

    const row =
        Number(coord.substring(1));

    if (
        col < 0 ||
        col > 8 ||
        row < 1 ||
        row > 9
    ) {
        return null;
    }

    return {
        col,
        row
    };
}


function isOneSquare(from, to) {

    const a = parseCoordinate(from);
    const b = parseCoordinate(to);

    if (!a || !b) {
        return false;
    }

    const dx =
        Math.abs(a.col - b.col);

    const dy =
        Math.abs(a.row - b.row);

    if (dx === 0 && dy === 0) {
        return false;
    }

    return dx <= 1 && dy <= 1;
}


function canCapture(attacker, target) {

    if (attacker.owner === target.owner) {
        return false;
    }

    if (attacker.type === target.type) {
        return false;
    }

    return BEATS[attacker.type] === target.type;
}


function validateMove(
    state,
    player,
    from,
    to
) {

    if (state.winner) {
        return {
            ok: false,
            error: "Ván đấu đã kết thúc."
        };
    }

    if (state.turn !== player) {
        return {
            ok: false,
            error: "Chưa đến lượt bạn."
        };
    }

    const piece =
        state.board[from];

    if (!piece) {
        return {
            ok: false,
            error: "Không có quân ở ô này."
        };
    }

    if (piece.owner !== player) {
        return {
            ok: false,
            error: "Đây không phải quân của bạn."
        };
    }

    if (!isOneSquare(from, to)) {
        return {
            ok: false,
            error: "Mỗi lượt chỉ được đi 1 ô."
        };
    }

    const target =
        state.board[to];

    // Ô trống
    if (!target) {
        return {
            ok: true
        };
    }

    // Quân cùng phe
    if (target.owner === player) {
        return {
            ok: false,
            error: "Không thể đi vào quân của mình."
        };
    }

    // Cùng loại
    if (target.type === piece.type) {
        return {
            ok: false,
            error: "Hai quân cùng loại không thể ăn nhau."
        };
    }

    // Kiểm tra RPS
    if (!canCapture(piece, target)) {
        return {
            ok: false,
            error: "Quân này không thắng được quân đối phương."
        };
    }

    return {
        ok: true
    };
}


function countType(
    board,
    player,
    type
) {

    let count = 0;

    for (const coord in board) {

        const piece = board[coord];

        if (
            piece.owner === player &&
            piece.type === type
        ) {
            count++;
        }
    }

    return count;
}


function hasLostOneType(
    board,
    player
) {

    for (const type of TYPES) {

        if (
            countType(
                board,
                player,
                type
            ) === 0
        ) {
            return true;
        }
    }

    return false;
}


function applyMove(
    state,
    player,
    from,
    to
) {

    const validation =
        validateMove(
            state,
            player,
            from,
            to
        );

    if (!validation.ok) {
        return validation;
    }

    const board = {
        ...state.board
    };

    const movingPiece = {
        ...board[from]
    };

    const captured =
        board[to]
            ? {
                ...board[to]
            }
            : null;

    delete board[from];

    board[to] = movingPiece;

    let winner = null;

    /*
     * Blue tới A1.
     */
    if (
        player === "blue" &&
        to === "A1"
    ) {
        winner = "blue";
    }

    /*
     * Red tới I9.
     */
    if (
        player === "red" &&
        to === "I9"
    ) {
        winner = "red";
    }

    /*
     * Ăn hết một loại quân đối phương.
     */
    if (!winner) {

        const opponent =
            otherPlayer(player);

        if (
            hasLostOneType(
                board,
                opponent
            )
        ) {
            winner = player;
        }
    }

    return {

        ok: true,

        captured,

        state: {

            board,

            turn:
                winner
                    ? player
                    : otherPlayer(player),

            winner,

            lastMove: {
                from,
                to,
                player,
                captured
            }
        }
    };
}


module.exports = {
    TYPES,
    BEATS,
    createInitialBoard,
    createInitialState,
    validateMove,
    applyMove
};