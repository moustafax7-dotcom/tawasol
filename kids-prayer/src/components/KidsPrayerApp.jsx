 import React, { useState } from 'react';
import './KidsPrayerApp.css';

 import wudu1 from '../assets/images/wudu_1.png';
import wudu2 from '../assets/images/wudu_2.png';
import wudu3 from '../assets/images/wudu_3.png';
import wudu4 from '../assets/images/Wudu_4.png';      
import wudu5 from '../assets/images/Wudu_5png.png';   
import wudu6 from '../assets/images/Wudu_6.png';      
import wudu7 from '../assets/images/Wudu_7.png';     
import wudu8 from '../assets/images/Wudu_7.png';    

 import sallah1 from '../assets/images/sallah_1.png';
import sallah2 from '../assets/images/sallah_2.png';
import sallah3 from '../assets/images/sallah_3.png';
import sallah4 from '../assets/images/sallah_4.png';
import sallah5 from '../assets/images/sallah_5.png';
import sallah6 from '../assets/images/sallah_6.png';

const wuduSteps = [
  { title: "النية", instruction: "أنو الوضوء في قلبك", id: "8/1", image: wudu1 },
  { title: "غسل اليدين", instruction: "اغسل يدك 3 مرات من المعصم للأصابع", id: "8/2", image: wudu2 },
  { title: "المضمضة", instruction: "ضع الماء في فمك وحركه 3 مرات", id: "8/3", image: wudu3 },
  { title: "الاستنشاق", instruction: "استنشق الماء في أنفك 3 مرات", id: "8/4", image: wudu4 },
  { title: "غسل الوجه", instruction: "اغسل وجهك كاملاً من الجبهة للذقن 3 مرات", id: "8/5", image: wudu5 },
  { title: "غسل الذراعين", instruction: "من الأصابع للمرفق 3 مرات - اليمين أولاً", id: "8/6", image: wudu6 },
  { title: "مسح الرأس", instruction: "امسح رأسك من الأمام للخلف مرة واحدة", id: "8/7", image: wudu7 },
  { title: "غسل القدمين", instruction: "من الأصابع للكعب 3 مرات - اليمين أولاً", id: "8/8", image: wudu8 }
];

const prayerSteps = [
  { title: "التكبير", instruction: "ارفع يديك وقل: \"الله أكبر\"", id: "6/1", image: sallah1 },
  { title: "القيام والقراءة", instruction: "قف مستقيماً واقرأ سورة الفاتحة", id: "6/2", image: sallah2 },
  { title: "الركوع", instruction: "انحن وقل: \"سبحان ربي العظيم\" 3 مرات", id: "6/3", image: sallah3 },
  { title: "السجود", instruction: "اسجد وقل: \"سبحان ربي الأعلى\" 3 مرات", id: "6/4", image: sallah4 },
  { title: "التشهد", instruction: "اجلس واقرأ التشهد بهدوء", id: "6/5", image: sallah5 },
  { title: "التسليم", instruction: "التفت يميناً ويساراً وقل: \"السلام عليكم\"", id: "6/6", image: sallah6 }
];

export default function KidsPrayerApp() {
  const [screen, setScreen] = useState('menu');
  const [currentStep, setCurrentStep] = useState(0);

  const nextWuduStep = () => {
    if (currentStep < wuduSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setScreen('wuduComplete');
    }
  };

  const nextPrayerStep = () => {
    if (currentStep < prayerSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setScreen('prayerComplete');
    }
  };

  const resetToMenu = () => {
    setScreen('menu');
    setCurrentStep(0);
  };

  return (
    <div className="app-frame">
      {screen === 'menu' && (
        <>
          <h1 className="app-main-title">الصلاة والوضوء</h1>
          <p className="app-sub-title">سوف تتعلم كيف تتوضأ وتصلي خطوة بخطوة</p>

          <button className="orange-button menu-btn" onClick={() => { setScreen('wudu'); setCurrentStep(0); }}>
            <span>ابدأ الوضوء (8 خطوات)</span>
            <span style={{ fontSize: '20px' }}>🚰</span>
          </button>

          <button className="orange-button menu-btn" onClick={() => { setScreen('prayer'); setCurrentStep(0); }}>
            <span>ابدأ للصلاة (6 خطوات)</span>
            <span style={{ fontSize: '20px' }}>⭐</span>
          </button>

          <div className="stars-row">
            <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
            <span className="stars-text">4 نجوم عند الاكمال</span>
          </div>
        </>
      )}

      {screen === 'wudu' && (
        <>
          <h1 className="step-title">{wuduSteps[currentStep].title}</h1>
          <p className="step-instruction">{wuduSteps[currentStep].instruction}</p>
          
          <div className="image-placeholder-box">
            <img 
              src={wuduSteps[currentStep].image} 
              alt={wuduSteps[currentStep].title} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }} 
            />
          </div>

          <div className="badge-counter">{wuduSteps[currentStep].id}</div>
          <button className="orange-button action-btn" onClick={nextWuduStep}>
            {currentStep === wuduSteps.length - 1 ? "أكملت الوضوء" : "التالي"}
          </button>
        </>
      )}

      {screen === 'wuduComplete' && (
        <div className="text-center" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="congrats-title">عاش يا بطل 🎉</h1>
          <p className="congrats-sub">ما شاء الله، انت الآن طاهر هل تتعلم الصلاة؟</p>
          <button className="orange-button menu-btn" onClick={() => { setScreen('prayer'); setCurrentStep(0); }}>نعم، تعلم الصلاة</button>
          <button className="orange-button menu-btn secondary-style" onClick={resetToMenu}>الرجوع للقائمة</button>
        </div>
      )}

      {screen === 'prayer' && (
        <>
          <h1 className="step-title">{prayerSteps[currentStep].title}</h1>
          <p className="step-instruction">{prayerSteps[currentStep].instruction}</p>
          
          <div className="image-placeholder-box">
            <img 
              src={prayerSteps[currentStep].image} 
              alt={prayerSteps[currentStep].title} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }} 
            />
          </div>

          <div className="badge-counter">{prayerSteps[currentStep].id}</div>
          <button className="orange-button action-btn" onClick={nextPrayerStep}>
            {currentStep === prayerSteps.length - 1 ? "أكملت الصلاة" : "التالي"}
          </button>
        </>
      )}

      {screen === 'prayerComplete' && (
        <div className="text-center" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="congrats-title">عاش يا بطل 🏆</h1>
          <p className="congrats-sub">تعلمت الوضوء والصلاة كاملاً ما شاء الله</p>
          <button className="orange-button menu-btn" onClick={resetToMenu}>الرجوع للقائمة</button>
        </div>
      )}
    </div>
  );
}