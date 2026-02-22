/**
 * HTML5 射击游戏 - 游戏逻辑
 */

// ==================== 游戏状态管理 ====================
const GameState = {
    SETTINGS: 'settings',
    PLAYING: 'playing',
    VICTORY: 'victory'
};

// ==================== 游戏配置 ====================
const GameConfig = {
    WIN_SCORE: 10,
    DEFAULT_ENEMY_WIDTH: 80,
    DEFAULT_ENEMY_HEIGHT: 80,
    DEFAULT_CURSOR_SIZE: 40,
    SPAWN_INTERVAL: 2000,
    MIN_SPAWN_Y: 100
};

// ==================== 资源管理器 ====================
class AssetManager {
    constructor() {
        this.assets = {
            background: null,
            cursor: null,
            enemyMoveFrames: [],
            enemyDeathFrames: [],
            fireEffectFrames: []
        };
        
        this.settings = {
            enemySpeed: 3,
            animSpeed: 150
        };
        
        this.urls = {
            background: null,
            cursor: null,
            enemyMoveFrames: [],
            enemyDeathFrames: [],
            fireEffectFrames: []
        };
    }
    
    // 保存URL到内存
    createObjectURL(file) {
        return URL.createObjectURL(file);
    }
    
    // 释放URL内存
    revokeObjectURL(url) {
        if (url) {
            URL.revokeObjectURL(url);
        }
    }
    
    // 保存设置到localStorage
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }
    
    // 从localStorage加载设置
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
        }
    }
    
    // 更新设置值
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }
}

// ==================== 序列帧动画类 ====================
class SpriteAnimation {
    constructor(frames, frameDuration) {
        this.frames = frames;
        this.frameDuration = frameDuration;
        this.currentFrame = 0;
        this.lastUpdateTime = 0;
        this.isPlaying = true;
        this.isLooping = true;
        this.onComplete = null;
    }
    
    update(currentTime) {
        if (!this.isPlaying || this.frames.length === 0) return;
        
        if (currentTime - this.lastUpdateTime >= this.frameDuration) {
            this.currentFrame++;
            
            if (this.currentFrame >= this.frames.length) {
                if (this.isLooping) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frames.length - 1;
                    this.isPlaying = false;
                    if (this.onComplete) {
                        this.onComplete();
                    }
                }
            }
            
            this.lastUpdateTime = currentTime;
        }
    }
    
    draw(ctx, x, y, width, height, flipped = false) {
        if (this.frames.length === 0) return;
        
        const frame = this.frames[this.currentFrame];
        if (!frame) return;
        
        ctx.save();
        
        if (flipped) {
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            ctx.drawImage(frame, 0, 0, width, height);
        } else {
            ctx.drawImage(frame, x, y, width, height);
        }
        
        ctx.restore();
    }
    
    reset() {
        this.currentFrame = 0;
        this.isPlaying = true;
        this.lastUpdateTime = 0;
    }
    
    stop() {
        this.isPlaying = false;
    }
}

// ==================== 敌人类 ====================
class Enemy {
    constructor(x, y, direction, moveAnimation, deathAnimation, speed) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 1: 从左到右, -1: 从右到左
        this.width = GameConfig.DEFAULT_ENEMY_WIDTH;
        this.height = GameConfig.DEFAULT_ENEMY_HEIGHT;
        this.speed = speed;
        this.state = 'alive'; // alive, dying, dead
        
        this.moveAnimation = moveAnimation;
        this.deathAnimation = deathAnimation ? new SpriteAnimation(
            [...deathAnimation], 
            assetManager.settings.animSpeed
        ) : null;
        
        if (this.deathAnimation) {
            this.deathAnimation.isLooping = false;
            this.deathAnimation.onComplete = () => {
                this.state = 'dead';
            };
        }
    }
    
    update(currentTime) {
        if (this.state === 'alive') {
            // 移动
            this.x += this.speed * this.direction;
            
            // 更新动画
            if (this.moveAnimation) {
                this.moveAnimation.update(currentTime);
            }
        } else if (this.state === 'dying') {
            // 播放死亡动画
            if (this.deathAnimation) {
                this.deathAnimation.update(currentTime);
            }
        }
    }
    
    draw(ctx) {
        if (this.state === 'dead') return;
        
        const flipped = this.direction === -1;
        
        if (this.state === 'alive' && this.moveAnimation) {
            this.moveAnimation.draw(ctx, this.x, this.y, this.width, this.height, flipped);
        } else if (this.state === 'dying' && this.deathAnimation) {
            this.deathAnimation.draw(ctx, this.x, this.y, this.width, this.height, flipped);
        }
    }
    
    checkHit(mouseX, mouseY) {
        if (this.state !== 'alive') return false;
        
        return mouseX >= this.x && 
               mouseX <= this.x + this.width && 
               mouseY >= this.y && 
               mouseY <= this.y + this.height;
    }
    
    die() {
        if (this.state === 'alive') {
            this.state = 'dying';
            if (this.deathAnimation) {
                this.deathAnimation.reset();
            }
        }
    }
    
    isOutOfBounds(canvasWidth) {
        if (this.direction === 1) {
            return this.x > canvasWidth;
        } else {
            return this.x + this.width < 0;
        }
    }
}

