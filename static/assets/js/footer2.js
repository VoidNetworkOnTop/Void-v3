(function() {
  'use strict';
  

  const konamiCode = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'
  ];
  
  const letterSequence = ['b', 'a'];
  
  let konamiPosition = 0;
  let letterPosition = 0;
  let isInArrowSequence = true;
  

  document.addEventListener('keydown', function(e) {
    const key = e.key;
    
    if (isInArrowSequence) {

      if (key === konamiCode[konamiPosition]) {
        konamiPosition++;
        

        if (konamiPosition === konamiCode.length) {
          isInArrowSequence = false;
          konamiPosition = 0;
        }
      } else {

        konamiPosition = 0;
      }
    } else {

      if (letterPosition < letterSequence.length) {
        if (key.toLowerCase() === letterSequence[letterPosition]) {
          letterPosition++;
          

          if (letterPosition === letterSequence.length) {

            if (key === 'Enter') {

              window.location.href = '/assets/html/footer2.html';
            }
          }
        } else {

          resetAll();
        }
      } else if (key === 'Enter') {

        window.location.href = '/assets/html/footer2.html';
      } else {

        resetAll();
      }
    }
  });
  
  // Reset all positions
  function resetAll() {
    konamiPosition = 0;
    letterPosition = 0;
    isInArrowSequence = true;
  }
  
  console.log('Konami Code script loaded. Enter: ↑↑↓↓←→←→BA to proceed...');
})();
