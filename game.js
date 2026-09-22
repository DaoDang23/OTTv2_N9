// ==========================================
// 1. CÁC BIẾN & CẤU HÌNH CƠ BẢN
// ==========================================
const BOARD_SIZE = 9;
const PIECE_TYPES = { ROCK: '👊', PAPER: '✋', SCISSORS: '✌️' };

const UI = {
    board: document.getElementById('game-board'),
    turnInd: document.getElementById('turn-indicator'),
    roleInd: document.getElementById('role-indicator'),
    gameOver: document.getElementById('game-over-panel'),
    winMsg: document.getElementById('winner-message'),
    winReason: document.getElementById('winner-reason'),
    
    lobby: document.getElementById('lobby-overlay'),
    modeSelect: document.getElementById('mode-selection'),
    waiting: document.getElementById('waiting-overlay'),
    notify: document.getElementById('notification-overlay'),
    notifyMsg: document.getElementById('notification-message'),
    
    roomInput: document.getElementById('room-id-input'),
    btnCreate: document.getElementById('btn-create-room'),
    btnJoin: document.getElementById('btn-join-room'),
    btnFixed: document.getElementById('btn-fixed'),
    btnRandom: document.getElementById('btn-random'),
    btnCloseNotify: document.getElementById('btn-close-notify')
};

// TRẠNG THÁI GAME CHUNG (Đồng bộ giữa 2 máy)
let sharedState = {
    board: [],
    turn: 1,
    gameOver: false,
    winner: null,
    reason: "",
    p2Joined: false
};

// THÔNG TIN LOCAL CỦA MÁY NÀY
let myRole = 0; 
let myPlayerId = Math.random().toString(36).substr(2, 9); 
let roomId = "";
let selectedCell = null;
let isAnimating = false;

// ==========================================
// 2. LỚP MẠNG (NETWORK WRAPPER)
// ==========================================
const Network = {
    channel: null,
    init: function(room) {
        roomId = room;
        if (window.playhtml && window.playhtml.setup) {
            window.playhtml.setup({ room: room });
            window.addEventListener('message', (e) => {
                if(e.data && e.data.type === 'PLAYHTML_SYNC') this.handleMessage(e.data.payload);
            });
        } else {
            console.log("Dùng BroadcastChannel để test Local");
            this.channel = new BroadcastChannel('ottv2_' + room);
            this.channel.onmessage = (e) => this.handleMessage(e.data);
        }
    },
    send: function(payload) {
        if (window.playhtml && window.playhtml.send) {
            window.playhtml.send('PLAYHTML_SYNC', payload);
        } else if (this.channel) {
            this.channel.postMessage(payload);
        }
    },
    handleMessage: function(msg) {
        if (!msg) return;
        
        if (myRole === 1) {
            if (msg.action === 'JOIN_REQUEST') {
                sharedState.p2Joined = true;
                this.syncState(); 
                UI.waiting.classList.add('hidden');
                showNotification("Player 2 đã vào phòng. Bắt đầu chơi!");
            }
            if (msg.action === 'MOVE_REQUEST') {
                processMoveRequest(msg.fromR, msg.fromC, msg.toR, msg.toC, msg.playerId);
            }
        }
        
        if (msg.action === 'STATE_UPDATE') {
            // FIX: Chủ phòng bỏ qua bản tin echo của chính mình để tránh bị lặp hiệu ứng
            if (myRole === 1) return;

            sharedState = msg.state;
            if (myRole === 2 && !sharedState.p2Joined) return; 
            
            if (msg.moveEvent) {
                playMoveAnimation(msg.moveEvent.from, msg.moveEvent.to, msg.moveEvent.isCapture, () => {
                    renderBoard();
                    checkGameOverUI();
                });
            } else {
                renderBoard();
                checkGameOverUI();
            }
        }
    },
    syncState: function(moveEvent = null) {
        if (myRole === 1) {
            this.send({ action: 'STATE_UPDATE', state: sharedState, moveEvent: moveEvent });
            
            // FIX: Chủ phòng tự xử lý hiệu ứng trực tiếp thay vì chờ nhận lại tin nhắn
            if (moveEvent) {
                playMoveAnimation(moveEvent.from, moveEvent.to, moveEvent.isCapture, () => {
                    renderBoard();
                    checkGameOverUI();
                });
            } else {
                renderBoard();
                checkGameOverUI();
            }
        }
    }
};

