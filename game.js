class Game {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.timeLeft = 120;
        this.isJumping = false;
        this.currentLane = 1; // 0: left, 1: center, 2: right
        this.obstacles = [];
        this.coins = [];
        this.gameInterval = null;
        this.timerInterval = null;
        this.isGameOver = false;
        this.targetScore = 200; // Score needed to win

        // Определяем типы препятствий
        this.obstacleTypes = [
            { emoji: '🐕', name: 'Собака' },
            { emoji: '🚐', name: 'Газель' },
            { emoji: '🚌', name: 'Автобус' }
        ];

        // Initialize game elements
        this.initializeElements();
        // Clear any existing game state
        this.clearGame();
        // Start the game
        this.startGame();
    }

    initializeElements() {
        this.player = document.getElementById('player');
        this.gameArea = document.querySelector('.game-area');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.timerElement = document.getElementById('timer');
        this.gameOverScreen = document.getElementById('game-over');
        this.winScreen = document.getElementById('win-screen');
        this.finalScoreElement = document.getElementById('final-score');

        // Force hide screens at initialization
        this.gameOverScreen.classList.add('hidden');
        this.winScreen.classList.add('hidden');

        this.setupEventListeners();
    }

    clearGame() {
        // Hide screens
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (this.winScreen) this.winScreen.classList.add('hidden');
        
        // Clear existing obstacles and coins
        const existingObstacles = document.querySelectorAll('.obstacle');
        const existingCoins = document.querySelectorAll('.coin');
        
        existingObstacles.forEach(obstacle => obstacle.remove());
        existingCoins.forEach(coin => coin.remove());

        // Reset game state
        this.obstacles = [];
        this.coins = [];
        this.isGameOver = false;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Touch controls
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.gameArea.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });

        this.gameArea.addEventListener('touchmove', (e) => {
            if (this.isGameOver) return;
            
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchStartY - touchEndY;
            
            // Determine if it's a horizontal or vertical swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 50) {
                    this.moveRight();
                    touchStartX = touchEndX;
                } else if (deltaX < -50) {
                    this.moveLeft();
                    touchStartX = touchEndX;
                }
            } else {
                // Vertical swipe (up)
                if (deltaY > 50) {
                    this.jump();
                    touchStartY = touchEndY;
                }
            }
            
            e.preventDefault();
        }, { passive: false });

        // Mobile button controls
        const btnLeft = document.getElementById('btn-left');
        const btnUp = document.getElementById('btn-up');
        const btnRight = document.getElementById('btn-right');

        // Add touch events for mobile buttons
        btnLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.isGameOver) this.moveLeft();
        });

        btnRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.isGameOver) this.moveRight();
        });

        btnUp.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.isGameOver) this.jump();
        });

        // Also add click events for testing on desktop
        btnLeft.addEventListener('click', () => {
            if (!this.isGameOver) this.moveLeft();
        });

        btnRight.addEventListener('click', () => {
            if (!this.isGameOver) this.moveRight();
        });

        btnUp.addEventListener('click', () => {
            if (!this.isGameOver) this.jump();
        });

        // Button controls
        document.getElementById('restart').addEventListener('click', () => this.restartGame());
        document.getElementById('play-again').addEventListener('click', () => this.restartGame());
        document.getElementById('play-again-win').addEventListener('click', () => this.restartGame());
    }

    handleKeyPress(e) {
        if (this.isGameOver) return;

        switch (e.key) {
            case 'ArrowLeft':
                this.moveLeft();
                break;
            case 'ArrowRight':
                this.moveRight();
                break;
            case 'ArrowUp':
                this.jump();
                break;
        }
    }

    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.updatePlayerPosition();
        }
    }

    moveRight() {
        if (this.currentLane < 2) {
            this.currentLane++;
            this.updatePlayerPosition();
        }
    }

    updatePlayerPosition() {
        const lanePositions = [16.66, 50, 83.33];
        this.player.style.left = `${lanePositions[this.currentLane]}%`;
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.player.style.transform = 'translateX(-50%) translateY(-50px)';
            setTimeout(() => {
                this.player.style.transform = 'translateX(-50%)';
                this.isJumping = false;
            }, 500);
        }
    }

    createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        
        // Выбираем случайный тип препятствия
        const randomType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        obstacle.innerHTML = randomType.emoji;
        obstacle.title = randomType.name;
        
        const lane = Math.floor(Math.random() * 3);
        const lanePositions = [16.66, 50, 83.33];
        obstacle.style.left = `${lanePositions[lane]}%`;
        obstacle.style.top = '0';
        this.gameArea.appendChild(obstacle);
        this.obstacles.push({ 
            element: obstacle, 
            lane: lane, 
            type: randomType.name 
        });
    }

    createCoin() {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.innerHTML = '🥙'; // Gyros emoji
        const lane = Math.floor(Math.random() * 3);
        const lanePositions = [16.66, 50, 83.33];
        coin.style.left = `${lanePositions[lane]}%`;
        coin.style.top = '0';
        this.gameArea.appendChild(coin);
        this.coins.push({ element: coin, lane: lane });
    }

    moveObstacles() {
        this.obstacles.forEach((obstacle, index) => {
            const currentTop = parseInt(obstacle.element.style.top);
            obstacle.element.style.top = `${currentTop + 5}px`;

            if (currentTop > 400) {
                obstacle.element.remove();
                this.obstacles.splice(index, 1);
            } else if (this.checkCollision(obstacle)) {
                this.handleCollision(obstacle, index);
            }
        });
    }

    moveCoins() {
        this.coins.forEach((coin, index) => {
            const currentTop = parseInt(coin.element.style.top);
            coin.element.style.top = `${currentTop + 5}px`;

            if (currentTop > 400) {
                coin.element.remove();
                this.coins.splice(index, 1);
            } else if (this.checkCoinCollision(coin)) {
                this.handleCoinCollection(coin, index);
            }
        });
    }

    checkCollision(obstacle) {
        if (this.isJumping) return false;
        const playerRect = this.player.getBoundingClientRect();
        const obstacleRect = obstacle.element.getBoundingClientRect();
        return obstacle.lane === this.currentLane &&
               obstacleRect.bottom >= playerRect.top &&
               obstacleRect.top <= playerRect.bottom;
    }

    checkCoinCollision(coin) {
        const playerRect = this.player.getBoundingClientRect();
        const coinRect = coin.element.getBoundingClientRect();
        return coin.lane === this.currentLane &&
               coinRect.bottom >= playerRect.top &&
               coinRect.top <= playerRect.bottom;
    }

    handleCollision(obstacle, index) {
        this.lives--;
        this.livesElement.textContent = '❤️'.repeat(this.lives);
        
        // Добавляем сообщение о столкновении
        const message = document.createElement('div');
        message.className = 'collision-message';
        message.style.position = 'absolute';
        message.style.left = obstacle.element.style.left;
        message.style.top = obstacle.element.style.top;
        message.textContent = `Столкновение с ${obstacle.type.toLowerCase()}!`;
        this.gameArea.appendChild(message);
        
        // Удаляем сообщение через секунду
        setTimeout(() => message.remove(), 1000);
        
        obstacle.element.remove();
        this.obstacles.splice(index, 1);

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    handleCoinCollection(coin, index) {
        this.score += 10;
        this.scoreElement.textContent = this.score;
        coin.element.remove();
        this.coins.splice(index, 1);

        // Check for win condition
        if (this.score >= this.targetScore) {
            this.winGame();
        }
    }

    updateTimer() {
        this.timeLeft--;
        this.timerElement.textContent = this.timeLeft;

        if (this.timeLeft <= 0) {
            this.winGame();
        }
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        clearInterval(this.timerInterval);
        this.finalScoreElement.textContent = this.score;
        this.winScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
    }

    winGame() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        clearInterval(this.timerInterval);
        this.gameOverScreen.classList.add('hidden');
        this.winScreen.classList.remove('hidden');
    }

    startGame() {
        this.gameInterval = setInterval(() => {
            if (Math.random() < 0.02) this.createObstacle();
            if (Math.random() < 0.03) this.createCoin(); // Increased coin spawn rate
            this.moveObstacles();
            this.moveCoins();
        }, 20);

        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    restartGame() {
        // Clear all intervals
        clearInterval(this.gameInterval);
        clearInterval(this.timerInterval);
        
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.timeLeft = 120;
        this.isGameOver = false;
        this.currentLane = 1;
        
        // Clear and reset UI
        this.clearGame();
        this.scoreElement.textContent = '0';
        this.livesElement.textContent = '❤️❤️❤️';
        this.timerElement.textContent = '120';
        
        // Reset player position
        this.updatePlayerPosition();
        
        // Start new game
        this.startGame();
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 