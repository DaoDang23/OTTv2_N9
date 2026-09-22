const BOARD_SIZE = 9;
const boardElement = document.getElementById('game-board');
const turnIndicator = document.getElementById('turn-indicator');
const gameOverPanel = document.getElementById('game-over-panel');
const winnerMessage = document.getElementById('winner-message');
const winnerReason = document.getElementById('winner-reason');
const restartBtn = document.getElementById('restart-btn');

const PIECE_TYPES = { ROCK: '👊', PAPER: '✋', SCISSORS: '✌️' };

let gameState = [];
let currentPlayer = 1; 
let selectedCell = null; 
let gameOver = false;

restartBtn.addEventListener('click', resetGame);

function initGame() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        gameState[i] = Array(BOARD_SIZE).fill(null);
    }
    
    gameState[0][3] = { type: PIECE_TYPES.ROCK, player: 1 };
    gameState[0][4] = { type: PIECE_TYPES.PAPER, player: 1 };
    gameState[0][5] = { type: PIECE_TYPES.SCISSORS, player: 1 };
    
    gameState[8][3] = { type: PIECE_TYPES.ROCK, player: 2 };
    gameState[8][4] = { type: PIECE_TYPES.PAPER, player: 2 };
    gameState[8][5] = { type: PIECE_TYPES.SCISSORS, player: 2 };
}

function canCapture(attackerType, defenderType) {
    if (attackerType === defenderType) return 0; 
    if (attackerType === PIECE_TYPES.ROCK && defenderType === PIECE_TYPES.SCISSORS) return 1;
    if (attackerType === PIECE_TYPES.SCISSORS && defenderType === PIECE_TYPES.PAPER) return 1;
    if (attackerType === PIECE_TYPES.PAPER && defenderType === PIECE_TYPES.ROCK) return 1;
    return -1; 
}

// THÊM MỚI UI: Hàm đếm và cập nhật số lượng quân lên bảng điểm
function updateScoreboard() {
    let p1Count = { [PIECE_TYPES.ROCK]: 0, [PIECE_TYPES.PAPER]: 0, [PIECE_TYPES.SCISSORS]: 0 };
    let p2Count = { [PIECE_TYPES.ROCK]: 0, [PIECE_TYPES.PAPER]: 0, [PIECE_TYPES.SCISSORS]: 0 };

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = gameState[row][col];
            if (piece) {
                if (piece.player === 1) p1Count[piece.type]++;
                else p2Count[piece.type]++;
            }
        }
    }

    document.getElementById('p1-rock').textContent = p1Count[PIECE_TYPES.ROCK];
    document.getElementById('p1-paper').textContent = p1Count[PIECE_TYPES.PAPER];
    document.getElementById('p1-scissors').textContent = p1Count[PIECE_TYPES.SCISSORS];

    document.getElementById('p2-rock').textContent = p2Count[PIECE_TYPES.ROCK];
    document.getElementById('p2-paper').textContent = p2Count[PIECE_TYPES.PAPER];
    document.getElementById('p2-scissors').textContent = p2Count[PIECE_TYPES.SCISSORS];
    
    return { p1Count, p2Count };
}

function checkWinConditions() {
    const cellA1 = gameState[0][0];
    const cellI9 = gameState[8][8];

    if (cellA1) return endGame(cellA1.player, `Player ${cellA1.player} đã đưa quân vào ô A1!`);
    if (cellI9) return endGame(cellI9.player, `Player ${cellI9.player} đã đưa quân vào ô I9!`);

    const counts = updateScoreboard();
    if (counts.p1Count[PIECE_TYPES.ROCK] === 0) return endGame(2, "Player 1 đã mất hết quân Đấm!");
    if (counts.p1Count[PIECE_TYPES.PAPER] === 0) return endGame(2, "Player 1 đã mất hết quân Lá!");
    if (counts.p1Count[PIECE_TYPES.SCISSORS] === 0) return endGame(2, "Player 1 đã mất hết quân Kéo!");

    if (counts.p2Count[PIECE_TYPES.ROCK] === 0) return endGame(1, "Player 2 đã mất hết quân Đấm!");
    if (counts.p2Count[PIECE_TYPES.PAPER] === 0) return endGame(1, "Player 2 đã mất hết quân Lá!");
    if (counts.p2Count[PIECE_TYPES.SCISSORS] === 0) return endGame(1, "Player 2 đã mất hết quân Kéo!");
}

function endGame(winner, reason) {
    gameOver = true;
    winnerMessage.textContent = `Player ${winner} CHIẾN THẮNG!`;
    winnerMessage.style.color = winner === 1 ? '#1877f2' : '#e41e3f'; // Đổi màu chữ theo người thắng
    winnerReason.textContent = reason;
    
    gameOverPanel.classList.remove('hidden');
    turnIndicator.classList.add('hidden'); 
    document.body.classList.add('game-over'); // Thêm class để khóa UI bàn cờ
}

