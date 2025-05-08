class SoundEvents {
  constructor() {
    if (SoundEvents.instance) return SoundEvents.instance;
    this.sounds = {};
    this.context = new AudioContext();
    SoundEvents.instance = this;
  }

  async load(name, count = 1, folder = "/audio/sfx") {
    this.sounds[name] = [];

    for (let i = 0; i < count; i++) {
      const paddedIndex = count > 1 ? `_${String(i).padStart(2, "0")}` : "";
      const path = `${folder}/${name}${paddedIndex}.mp3`;

      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds[name].push(buffer);
    }
  }
  play(name, { rate = 1, volume = 1 } = {}) {
    const buffers = this.sounds[name];
    if (!buffers || buffers.length === 0) return;

    const buffer = buffers[Math.floor(Math.random() * buffers.length)];
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;

    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.context.destination);
    source.start();
  }
}

const soundEvents = new SoundEvents();
export default soundEvents;
