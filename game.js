const BOARD_SIZE = 9;
const boardElement = document.getElementById('game-board');
const turnIndicator = document.getElementById('turn-indicator');
const gameOverPanel = document.getElementById('game-over-panel');
const winnerMessage = document.getElementById('winner-message');
const winnerReason = document.getElementById('winner-reason');
const newGameBtn = document.getElementById('new-game-btn');

// Các Element cho Modal Chọn Chế Độ và Pop-up Thông báo
const modeSelectionOverlay = document.getElementById('mode-selection');
const notificationOverlay = document.getElementById('notification-overlay');
const notificationMessage = document.getElementById('notification-message');
const btnCloseNotify = document.getElementById('btn-close-notify');

const PIECE_TYPES = { ROCK: '👊', PAPER: '✋', SCISSORS: '✌️' };

let gameState = [];
let currentPlayer = 1; 
let selectedCell = null; 
let gameOver = false;
let currentMode = 'FIXED'; 

// --- LẮNG NGHE SỰ KIỆN NÚT BẤM ---
document.getElementById('btn-fixed').addEventListener('click', () => startGame('FIXED'));
document.getElementById('btn-random').addEventListener('click', () => startGame('RANDOM'));
newGameBtn.addEventListener('click', () => {
    modeSelectionOverlay.classList.remove('hidden'); 
});
// Đóng pop-up thông báo khi bấm nút "Đã hiểu"
btnCloseNotify.addEventListener('click', () => {
    notificationOverlay.classList.add('hidden');
});

// --- THÊM MỚI: HÀM HIỂN THỊ POP-UP THÔNG BÁO ---
function showNotification(message) {
    notificationMessage.textContent = message;
    notificationOverlay.classList.remove('hidden');
}

function startGame(mode) {
    currentMode = mode;
    modeSelectionOverlay.classList.add('hidden'); 
    gameOver = false;
    currentPlayer = 1;
    selectedCell = null;
    
    gameOverPanel.classList.add('hidden');
    turnIndicator.classList.remove('hidden');
    document.body.classList.remove('game-over');
    
    initGame(mode);
    renderBoard();
}

function initGame(mode) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        gameState[i] = Array(BOARD_SIZE).fill(null);
    }
    
    if (mode === 'FIXED') {
        const fixedPositions = [
            { r: 8, c: 2, type: PIECE_TYPES.ROCK },
            { r: 8, c: 4, type: PIECE_TYPES.ROCK },
            { r: 8, c: 6, type: PIECE_TYPES.ROCK },
            { r: 7, c: 3, type: PIECE_TYPES.PAPER },
            { r: 7, c: 4, type: PIECE_TYPES.PAPER },
            { r: 7, c: 5, type: PIECE_TYPES.PAPER },
            { r: 6, c: 4, type: PIECE_TYPES.SCISSORS },
            { r: 6, c: 5, type: PIECE_TYPES.SCISSORS },
            { r: 6, c: 6, type: PIECE_TYPES.SCISSORS }
        ];

        fixedPositions.forEach(pos => {
            gameState[pos.r][pos.c] = { type: pos.type, player: 1 };
        });

    } else if (mode === 'RANDOM') {
        const piecesToPlace = [
            PIECE_TYPES.ROCK, PIECE_TYPES.ROCK, PIECE_TYPES.ROCK,
            PIECE_TYPES.PAPER, PIECE_TYPES.PAPER, PIECE_TYPES.PAPER,
            PIECE_TYPES.SCISSORS, PIECE_TYPES.SCISSORS, PIECE_TYPES.SCISSORS
        ];

        piecesToPlace.forEach(pieceType => {
            let placed = false;
            while (!placed) {
                const r = Math.floor(Math.random() * 4) + 5; 
                const c = Math.floor(Math.random() * 9);     

                if (gameState[r][c] === null && !(r === 8 && c === 0)) {
                    gameState[r][c] = { type: pieceType, player: 1 };
                    placed = true; 
                }
            }
        });
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = gameState[r][c];
            if (piece && piece.player === 1) {
                gameState[8 - r][8 - c] = { type: piece.type, player: 2 };
            }
        }
    }
}

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
    const cellI1 = gameState[0][8]; 
    const cellA9 = gameState[8][0]; 

    if (cellI1) return endGame(cellI1.player, `Player ${cellI1.player} đã đưa quân vào ô I1!`);
    if (cellA9) return endGame(cellA9.player, `Player ${cellA9.player} đã đưa quân vào ô A9!`);

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
    winnerMessage.style.color = winner === 1 ? '#1877f2' : '#e83e8c'; 
    winnerReason.textContent = reason;
    
    gameOverPanel.classList.remove('hidden');
    turnIndicator.classList.add('hidden'); 
    document.body.classList.add('game-over'); 
}

