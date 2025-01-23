class Game {
    constructor() {
        this.initializeElements();
        this.setupGame();
        this.setupControls();
    }

    initializeElements() {
        this.gameArea = document.getElementById('game-area');
        this.paddle = document.getElementById('paddle');
        this.ball = document.getElementById('ball');
        this.scoreElement = document.getElementById('score-value');
        this.livesElement = document.getElementById('lives-value');
        this.timerElement = document.getElementById('timer-value');
        this.menus = {
            start: document.getElementById('start-menu'),
            pause: document.getElementById('pause-menu'),
            gameOver: document.getElementById('game-over'),
            win: document.getElementById('win-screen')
        };
    }

    setupGame() {
        this.score = 0;
        this.lives = 3;
        this.gameTime = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.ballSpeed = 6;
        this.paddleSpeed = 8;
        this.paddlePosition = 350;
        this.ballDirection = { x: this.ballSpeed, y: -this.ballSpeed };
        this.keys = { left: false, right: false };
        this.lastFrame = 0;
        this.bricks = [];
        this.colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        this.ballPosition = { x: 390, y: 550 }; // Add ball position tracking
    }

    createBricks() {
        const rows = 5;
        const cols = 8;
        this.bricks = [];
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const brick = document.createElement('div');
                brick.className = 'brick';
                brick.style.left = (j * 100) + 'px';
                brick.style.top = (i * 40 + 50) + 'px';
                brick.style.background = this.colors[Math.floor(Math.random() * this.colors.length)];
                this.gameArea.appendChild(brick);
                this.bricks.push(brick);
            }
        }
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft': this.keys.left = true; break;
                case 'ArrowRight': this.keys.right = true; break;
                case 's': case 'S': this.startGame(); break;
                case 'p': case 'P': this.togglePause(); break;
                case 'r': case 'R': this.resetGame(); break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft': this.keys.left = false; break;
                case 'ArrowRight': this.keys.right = false; break;
            }
        });
    }

    startGame() {
        if (!this.isPlaying && !this.isPaused) {
            this.isPlaying = true;
            this.menus.start.classList.add('hidden');
            this.createBricks();
            this.resetBall();
            this.gameLoop();
            this.startTimer();
        }
    }

    togglePause() {
        if (!this.isPlaying) return;
        this.isPaused = !this.isPaused;
        this.menus.pause.classList.toggle('hidden');
        if (!this.isPaused) this.gameLoop();
    }

    resetGame() {
        location.reload();
    }

    resetBall() {
        this.ballPosition = { x: 390, y: 550 };
        this.ball.style.left = this.ballPosition.x + 'px';
        this.ball.style.top = this.ballPosition.y + 'px';
        this.ballDirection = { x: this.ballSpeed, y: -this.ballSpeed };
    }

    updateTimer() {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = this.gameTime % 60;
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    startTimer() {
        setInterval(() => {
            if (this.isPlaying && !this.isPaused) {
                this.gameTime++;
                this.updateTimer();
            }
        }, 1000);
    }

    movePaddle() {
        if (this.keys.left) this.paddlePosition = Math.max(0, this.paddlePosition - this.paddleSpeed);
        if (this.keys.right) this.paddlePosition = Math.min(700, this.paddlePosition + this.paddleSpeed);
        this.paddle.style.left = this.paddlePosition + 'px';
    }

    checkCollisions() {
        const ballRect = this.ball.getBoundingClientRect();
        const paddleRect = this.paddle.getBoundingClientRect();
        const gameRect = this.gameArea.getBoundingClientRect();

        // Ball dimensions
        const ballWidth = 15;
        const ballHeight = 15;

        // Paddle collision - check before updating position
        if (this.ballPosition.y + ballHeight >= paddleRect.top - gameRect.top &&
            this.ballPosition.y + ballHeight <= paddleRect.bottom - gameRect.top &&
            this.ballPosition.x + ballWidth >= paddleRect.left - gameRect.left &&
            this.ballPosition.x <= paddleRect.right - gameRect.left &&
            this.ballDirection.y > 0) {
            
            const hitPoint = (this.ballPosition.x + ballWidth/2) - (paddleRect.left - gameRect.left);
            const normalizedHitPoint = hitPoint / paddleRect.width;
            const angle = (normalizedHitPoint - 0.5) * Math.PI / 3;
            
            this.ballDirection.x = this.ballSpeed * Math.sin(angle);
            this.ballDirection.y = -this.ballSpeed * Math.cos(angle);
            this.ballPosition.y = paddleRect.top - gameRect.top - ballHeight; // Prevent sticking
            return true;
        }

        // Wall collisions
        if (this.ballPosition.x <= 0 || this.ballPosition.x + ballWidth >= 800) {
            this.ballDirection.x *= -1;
            this.ballPosition.x = Math.max(0, Math.min(this.ballPosition.x, 800 - ballWidth));
        }
        if (this.ballPosition.y <= 0) {
            this.ballDirection.y *= -1;
            this.ballPosition.y = 0;
        }

        // Brick collisions
        this.bricks.forEach((brick, index) => {
            if (brick.style.visibility !== 'hidden') {
                const brickRect = brick.getBoundingClientRect();
                if (ballRect.right >= brickRect.left &&
                    ballRect.left <= brickRect.right &&
                    ballRect.bottom >= brickRect.top &&
                    ballRect.top <= brickRect.bottom) {
                    brick.style.visibility = 'hidden';
                    this.ballDirection.y *= -1;
                    this.score += 10;
                    this.scoreElement.textContent = this.score;
                    this.checkWin();
                }
            }
        });
    }

    checkWin() {
        if (this.bricks.every(brick => brick.style.visibility === 'hidden')) {
            this.isPlaying = false;
            this.menus.win.querySelector('.final-score').textContent = this.score;
            this.menus.win.classList.remove('hidden');
        }
    }

    gameLoop(timestamp) {
        if (!this.isPlaying || this.isPaused) return;

        if (!this.lastFrame) this.lastFrame = timestamp;
        const delta = timestamp - this.lastFrame;
        this.lastFrame = timestamp;

        // Move paddle
        this.movePaddle();

        // Update ball position
        this.ballPosition.x += this.ballDirection.x;
        this.ballPosition.y += this.ballDirection.y;

        // Check if ball is lost
        if (this.ballPosition.y >= 600) {
            this.lives--;
            this.livesElement.textContent = this.lives;
            if (this.lives <= 0) {
                this.isPlaying = false;
                this.menus.gameOver.querySelector('.final-score').textContent = this.score;
                this.menus.gameOver.classList.remove('hidden');
                return;
            }
            this.resetBall();
            return requestAnimationFrame((t) => this.gameLoop(t));
        }

        // Update ball visual position
        this.ball.style.left = this.ballPosition.x + 'px';
        this.ball.style.top = this.ballPosition.y + 'px';

        this.checkCollisions();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

window.onload = () => new Game();