function resetGame() {
    gameOver = false;
    currentPlayer = 1;
    selectedCell = null;
    
    gameOverPanel.classList.add('hidden');
    turnIndicator.classList.remove('hidden');
    document.body.classList.remove('game-over');
    
    initGame();
    renderBoard();
}

function handleCellClick(row, col) {
    if (gameOver) return;

    const clickedPiece = gameState[row][col];

    if (!selectedCell) {
        if (clickedPiece && clickedPiece.player === currentPlayer) {
            selectedCell = { row, col };
            renderBoard(); 
        }
        return; 
    }

    if (selectedCell.row === row && selectedCell.col === col) {
        selectedCell = null;
        renderBoard();
        return;
    }

    if (clickedPiece && clickedPiece.player === currentPlayer) {
        selectedCell = { row, col };
        renderBoard();
        return;
    }

    const rowDiff = Math.abs(row - selectedCell.row);
    const colDiff = Math.abs(col - selectedCell.col);
    const isValidMove = rowDiff <= 1 && colDiff <= 1;

    if (isValidMove) {
        const attacker = gameState[selectedCell.row][selectedCell.col];
        let moveCompleted = false;

        if (!clickedPiece) {
            gameState[row][col] = attacker; 
            gameState[selectedCell.row][selectedCell.col] = null; 
            moveCompleted = true;
        } else {
            const defender = clickedPiece;
            const combatResult = canCapture(attacker.type, defender.type);

            if (combatResult === 1) {
                gameState[row][col] = attacker; 
                gameState[selectedCell.row][selectedCell.col] = null; 
                moveCompleted = true;
            } else if (combatResult === 0) {
                alert("Hai quân cùng loại không thể ăn nhau! Nước đi bị chặn.");
            } else if (combatResult === -1) {
                alert("Nước đi không hợp lệ! Quân của bạn yếu hơn quân đối phương.");
            }
        }

        if (moveCompleted) {
            selectedCell = null;
            checkWinConditions(); 
            
            if (!gameOver) {
                currentPlayer = currentPlayer === 1 ? 2 : 1; 
            }
            renderBoard();
        }
    } else {
        alert("Nước đi không hợp lệ! Quân cờ chỉ được đi tối đa 1 ô.");
    }
}

function renderBoard() {
    boardElement.innerHTML = ''; 
    updateScoreboard(); // Luôn đếm lại điểm mỗi khi vẽ lại bàn cờ

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            if ((row + col) % 2 !== 0) cell.classList.add('dark');
            if ((row === 0 && col === 0) || (row === 8 && col === 8)) cell.classList.add('goal-cell');
            if (selectedCell && selectedCell.row === row && selectedCell.col === col) cell.classList.add('selected');

            // THÊM MỚI UI: Gắn class valid-move (chấm xanh) cho các ô hợp lệ xung quanh quân đang chọn
            if (selectedCell) {
                const rowDiff = Math.abs(row - selectedCell.row);
                const colDiff = Math.abs(col - selectedCell.col);
                const isAdjacent = rowDiff <= 1 && colDiff <= 1 && !(row === selectedCell.row && col === selectedCell.col);
                
                if (isAdjacent) {
                    const targetPiece = gameState[row][col];
                    const attacker = gameState[selectedCell.row][selectedCell.col];
                    let isHighlightable = false;

                    if (!targetPiece) {
                        isHighlightable = true; // Ô trống -> Đi được
                    } else if (targetPiece.player !== attacker.player) {
                        if (canCapture(attacker.type, targetPiece.type) === 1) {
                            isHighlightable = true; // Quân địch yếu hơn -> Đi ăn được
                        }
                    }

                    // Nếu hợp lệ, vẽ dấu chấm lên ô
                    if (isHighlightable) {
                        cell.classList.add('valid-move');
                    }
                }
            }

            const pieceData = gameState[row][col];
            if (pieceData) {
                const pieceEl = document.createElement('div');
                pieceEl.classList.add('piece');
                pieceEl.classList.add(pieceData.player === 1 ? 'player1' : 'player2');
                pieceEl.textContent = pieceData.type; 
                cell.appendChild(pieceEl);
            }

            cell.addEventListener('click', () => handleCellClick(row, col));
            boardElement.appendChild(cell);
        }
    }

    if (!gameOver) {
        turnIndicator.textContent = `Lượt hiện tại: Player ${currentPlayer}`;
        turnIndicator.className = currentPlayer === 1 ? 'turn-p1' : 'turn-p2';
    }
}

initGame();
renderBoard();