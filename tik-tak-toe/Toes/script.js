const board = document.getElementById('board');
const status = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
let currentPlayer = 'X';
let gameActive = true;
const gameState = Array(9).fill("");

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

function checkWinner() {
    for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            if (gameState[a] === 'X') {
                status.textContent = `You Won`;
            } else {
                status.textContent = `Computer Won`;
            }
            gameActive = false;
            document.querySelectorAll('.cell').forEach(cell => cell.classList.add('disabled'));
            return true;
        }
    }
    if (!gameState.includes("")) {
        status.textContent = "Its a tie!";
        gameActive = false;
        return true;
    }
    return false;
}

function checkWinnerForMinimax(state, player) {
    for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (state[a] === player && state[b] === player && state[c] === player) {
            return true;
        }
    }
    return false;
}

function minimax(newGameState, isMaximizing) {
    if (checkWinnerForMinimax(newGameState, 'O')) return 10;
    if (checkWinnerForMinimax(newGameState, 'X')) return -10;
    if (!newGameState.includes("")) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < newGameState.length; i++) {
            if (newGameState[i] === "") {
                newGameState[i] = 'O';
                let score = minimax(newGameState, false);
                newGameState[i] = "";
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < newGameState.length; i++) {
            if (newGameState[i] === "") {
                newGameState[i] = 'X';
                let score = minimax(newGameState, true);
                newGameState[i] = "";
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function machineMove() {
    if (!gameActive) return;

    let bestScore = -Infinity;
    let bestMove;
    for (let i = 0; i < gameState.length; i++) {
        if (gameState[i] === "") {
            gameState[i] = 'O';
            let score = minimax(gameState, false);
            gameState[i] = "";
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    if (bestMove !== undefined) {
        gameState[bestMove] = 'O';
        const cell = document.querySelector(`.cell[data-index='${bestMove}']`);
        cell.textContent = 'O';
        cell.classList.add('disabled');

        if (!checkWinner()) {
            currentPlayer = 'X';
            status.textContent = "Your turn!";
        }
    }
}

function handleCellClick(event) {
    const cell = event.target;
    const index = cell.dataset.index;

    if (gameState[index] !== "" || !gameActive || currentPlayer !== 'X') return;

    gameState[index] = 'X';
    cell.textContent = 'X';
    cell.classList.add('disabled');

    if (!checkWinner()) {
        currentPlayer = 'O';
        status.textContent = "Computer's turn!";
        setTimeout(machineMove, 500);
    }
}

function resetGame() {
    gameState.fill("");
    currentPlayer = 'X';
    gameActive = true;
    status.textContent = `You can Start Again`;
    board.innerHTML = '';
    createBoard();
}

function createBoard() {
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        board.appendChild(cell);
    }
}

resetBtn.addEventListener('click', resetGame);

createBoard();