// ==========================================
// 3. UI LOBBY & KHỞI TẠO
// ==========================================
UI.btnCreate.addEventListener('click', () => {
    const r = UI.roomInput.value.trim() || 'ROOM_' + Math.floor(Math.random()*10000);
    myRole = 1;
    UI.roleInd.textContent = "Bạn là: Player 1 (Chủ phòng) - Xanh";
    document.getElementById('display-room-id').textContent = r;
    
    Network.init(r);
    UI.lobby.classList.add('hidden');
    UI.modeSelect.classList.remove('hidden'); 
});

UI.btnJoin.addEventListener('click', () => {
    const r = UI.roomInput.value.trim();
    if (!r) return alert("Vui lòng nhập mã phòng!");
    
    myRole = 2;
    UI.roleInd.textContent = "Bạn là: Player 2 (Khách) - Hồng";
    Network.init(r);
    
    Network.send({ action: 'JOIN_REQUEST', playerId: myPlayerId });
    UI.lobby.classList.add('hidden');
});

UI.btnFixed.addEventListener('click', () => hostSetupGame('FIXED'));
UI.btnRandom.addEventListener('click', () => hostSetupGame('RANDOM'));
UI.btnCloseNotify.addEventListener('click', () => UI.notify.classList.add('hidden'));

function showNotification(msg) {
    UI.notifyMsg.textContent = msg;
    UI.notify.classList.remove('hidden');
}

function hostSetupGame(mode) {
    UI.modeSelect.classList.add('hidden');
    UI.waiting.classList.remove('hidden'); 
    
    sharedState.board = [];
    for (let i = 0; i < BOARD_SIZE; i++) sharedState.board[i] = Array(BOARD_SIZE).fill(null);
    sharedState.turn = 1;
    sharedState.gameOver = false;
    sharedState.winner = null;

    if (mode === 'FIXED') {
        const fixedPositions = [
            { r: 8, c: 2, type: PIECE_TYPES.ROCK }, { r: 8, c: 4, type: PIECE_TYPES.ROCK }, { r: 8, c: 6, type: PIECE_TYPES.ROCK },
            { r: 7, c: 3, type: PIECE_TYPES.PAPER }, { r: 7, c: 4, type: PIECE_TYPES.PAPER }, { r: 7, c: 5, type: PIECE_TYPES.PAPER },
            { r: 6, c: 4, type: PIECE_TYPES.SCISSORS }, { r: 6, c: 5, type: PIECE_TYPES.SCISSORS }, { r: 6, c: 6, type: PIECE_TYPES.SCISSORS }
        ];
        fixedPositions.forEach(pos => sharedState.board[pos.r][pos.c] = { type: pos.type, player: 1 });
    } else {
        const pieces = [PIECE_TYPES.ROCK, PIECE_TYPES.ROCK, PIECE_TYPES.ROCK, PIECE_TYPES.PAPER, PIECE_TYPES.PAPER, PIECE_TYPES.PAPER, PIECE_TYPES.SCISSORS, PIECE_TYPES.SCISSORS, PIECE_TYPES.SCISSORS];
        pieces.forEach(pieceType => {
            let placed = false;
            while (!placed) {
                const r = Math.floor(Math.random() * 4) + 5; 
                const c = Math.floor(Math.random() * 9);     
                if (sharedState.board[r][c] === null && !(r === 8 && c === 0)) {
                    sharedState.board[r][c] = { type: pieceType, player: 1 };
                    placed = true; 
                }
            }
        });
    }

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const piece = sharedState.board[r][c];
            if (piece && piece.player === 1) sharedState.board[8 - r][8 - c] = { type: piece.type, player: 2 };
        }
    }
    renderBoard();
}

// ==========================================
// 4. LOGIC XỬ LÝ NƯỚC ĐI
// ==========================================
function canCapture(attackerType, defenderType) {
    if (attackerType === defenderType) return 0; 
    if (attackerType === PIECE_TYPES.ROCK && defenderType === PIECE_TYPES.SCISSORS) return 1;
    if (attackerType === PIECE_TYPES.SCISSORS && defenderType === PIECE_TYPES.PAPER) return 1;
    if (attackerType === PIECE_TYPES.PAPER && defenderType === PIECE_TYPES.ROCK) return 1;
    return -1; 
}

