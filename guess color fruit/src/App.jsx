// --- src/App.jsx ---
import React, { useState } from 'react';
import './App.css'; // ربط ملف الـ CSS الموحد

function App() {
  const fruitsData = [
    { name: 'بطيخ', color: 'red', emoji: '🍉' },
    { name: 'برتقال', color: 'orange', emoji: '🍊' },
    { name: 'موز', color: 'yellow', emoji: '🍌' },
    { name: 'عنب', color: 'purple', emoji: '🍇' },
    { name: 'كيوي', color: 'green', emoji: '🥝' },
    { name: 'توت', color: 'blue', emoji: '🫐' },
  ];

  const [gameState, setGameState] = useState('start'); 
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [targetFruit, setTargetFruit] = useState(null);
  const [options, setOptions] = useState([]);

  const startLevel = () => {
    // اختيار 3 فواكه عشوائية فقط للمستوى
    const shuffled = [...fruitsData].sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, 3);
    
    // اختيار واحدة منهم لتكون هي الهدف
    const randomTarget = selectedOptions[Math.floor(Math.random() * 3)];
    
    setOptions(selectedOptions);
    setTargetFruit(randomTarget);
  };

  const handleStartGame = () => {
    setGameState('playing');
    setLevel(1);
    setLives(3);
    setScore(0);
    startLevel();
  };

  const handleChoice = (selectedColor) => {
    if (selectedColor === targetFruit.color) {
      setScore(score + 10);
      if (level < 10) {
        setLevel(level + 1);
        startLevel();
      } else {
        setGameState('won');
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) setGameState('lost');
      else alert('غلط! حاول تاني ❌');
    }
  };

  return (
    <div className="game-container">
      
      {gameState === 'start' ? (
        <div className="content-fade">
          <div className="emoji-header">
            <span className="bob-emoji">🍇</span>
            <span className="bob-emoji">🍌</span>
            <span className="bob-emoji">🍎</span>
          </div>
          <h1 className="main-title">لعبة الفاكهة الملوّنة</h1>
          <p className="welcome-p">
            هِيظهر لك لون في كل مستوى، اختار الفاكهة اللي لونها مطابق.
            <br /> عندك 10 مستويات , 3 محاولات فقط!
          </p>
          <button onClick={handleStartGame} className="start-btn">🎮 ابدأ اللعب</button>
        </div>
      ) : gameState === 'playing' ? (
        <div className="content-fade">
          <div className="status-bar">
            <div className="status-item">المستوى <br/> <span>{level}/10</span></div>
            <div className="status-item">النقاط <br/> <span>{score}</span></div>
            <div className="status-item">المحاولات <br/> <span>{'❤️'.repeat(lives)}</span></div>
          </div>

          <h2 className="instruction-text">اختار الفاكهة اللي لونها مطابق:</h2>
          
          {/* المربع الملون الكبير في النص */}
          <div className="target-color-box" style={{ backgroundColor: targetFruit?.color }}></div>

          <div className="choices-grid">
            {options.map((fruit, index) => (
              <button key={index} onClick={() => handleChoice(fruit.color)} className="choice-card">
                <span className="fruit-emoji">{fruit.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="content-fade">
          <h1 className="end-title">{gameState === 'won' ? '🎉 مبروك كسبت!' : '💔 حظ أوفر!'}</h1>
          <h2 className="final-score">نتيجتك النهائية: {score}</h2>
          <button onClick={() => setGameState('start')} className="start-btn">العودة للرئيسية</button>
        </div>
      )}
    </div>
  );
}

export default App;