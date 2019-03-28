// import notification1 from '../sounds/notification1.mp3';
import notification2 from '../sounds/notification2.mp3';

const sound = new Audio(notification2);

function playSound() {
  sound.pause();
  sound.currentTime = 0;
  sound.volume = 0.5;
  sound.play();
}

export default playSound;