function processMoveRequest(fromR, fromC, toR, toC, playerId) {
    if (sharedState.gameOver) return;
    if (playerId !== myPlayerId && sharedState.turn !== 2) return;
    
    const attacker = sharedState.board[fromR][fromC];
    const target = sharedState.board[toR][toC];

    const reqPlayerNum = (playerId === myPlayerId) ? 1 : 2;
    if (!attacker || attacker.player !== reqPlayerNum) return;
    if (Math.abs(toR - fromR) > 1 || Math.abs(toC - fromC) > 1) return;

    let isCapture = false;
    if (target) {
        const combat = canCapture(attacker.type, target.type);
        if (combat !== 1) return; 
        isCapture = true;
    }

    sharedState.board[toR][toC] = attacker;
    sharedState.board[fromR][fromC] = null;
    
    checkWinConditionsServer();

    if (!sharedState.gameOver) {
        sharedState.turn = sharedState.turn === 1 ? 2 : 1;
    }

    Network.syncState({ from: {r: fromR, c: fromC}, to: {r: toR, c: toC}, isCapture: isCapture });
}

function checkWinConditionsServer() {
    const cellI1 = sharedState.board[0][8]; 
    const cellA9 = sharedState.board[8][0]; 

    if (cellI1) return setWinner(cellI1.player, `Player ${cellI1.player} đã đưa quân vào ô I1!`);
    if (cellA9) return setWinner(cellA9.player, `Player ${cellA9.player} đã đưa quân vào ô A9!`);

    const counts = { p1: { [PIECE_TYPES.ROCK]:0, [PIECE_TYPES.PAPER]:0, [PIECE_TYPES.SCISSORS]:0 },
                     p2: { [PIECE_TYPES.ROCK]:0, [PIECE_TYPES.PAPER]:0, [PIECE_TYPES.SCISSORS]:0 } };
                     
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const p = sharedState.board[r][c];
            if (p) counts[p.player === 1 ? 'p1' : 'p2'][p.type]++;
        }
    }

    if (counts.p1[PIECE_TYPES.ROCK] === 0) return setWinner(2, "Player 1 mất hết Đấm!");
    if (counts.p1[PIECE_TYPES.PAPER] === 0) return setWinner(2, "Player 1 mất hết Lá!");
    if (counts.p1[PIECE_TYPES.SCISSORS] === 0) return setWinner(2, "Player 1 mất hết Kéo!");
    if (counts.p2[PIECE_TYPES.ROCK] === 0) return setWinner(1, "Player 2 mất hết Đấm!");
    if (counts.p2[PIECE_TYPES.PAPER] === 0) return setWinner(1, "Player 2 mất hết Lá!");
    if (counts.p2[PIECE_TYPES.SCISSORS] === 0) return setWinner(1, "Player 2 mất hết Kéo!");
}

function setWinner(winnerId, reason) {
    sharedState.gameOver = true;
    sharedState.winner = winnerId;
    sharedState.reason = reason;
}

// ==========================================
// 5. GIAO DIỆN & TƯƠNG TÁC
// ==========================================
function handleCellClick(row, col) {
    if (sharedState.gameOver || isAnimating || myRole === 0) return;
    
    if (sharedState.turn !== myRole) {
        return showNotification("Chưa tới lượt của bạn!");
    }

    const clickedPiece = sharedState.board[row][col];

    if (!selectedCell) {
        if (clickedPiece && clickedPiece.player === myRole) {
            selectedCell = { row, col };
            renderBoard(); 
        }
        return; 
    }

    if (selectedCell.row === row && selectedCell.col === col) {
        selectedCell = null; renderBoard(); return;
    }

    if (clickedPiece && clickedPiece.player === myRole) {
        selectedCell = { row, col }; renderBoard(); return;
    }

    if (myRole === 1) {
        // FIX: Hủy chọn ô ngay lập tức để tránh lỗi crash lúc vẽ lại bảng
        const fromR = selectedCell.row;
        const fromC = selectedCell.col;
        selectedCell = null; 
        processMoveRequest(fromR, fromC, row, col, myPlayerId);
    } else {
        Network.send({
            action: 'MOVE_REQUEST',
            fromR: selectedCell.row, fromC: selectedCell.col,
            toR: row, toC: col,
            playerId: myPlayerId
        });
        selectedCell = null;
        renderBoard(); 
    }
}

function updateScoreboard() {
    let p1Count = { [PIECE_TYPES.ROCK]: 0, [PIECE_TYPES.PAPER]: 0, [PIECE_TYPES.SCISSORS]: 0 };
    let p2Count = { [PIECE_TYPES.ROCK]: 0, [PIECE_TYPES.PAPER]: 0, [PIECE_TYPES.SCISSORS]: 0 };

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = sharedState.board[row][col];
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
}