// ==================== 特效类 ====================
class Effect {
    constructor(x, y, animation) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.animation = animation;
        
        if (this.animation) {
            this.animation.isLooping = false;
            this.animation.onComplete = () => {
                this.isFinished = true;
            };
        }
    }
    
    update(currentTime) {
        if (this.animation && !this.isFinished) {
            this.animation.update(currentTime);
        }
    }
    
    draw(ctx) {
        if (this.animation && !this.isFinished) {
            this.animation.draw(ctx, 
                this.x - this.width / 2, 
                this.y - this.height / 2, 
                this.width, 
                this.height
            );
        }
    }
}

// ==================== 游戏主类 ====================
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = GameState.SETTINGS;
        this.score = 0;
        
        this.enemies = [];
        this.effects = [];
        
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.lastSpawnTime = 0;
        this.animationId = null;
        
        this.initCanvas();
        this.bindEvents();
    }
    
    // 初始化画布
    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    // 绑定事件
    bindEvents() {
        // 鼠标移动
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        
        // 鼠标点击
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 左键
                this.handleShot(e.clientX, e.clientY);
            }
        });
    }
    
    // 处理射击
    handleShot(x, y) {
        // 播放开火特效
        if (assetManager.assets.fireEffectFrames.length > 0) {
            const fireAnim = new SpriteAnimation(
                [...assetManager.assets.fireEffectFrames],
                assetManager.settings.animSpeed / 2
            );
            const effect = new Effect(x, y, fireAnim);
            this.effects.push(effect);
        }
        
        // 检测碰撞
        for (let enemy of this.enemies) {
            if (enemy.checkHit(x, y)) {
                enemy.die();
                this.score++;
                this.updateScoreDisplay();
                
                // 检查胜利
                if (this.score >= GameConfig.WIN_SCORE) {
                    this.victory();
                }
                break;
            }
        }
    }
    
    // 生成敌人
    spawnEnemy() {
        const canvasHeight = this.canvas.height;
        const minY = GameConfig.MIN_SPAWN_Y;
        const maxY = canvasHeight - GameConfig.DEFAULT_ENEMY_HEIGHT - 50;
        const y = Math.random() * (maxY - minY) + minY;
        
        // 随机方向
        const direction = Math.random() < 0.5 ? 1 : -1;
        
        let x;
        if (direction === 1) {
            x = -GameConfig.DEFAULT_ENEMY_WIDTH;
        } else {
            x = this.canvas.width;
        }
        
        // 创建移动动画
        let moveAnim = null;
        if (assetManager.assets.enemyMoveFrames.length > 0) {
            moveAnim = new SpriteAnimation(
                [...assetManager.assets.enemyMoveFrames],
                assetManager.settings.animSpeed
            );
        }
        
        const enemy = new Enemy(
            x, y, direction,
            moveAnim,
            assetManager.assets.enemyDeathFrames,
            assetManager.settings.enemySpeed
        );
        
        this.enemies.push(enemy);
    }
    
    // 更新分数显示
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
    }
    
    // 渲染背景
    drawBackground() {
        if (assetManager.assets.background) {
            // 背景图拉伸铺满
            this.ctx.drawImage(
                assetManager.assets.background,
                0, 0,
                this.canvas.width,
                this.canvas.height
            );
        } else {
            // 默认背景
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 绘制网格
            this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.1)';
            this.ctx.lineWidth = 1;
            const gridSize = 50;
            
            for (let x = 0; x < this.canvas.width; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
            
            for (let y = 0; y < this.canvas.height; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
        }
    }
    
    // 绘制瞄准镜光标
    drawCursor() {
        if (assetManager.assets.cursor) {
            const size = GameConfig.DEFAULT_CURSOR_SIZE;
            this.ctx.drawImage(
                assetManager.assets.cursor,
                this.mouseX - size / 2,
                this.mouseY - size / 2,
                size,
                size
            );
        } else {
            // 默认光标
            this.ctx.save();
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, 15, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouseX - 20, this.mouseY);
            this.ctx.lineTo(this.mouseX + 20, this.mouseY);
            this.ctx.moveTo(this.mouseX, this.mouseY - 20);
            this.ctx.lineTo(this.mouseX, this.mouseY + 20);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    
    // 游戏主循环
    gameLoop(currentTime) {
        if (this.state !== GameState.PLAYING) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 生成敌人
        if (currentTime - this.lastSpawnTime > GameConfig.SPAWN_INTERVAL) {
            this.spawnEnemy();
            this.lastSpawnTime = currentTime;
        }
        
        // 更新和绘制敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(currentTime);
            enemy.draw(this.ctx);
            
            // 移除死亡敌人
            if (enemy.state === 'dead') {
                this.enemies.splice(i, 1);
            }
            
            // 移除超出边界的敌人
            if (enemy.isOutOfBounds(this.canvas.width) && enemy.state === 'alive') {
                this.enemies.splice(i, 1);
            }
        }
        
        // 更新和绘制特效
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(currentTime);
            effect.draw(this.ctx);
            
            if (effect.isFinished) {
                this.effects.splice(i, 1);
            }
        }
        
        // 绘制光标
        this.drawCursor();
        
        // 继续循环
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // 开始游戏
    start() {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.enemies = [];
        this.effects = [];
        this.lastSpawnTime = 0;
        
        // 隐藏设置面板
        document.getElementById('settings-panel').classList.add('hidden');
        
        // 显示HUD
        document.getElementById('game-hud').classList.remove('hidden');
        this.updateScoreDisplay();
        
        // 隐藏胜利画面
        document.getElementById('victory-screen').classList.add('hidden');
        
        // 开始游戏循环
        this.gameLoop(0);
    }
    
    // 胜利
    victory() {
        this.state = GameState.VICTORY;
        
        // 停止游戏循环
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 显示胜利画面
        document.getElementById('victory-screen').classList.remove('hidden');
    }
    
    // 返回设置
    returnToSettings() {
        this.state = GameState.SETTINGS;
        
        // 停止游戏循环
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // 显示设置面板
        document.getElementById('settings-panel').classList.remove('hidden');
        
        // 隐藏HUD
        document.getElementById('game-hud').classList.add('hidden');
        
        // 隐藏胜利画面
        document.getElementById('victory-screen').classList.add('hidden');
        
        // 清空敌人
        this.enemies = [];
        this.effects = [];
        
        // 重置分数
        this.score = 0;
        this.updateScoreDisplay();
    }
}

