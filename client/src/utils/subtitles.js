const PREEMPTIVE_TIME = 30;
const UPDATE_INTERVAL = 10;

const newLineRegExp = new RegExp(/\n/, 'gm');
const bracketsRegExp = new RegExp(/^<.*>(.*)<\/.*>$/);

export default class SubtitlesHandler {
    constructor() {
        this.subtitles = [];
        this.tempSubtitles = [];
        this.currentSubtitles = [];

        this.currentTime = 0;

        this.timer = null;

        this.updateTempSubtitiles();
    }

    setSubtitles(subtitles) {
        this.subtitles = subtitles;
        this.setTemporarySubtitiles();
    }

    setCurrentTime(timeMs) {
        const difference = Math.abs(this.currentTime - timeMs);
        this.currentTime = timeMs;
        if (difference > 200) this.updateTempSubtitiles();
    }

  updateTempSubtitiles = (callback?) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(this.updateTempSubtitiles, UPDATE_INTERVAL * 1000);
      return this.setTemporarySubtitiles(callback);
  };

  setTemporarySubtitiles = (callback?) => {
      const { currentTime, subtitles } = this;
      const preemptiveTime = PREEMPTIVE_TIME * 1000;
      const subsList = subtitles.filter(
          s =>
              (s.start <= currentTime && currentTime <= s.end) ||
        (s.start >= currentTime && currentTime + preemptiveTime >= s.end)
      );

      this.tempSubtitles = this.removeBrackets(subsList);
      if (callback) return callback();
  };

  removeBrackets = subtitles => {
      return subtitles.map(el => {
          return {
              ...el,
              text: (el.text = el.text
                  .replace(newLineRegExp, ' ')
                  .replace(bracketsRegExp, '$1')),
          };
      });
  };

  getSubtitles = timeMs => {
      const difference = Math.abs(this.currentTime - timeMs);
      this.currentTime = timeMs;
      if (difference > 200)
          return this.updateTempSubtitiles(() => {
              return this.findCurrentSubtitles();
          });

      return this.findCurrentSubtitles();
  };

  findCurrentSubtitles = () => {
      return this.tempSubtitles.filter(s => {
          return s.start <= this.currentTime && this.currentTime <= s.end;
      });
  };

  destroy() {
      clearTimeout(this.timer);
  }
}