function renderBoard() {
    if (!sharedState.board.length) return;
    UI.board.innerHTML = ''; 
    
    // FIX: Bổ sung lại lệnh gọi updateScoreboard để đếm điểm không bị 0
    updateScoreboard(); 

    UI.board.appendChild(Object.assign(document.createElement('div'), {className: 'coord-label'}));
    for (let c = 0; c < BOARD_SIZE; c++) {
        let el = document.createElement('div'); el.className = 'coord-label'; el.textContent = String.fromCharCode(65 + c);
        UI.board.appendChild(el);
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
        let rEl = document.createElement('div'); rEl.className = 'coord-label'; rEl.textContent = row + 1;
        UI.board.appendChild(rEl);

        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(row + col) % 2 !== 0 ? 'dark' : ''}`;
            cell.dataset.row = row; cell.dataset.col = col;
            
            if (row === 0 && col === 8) cell.classList.add('goal-p1'); 
            if (row === 8 && col === 0) cell.classList.add('goal-p2'); 
            
            if (selectedCell && selectedCell.row === row && selectedCell.col === col) cell.classList.add('selected');

            if (selectedCell) {
                const rD = Math.abs(row - selectedCell.row), cD = Math.abs(col - selectedCell.col);
                if (rD <= 1 && cD <= 1 && !(rD === 0 && cD === 0)) {
                    const tP = sharedState.board[row][col], aP = sharedState.board[selectedCell.row][selectedCell.col];
                    if (!tP || (tP.player !== aP.player && canCapture(aP.type, tP.type) === 1)) cell.classList.add('valid-move');
                }
            }

            const pieceData = sharedState.board[row][col];
            if (pieceData) {
                const pEl = document.createElement('div');
                pEl.className = `piece ${pieceData.player === 1 ? 'player1' : 'player2'}`;
                pEl.textContent = pieceData.type; 
                cell.appendChild(pEl);
            }

            cell.addEventListener('click', () => handleCellClick(row, col));
            UI.board.appendChild(cell);
        }
    }

    if (!sharedState.gameOver) {
        UI.turnInd.textContent = `Lượt hiện tại: Player ${sharedState.turn}`;
        UI.turnInd.className = sharedState.turn === 1 ? 'turn-p1' : 'turn-p2';
    }
}

function checkGameOverUI() {
    if (sharedState.gameOver) {
        UI.winMsg.textContent = `Player ${sharedState.winner} CHIẾN THẮNG!`;
        UI.winMsg.style.color = sharedState.winner === 1 ? '#1877f2' : '#e83e8c'; 
        UI.winReason.textContent = sharedState.reason;
        
        UI.gameOver.classList.remove('hidden');
        UI.turnInd.classList.add('hidden'); 
        document.body.classList.add('game-over'); 
    }
}

// HIỆU ỨNG BAY QUÂN
function playMoveAnimation(from, to, isCapture, callback) {
    isAnimating = true;
    const oldCell = document.querySelector(`.cell[data-row="${from.r}"][data-col="${from.c}"]`);
    const newCell = document.querySelector(`.cell[data-row="${to.r}"][data-col="${to.c}"]`);
    
    if(!oldCell || !newCell) { isAnimating = false; return callback(); } 

    // FIX: Ẩn quân thật trên UI ở ô cũ đi để lúc quân dummy bay lên nhìn không bị nhân đôi
    const origPiece = oldCell.querySelector('.piece:not(.moving)');
    if(origPiece) origPiece.style.opacity = '0'; 

    const dummyPiece = document.createElement('div');
    const attacker = sharedState.board[to.r][to.c]; 
    if (!attacker) {
        isAnimating = false;
        return callback();
    }

    dummyPiece.className = `piece moving ${attacker.player === 1 ? 'player1' : 'player2'}`;
    dummyPiece.textContent = attacker.type;
    oldCell.appendChild(dummyPiece);
    
    if (isCapture) {
        const def = newCell.querySelector('.piece:not(.moving)');
        if(def) def.classList.add('capturing');
    }

    const dX = newCell.getBoundingClientRect().left - oldCell.getBoundingClientRect().left;
    const dY = newCell.getBoundingClientRect().top - oldCell.getBoundingClientRect().top;
    
    setTimeout(() => { dummyPiece.style.transform = `translate(${dX}px, ${dY}px)`; }, 10);

    setTimeout(() => {
        isAnimating = false;
        callback(); 
    }, 300);
}