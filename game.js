class Game {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.isJumping = false;
        this.currentLane = 1; // 0: left, 1: center, 2: right
        this.obstacles = [];
        this.coins = [];
        this.gameInterval = null;
        this.isGameOver = false;
        this.targetScore = 300;
        this.isMuted = true; // Начинаем с выключенным звуком

        // Инициализация аудио
        this.initializeAudio();
        
        // Определяем типы препятствий
        this.obstacleTypes = [
            { emoji: '🐕', name: 'собака' },
            { emoji: '🚐', name: 'газель' },
            { emoji: '🚌', name: 'автобус' }
        ];

        // Сохраняем позиции полос
        this.lanePositions = [16.66, 50, 83.33];

        // Initialize game elements
        this.initializeElements();
        // Clear any existing game state
        this.clearGame();
        // Start the game
        this.startGame();
    }

    initializeAudio() {
        try {
            this.audio = {
                background: new Audio('audio/background.mp3'),
                coin: new Audio('audio/coin.mp3'),
                collision: new Audio('audio/collision.mp3'),
                jump: new Audio('audio/jump.mp3'),
                gameOver: new Audio('audio/gameover.mp3'),
                win: new Audio('audio/win.mp3')
            };

            // Настройка фоновой музыки
            if (this.audio.background) {
                this.audio.background.loop = true;
                this.audio.background.volume = 0;  // Начальная громкость 0
            }

            // Настройка звуковых эффектов
            Object.values(this.audio).forEach(sound => {
                if (sound && sound !== this.audio.background) {
                    sound.volume = 0;  // Начальная громкость 0
                }
            });
        } catch (error) {
            console.error('Ошибка при инициализации аудио:', error);
        }
    }

    initializeElements() {
        // Находим основные элементы игры
        this.player = document.getElementById('player');
        this.gameArea = document.querySelector('.game-area');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.gameOverScreen = document.getElementById('game-over');
        this.winScreen = document.getElementById('win-screen');
        this.finalScoreElement = document.getElementById('final-score');

        // Проверяем, найдены ли элементы
        if (!this.player) console.error("Player element not found!");
        if (!this.gameArea) console.error("Game area element not found!");
        if (!this.scoreElement) console.error("Score element not found!");
        if (!this.livesElement) console.error("Lives element not found!");
        if (!this.gameOverScreen) console.error("Game Over screen not found!");
        if (!this.winScreen) console.error("Win screen not found!");

        // Скрываем экраны в начале
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (this.winScreen) this.winScreen.classList.add('hidden');

        // Добавляем кнопку звука в игровую область
        this.initializeSoundButton();

        // Устанавливаем слушатели событий
        this.setupEventListeners();
        // Устанавливаем начальное положение игрока
        this.updatePlayerPosition();
    }

    initializeSoundButton() {
        try {
            const soundButton = document.createElement('button');
            soundButton.id = 'sound-toggle';
            soundButton.innerHTML = '🔇'; // Начинаем с иконки выключенного звука
            soundButton.className = 'sound-button';

            if (this.gameArea) {
                this.gameArea.appendChild(soundButton);
                soundButton.addEventListener('click', () => {
                    this.toggleSound();
                    soundButton.innerHTML = this.isMuted ? '🔇' : '🔊';
                });
            }
        } catch (error) {
            console.error('Ошибка при инициализации кнопки звука:', error);
        }
    }

    clearGame() {
        // Скрываем экраны
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (this.winScreen) this.winScreen.classList.add('hidden');

        // Удаляем существующие препятствия и монеты из DOM
        const existingObstacles = document.querySelectorAll('.obstacle');
        const existingCoins = document.querySelectorAll('.coin');
        existingObstacles.forEach(obstacle => obstacle.remove());
        existingCoins.forEach(coin => coin.remove());

        // Очищаем массивы
        this.obstacles = [];
        this.coins = [];
        this.isGameOver = false;
    }

    setupEventListeners() {
        // Клавиатура
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Сенсорное управление (только свайпы влево/вправо)
        let touchStartX = 0;
        let touchStartY = 0;

        if (this.gameArea) {
            this.gameArea.addEventListener('touchstart', (e) => {
                // Игнорируем тап по кнопке звука, чтобы он не считался началом свайпа
                if (e.target.closest('.sound-button')) return;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                e.preventDefault();
            }, { passive: false });

            this.gameArea.addEventListener('touchmove', (e) => {
                if (this.isGameOver || e.touches.length === 0) return;
                 // Игнорируем, если движение началось с кнопки
                 if (e.target.closest('.sound-button')) return;

                const touchEndX = e.touches[0].clientX;
                const touchEndY = e.touches[0].clientY;
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    const swipeThreshold = 50;
                    if (deltaX > swipeThreshold) {
                        this.moveRight();
                        touchStartX = touchEndX;
                        touchStartY = touchEndY;
                    } else if (deltaX < -swipeThreshold) {
                        this.moveLeft();
                        touchStartX = touchEndX;
                        touchStartY = touchEndY;
                    }
                }
                e.preventDefault();
            }, { passive: false });
        }

        // Кнопки управления (только влево/вправо)
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); if (!this.isGameOver) this.moveLeft(); });
            btnLeft.addEventListener('click', () => { if (!this.isGameOver) this.moveLeft(); });
        }
        if (btnRight) {
            btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); if (!this.isGameOver) this.moveRight(); });
            btnRight.addEventListener('click', () => { if (!this.isGameOver) this.moveRight(); });
        }

        // Кнопки рестарта - добавляем все возможные кнопки
        const restartButtons = [
            document.getElementById('restart'),
            document.getElementById('play-again'),
            document.getElementById('play-again-win')
        ];

        restartButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    console.log('Restart button clicked'); // Добавляем для отладки
                    this.restartGame();
                });
            }
        });
    }

    handleKeyPress(e) {
        if (this.isGameOver) return;
        switch (e.key) {
            case 'ArrowLeft': this.moveLeft(); break;
            case 'ArrowRight': this.moveRight(); break;
            // Добавляем M для mute/unmute
            case 'm':
            case 'M':
            case 'ь': // русская М
                this.toggleSound();
                // Обновляем иконку на кнопке, если она есть
                const soundButton = document.getElementById('sound-toggle');
                if (soundButton) {
                     soundButton.innerHTML = this.isMuted ? '🔇' : '🔊';
                }
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
        if (this.currentLane < this.lanePositions.length - 1) {
            this.currentLane++;
            this.updatePlayerPosition();
        }
    }

    updatePlayerPosition() {
        if (this.player) {
            this.player.style.left = `${this.lanePositions[this.currentLane]}%`;
        }
    }

    createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        const randomType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        obstacle.innerHTML = randomType.emoji;
        obstacle.title = randomType.name;
        const lane = Math.floor(Math.random() * this.lanePositions.length);
        obstacle.style.left = `${this.lanePositions[lane]}%`;
        obstacle.style.top = '0';
        if (this.gameArea) {
            this.gameArea.appendChild(obstacle);
            this.obstacles.push({ element: obstacle, lane: lane, type: randomType.name });
        }
    }

    createCoin() {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.innerHTML = '🥙';
        const lane = Math.floor(Math.random() * this.lanePositions.length);
        coin.style.left = `${this.lanePositions[lane]}%`;
        coin.style.top = '0';
        if (this.gameArea) {
            this.gameArea.appendChild(coin);
            this.coins.push({ element: coin, lane: lane });
        }
    }

    moveObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const currentTop = parseInt(obstacle.element.style.top || '0');
            const newTop = currentTop + 5;
            obstacle.element.style.top = `${newTop}px`;
            const removalThreshold = this.gameArea ? this.gameArea.offsetHeight : 400;
            if (newTop > removalThreshold) {
                obstacle.element.remove();
                this.obstacles.splice(i, 1);
            } else if (this.checkCollision(obstacle)) {
                this.handleCollision(obstacle, i);
            }
        }
    }

    moveCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const currentTop = parseInt(coin.element.style.top || '0');
            const newTop = currentTop + 5;
            coin.element.style.top = `${newTop}px`;
            const removalThreshold = this.gameArea ? this.gameArea.offsetHeight : 400;
            if (newTop > removalThreshold) {
                coin.element.remove();
                this.coins.splice(i, 1);
            } else if (this.checkCoinCollision(coin)) {
                this.handleCoinCollection(coin, i);
            }
        }
    }

    checkCollision(obstacle) {
        if (!this.player) return false;
        const playerRect = this.player.getBoundingClientRect();
        const obstacleRect = obstacle.element.getBoundingClientRect();
        return obstacle.lane === this.currentLane &&
               obstacleRect.bottom > playerRect.top &&
               obstacleRect.top < playerRect.bottom;
    }

    checkCoinCollision(coin) {
        if (!this.player) return false;
        const playerRect = this.player.getBoundingClientRect();
        const coinRect = coin.element.getBoundingClientRect();
        return coin.lane === this.currentLane &&
               coinRect.bottom > playerRect.top &&
               coinRect.top < playerRect.bottom;
    }

    handleCollision(obstacle, index) {
        this.lives--;
        if (this.livesElement) {
            this.livesElement.textContent = '❤️'.repeat(Math.max(0, this.lives));
        }
        // --- SOUND REMOVED ---
        // this.playSound('collision');

        if (this.gameArea) {
            const message = document.createElement('div');
            message.className = 'collision-message';
            message.style.position = 'absolute';
            message.style.left = obstacle.element.style.left;
            message.style.top = obstacle.element.style.top;
            message.textContent = `Ай! ${obstacle.type}!`;
            this.gameArea.appendChild(message);
            setTimeout(() => message.remove(), 1000);
        }

        obstacle.element.remove();
        this.obstacles.splice(index, 1);

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    handleCoinCollection(coin, index) {
        this.score += 10;
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
        // --- SOUND REMOVED ---
        // this.playSound('coin');
        coin.element.remove();
        this.coins.splice(index, 1);

        if (this.score >= this.targetScore) {
            this.winGame();
        }
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        this.stopSound(); // Останавливаем фоновую музыку
        // --- SOUND REMOVED ---
        // this.playSound('gameOver');
        if (this.finalScoreElement) this.finalScoreElement.textContent = this.score;
        if (this.winScreen) this.winScreen.classList.add('hidden');
        if (this.gameOverScreen) this.gameOverScreen.classList.remove('hidden');
    }

    winGame() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        this.stopSound(); // Останавливаем фоновую музыку
        // --- SOUND REMOVED ---
        // this.playSound('win');
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
        if (this.winScreen) this.winScreen.classList.remove('hidden');
    }

    startGame() {
        this.playSound(); // Запускаем фоновую музыку

        const gameSpeed = 20;
        const obstacleProbability = 0.02;
        const coinProbability = 0.03;

        this.gameInterval = setInterval(() => {
            if (this.isGameOver) return;
            if (Math.random() < obstacleProbability) this.createObstacle();
            if (Math.random() < coinProbability) this.createCoin();
            this.moveObstacles();
            this.moveCoins();
        }, gameSpeed);
    }

    restartGame() {
        try {
            console.log('Restarting game...'); // Добавляем для отладки
            
            // Очищаем интервал
            if (this.gameInterval) {
                clearInterval(this.gameInterval);
            }

            // Сбрасываем состояние игры
            this.score = 0;
            this.lives = 3;
            this.isGameOver = false;
            this.currentLane = 1;

            // Очищаем игровое поле
            this.clearGame();

            // Обновляем UI
            if (this.scoreElement) {
                this.scoreElement.textContent = '0';
            }
            if (this.livesElement) {
                this.livesElement.textContent = '❤️❤️❤️';
            }

            // Скрываем экраны
            if (this.gameOverScreen) {
                this.gameOverScreen.classList.add('hidden');
            }
            if (this.winScreen) {
                this.winScreen.classList.add('hidden');
            }

            // Обновляем позицию игрока
            this.updatePlayerPosition();

            // Перезапускаем звук
            this.stopSound();
            if (this.audio.background) {
                this.audio.background.currentTime = 0;
            }

            // Запускаем игру заново
            this.startGame();
        } catch (error) {
            console.error('Error in restartGame:', error);
        }
    }

    // --- AUDIO METHODS SIMPLIFIED ---
    toggleSound() {
        this.isMuted = !this.isMuted;
        
        // Установка громкости для фоновой музыки
        if (this.audio.background) {
            this.audio.background.volume = this.isMuted ? 0 : 0.5;
        }
        
        // Установка громкости для звуковых эффектов
        Object.values(this.audio).forEach(sound => {
            if (sound && sound !== this.audio.background) {
                sound.volume = this.isMuted ? 0 : 0.3;
            }
        });

        // Если звук включен и игра идет, запускаем фоновую музыку
        if (!this.isMuted && !this.isGameOver && this.audio.background) {
            this.audio.background.play().catch(error => {
                console.error('Ошибка воспроизведения звука:', error);
            });
        }
    }

    // Воспроизводит ТОЛЬКО фоновую музыку
    playSound() {
        if (!this.isMuted && this.audio.background && this.audio.background.paused) {
            this.audio.background.play().catch(e => console.warn(`Error playing background sound:`, e));
        }
    }

    // Останавливает ТОЛЬКО фоновую музыку
    stopSound() {
         if (this.audio.background) {
            this.audio.background.pause();
         }
    }
}

// Запуск игры после загрузки страницы
window.addEventListener('load', () => {
    new Game();
});