// ==================== UI管理器 ====================
class UIManager {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.loadSavedSettings();
    }
    
    initElements() {
        // 文件输入
        this.bgInput = document.getElementById('bg-upload');
        this.cursorInput = document.getElementById('cursor-upload');
        this.enemyMoveInput = document.getElementById('enemy-move-upload');
        this.enemyDeathInput = document.getElementById('enemy-death-upload');
        this.fireEffectInput = document.getElementById('fire-effect-upload');
        
        // 滑动条
        this.speedSlider = document.getElementById('speed-slider');
        this.animSpeedSlider = document.getElementById('anim-speed-slider');
        
        // 数值显示
        this.speedValue = document.getElementById('speed-value');
        this.animSpeedValue = document.getElementById('anim-speed-value');
        
        // 按钮
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        
        // 预览信息
        this.bgPreviewInfo = document.getElementById('bg-preview-info');
        this.cursorPreviewInfo = document.getElementById('cursor-preview-info');
        this.enemyMovePreviewInfo = document.getElementById('enemy-move-preview-info');
        this.enemyDeathPreviewInfo = document.getElementById('enemy-death-preview-info');
        this.fireEffectPreviewInfo = document.getElementById('fire-effect-preview-info');
    }
    
    bindEvents() {
        // 文件上传事件
        this.bgInput.addEventListener('change', (e) => this.handleBgUpload(e));
        this.cursorInput.addEventListener('change', (e) => this.handleCursorUpload(e));
        this.enemyMoveInput.addEventListener('change', (e) => this.handleEnemyMoveUpload(e));
        this.enemyDeathInput.addEventListener('change', (e) => this.handleEnemyDeathUpload(e));
        this.fireEffectInput.addEventListener('change', (e) => this.handleFireEffectUpload(e));
        
        // 滑动条事件
        this.speedSlider.addEventListener('input', (e) => this.handleSpeedChange(e));
        this.animSpeedSlider.addEventListener('input', (e) => this.handleAnimSpeedChange(e));
        
        // 按钮事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => game.returnToSettings());
    }
    
    // 加载保存的设置
    loadSavedSettings() {
        assetManager.loadSettings();
        this.speedSlider.value = assetManager.settings.enemySpeed;
        this.animSpeedSlider.value = assetManager.settings.animSpeed;
        this.speedValue.textContent = assetManager.settings.enemySpeed;
        this.animSpeedValue.textContent = assetManager.settings.animSpeed + 'ms';
    }
    
    // 处理背景图上传
    handleBgUpload(e) {
        const file = e.target.files[0];
        if (file) {
            assetManager.revokeObjectURL(assetManager.urls.background);
            const url = assetManager.createObjectURL(file);
            assetManager.urls.background = url;
            
            const img = new Image();
            img.onload = () => {
                assetManager.assets.background = img;
            };
            img.src = url;
            
            this.bgPreviewInfo.textContent = file.name;
        }
    }
    
    // 处理瞄准镜上传
    handleCursorUpload(e) {
        const file = e.target.files[0];
        if (file) {
            assetManager.revokeObjectURL(assetManager.urls.cursor);
            const url = assetManager.createObjectURL(file);
            assetManager.urls.cursor = url;
            
            const img = new Image();
            img.onload = () => {
                assetManager.assets.cursor = img;
            };
            img.src = url;
            
            this.cursorPreviewInfo.textContent = file.name;
        }
    }
    
    // 处理敌人移动序列帧上传
    handleEnemyMoveUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // 释放旧的URL
            assetManager.urls.enemyMoveFrames.forEach(url => assetManager.revokeObjectURL(url));
            assetManager.urls.enemyMoveFrames = [];
            assetManager.assets.enemyMoveFrames = [];
            
            // 排序文件（按名称）
            files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            
            let loadedCount = 0;
            files.forEach((file, index) => {
                const url = assetManager.createObjectURL(file);
                assetManager.urls.enemyMoveFrames.push(url);
                
                const img = new Image();
                img.onload = () => {
                    assetManager.assets.enemyMoveFrames[index] = img;
                    loadedCount++;
                    if (loadedCount === files.length) {
                        // 按索引重新排序
                        assetManager.assets.enemyMoveFrames = assetManager.assets.enemyMoveFrames.filter(Boolean);
                    }
                };
                img.src = url;
            });
            
            this.enemyMovePreviewInfo.textContent = `${files.length} 张图片`;
        }
    }
    
    // 处理敌人死亡序列帧上传
    handleEnemyDeathUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // 释放旧的URL
            assetManager.urls.enemyDeathFrames.forEach(url => assetManager.revokeObjectURL(url));
            assetManager.urls.enemyDeathFrames = [];
            assetManager.assets.enemyDeathFrames = [];
            
            // 排序文件
            files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            
            let loadedCount = 0;
            files.forEach((file, index) => {
                const url = assetManager.createObjectURL(file);
                assetManager.urls.enemyDeathFrames.push(url);
                
                const img = new Image();
                img.onload = () => {
                    assetManager.assets.enemyDeathFrames[index] = img;
                    loadedCount++;
                    if (loadedCount === files.length) {
                        assetManager.assets.enemyDeathFrames = assetManager.assets.enemyDeathFrames.filter(Boolean);
                    }
                };
                img.src = url;
            });
            
            this.enemyDeathPreviewInfo.textContent = `${files.length} 张图片`;
        }
    }
    
    // 处理开火特效上传
    handleFireEffectUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // 释放旧的URL
            assetManager.urls.fireEffectFrames.forEach(url => assetManager.revokeObjectURL(url));
            assetManager.urls.fireEffectFrames = [];
            assetManager.assets.fireEffectFrames = [];
            
            // 排序文件
            files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            
            let loadedCount = 0;
            files.forEach((file, index) => {
                const url = assetManager.createObjectURL(file);
                assetManager.urls.fireEffectFrames.push(url);
                
                const img = new Image();
                img.onload = () => {
                    assetManager.assets.fireEffectFrames[index] = img;
                    loadedCount++;
                    if (loadedCount === files.length) {
                        assetManager.assets.fireEffectFrames = assetManager.assets.fireEffectFrames.filter(Boolean);
                    }
                };
                img.src = url;
            });
            
            this.fireEffectPreviewInfo.textContent = `${files.length} 张图片`;
        }
    }
    
    // 处理速度滑动条
    handleSpeedChange(e) {
        const value = parseInt(e.target.value);
        this.speedValue.textContent = value;
        assetManager.updateSetting('enemySpeed', value);
    }
    
    // 处理动画速度滑动条
    handleAnimSpeedChange(e) {
        const value = parseInt(e.target.value);
        this.animSpeedValue.textContent = value + 'ms';
        assetManager.updateSetting('animSpeed', value);
    }
    
    // 开始游戏
    startGame() {
        game.start();
    }
}

// ==================== 初始化 ====================
const assetManager = new AssetManager();
const game = new Game();
const uiManager = new UIManager();

console.log('游戏已初始化完成！');