function canCapture(attackerType, defenderType) {
    if (attackerType === defenderType) return 0; 
    if (attackerType === PIECE_TYPES.ROCK && defenderType === PIECE_TYPES.SCISSORS) return 1;
    if (attackerType === PIECE_TYPES.SCISSORS && defenderType === PIECE_TYPES.PAPER) return 1;
    if (attackerType === PIECE_TYPES.PAPER && defenderType === PIECE_TYPES.ROCK) return 1;
    return -1; 
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
        selectedCell = null; renderBoard(); return;
    }

    if (clickedPiece && clickedPiece.player === currentPlayer) {
        selectedCell = { row, col }; renderBoard(); return;
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
                // ĐÃ ĐỔI: Từ alert() thành showNotification()
                showNotification("Hai quân cùng loại không thể ăn nhau! Nước đi bị chặn.");
            } else if (combatResult === -1) {
                // ĐÃ ĐỔI: Từ alert() thành showNotification()
                showNotification("Nước đi không hợp lệ! Quân của bạn yếu hơn quân đối phương.");
            }
        }

        if (moveCompleted) {
            selectedCell = null;
            checkWinConditions(); 
            if (!gameOver) currentPlayer = currentPlayer === 1 ? 2 : 1; 
            renderBoard();
        }
    } else {
        // ĐÃ ĐỔI: Từ alert() thành showNotification()
        showNotification("Nước đi không hợp lệ! Quân cờ chỉ được đi tối đa 1 ô (giống Vua trong cờ vua).");
    }
}

function renderBoard() {
    boardElement.innerHTML = ''; 
    updateScoreboard(); 

    const emptyCorner = document.createElement('div');
    emptyCorner.classList.add('coord-label');
    boardElement.appendChild(emptyCorner);

    for (let c = 0; c < BOARD_SIZE; c++) {
        const colLabel = document.createElement('div');
        colLabel.classList.add('coord-label');
        colLabel.textContent = String.fromCharCode(65 + c);
        boardElement.appendChild(colLabel);
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
        const rowLabel = document.createElement('div');
        rowLabel.classList.add('coord-label');
        rowLabel.textContent = row + 1;
        boardElement.appendChild(rowLabel);

        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;

            if ((row + col) % 2 !== 0) cell.classList.add('dark');
            
            if (row === 0 && col === 8) cell.classList.add('goal-p1'); 
            if (row === 8 && col === 0) cell.classList.add('goal-p2'); 
            
            if (selectedCell && selectedCell.row === row && selectedCell.col === col) cell.classList.add('selected');

            if (selectedCell) {
                const rowDiff = Math.abs(row - selectedCell.row);
                const colDiff = Math.abs(col - selectedCell.col);
                const isAdjacent = rowDiff <= 1 && colDiff <= 1 && !(row === selectedCell.row && col === selectedCell.col);
                
                if (isAdjacent) {
                    const targetPiece = gameState[row][col];
                    const attacker = gameState[selectedCell.row][selectedCell.col];
                    let isHighlightable = false;

                    if (!targetPiece) isHighlightable = true; 
                    else if (targetPiece.player !== attacker.player) {
                        if (canCapture(attacker.type, targetPiece.type) === 1) isHighlightable = true; 
                    }

                    if (isHighlightable) cell.classList.add('valid-move');
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