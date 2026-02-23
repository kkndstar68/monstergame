# HTML5 Customizable Shooting Game

A fully browser-based 2D shooting game built with HTML5 Canvas and vanilla JavaScript. No backend required - just download and play!

## 🎮 Features

- **Customizable Assets**: Upload your own background images, custom crosshair, enemy sprites, death effects, and fire effects
- **Animation System**: Support for sprite sheet animations (moving, dying, firing effects)
- **Mirror Flipping**: Enemies automatically flip horizontally when changing direction
- **Collision Detection**: Click-to-shoot mechanics with visual feedback
- **Win Condition**: Score 10 kills to win the game
- **Persistent Settings**: Game parameters saved to localStorage

## 🚀 How to Play

1. Open `index.html` in any modern web browser
2. Configure your game assets in the settings panel:
   - Upload a background image
   - Upload a crosshair cursor image
   - Upload enemy movement animation frames (multiple files)
   - Upload enemy death animation frames (multiple files)
   - Upload fire effect animation frames (multiple files)
3. Adjust game speed settings using the sliders
4. Click "Start Game" to begin!
5. Click on enemies to shoot them
6. Kill 10 enemies to win!

## 📁 Project Structure

```
monstergame/
├── index.html    # Main game page with settings UI
├── style.css     # Styling for settings panel and game HUD
├── game.js       # Complete game logic and rendering
└── README.md     # This file
```

## 🛠️ Technical Details

- **Technology**: HTML5 Canvas, CSS3, Vanilla JavaScript (ES6+)
- **No Dependencies**: Pure frontend, no external libraries required
- **Browser Support**: Chrome, Firefox, Edge, Safari
- **Animation**: Uses `requestAnimationFrame` for smooth 60fps gameplay

## 🎯 Game Mechanics

- **Enemies**: Spawn at random heights, move from left-to-right or right-to-left
- **Direction**: Use `Canvas.scale(-1, 1)` for horizontal mirror flipping
- **Shooting**: Left-click to fire at cursor position
- **Effects**: Play animation frames at click location
- **Win**: Defeat 10 enemies to see the victory screen

## 🤝 Contributing

Welcome to improve this game! Feel free to:

- Submit issues and feature requests
- Fork the repository and make improvements
- Share your custom game assets and configurations

## 📧 Contact

- Email: sabaton6868@gmail.com
- QQ: 2941626218

## 📜 License

MIT License - Feel free to use and modify for personal or commercial projects.

---

Enjoy the game! 🎉
