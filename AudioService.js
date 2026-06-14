import { Audio } from 'expo-av';

export class AudioService {
  // Utilizing a singleton pattern to retain memory pointers globally
  static standardClickSound = null;
  static victorySoundSequence = null;
  static isContextInitialized = false;

  static async initializeHardwareAudio() {
    if (this.isContextInitialized) return;

    try {
      // Dictate hardware audio routing protocols
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true, // Overrides physical switch for critical gameplay audio
        staysActiveInBackground: false, // Relinquishes memory when app is minimized
        shouldDuckAndroid: true, // Lowers game volume if a phone call interrupts
        playThroughEarpieceAndroid: false, // Forces audio out of the main speaker
      });

      // Asynchronously load the binary assets directly into volatile device memory
      const { sound: clickAsset } = await Audio.Sound.createAsync(
        require('../../assets/sounds/click.mp3') // Ensure this file exists in the assets directory
      );
      this.standardClickSound = clickAsset;

      const { sound: victoryAsset } = await Audio.Sound.createAsync(
        require('../../assets/sounds/win.mp3')
      );
      this.victorySoundSequence = victoryAsset;
      
      this.isContextInitialized = true;
    } catch (error) {
      console.warn("Hardware Audio Context Initialization Failed:", error);
      // The application will not crash; it will simply proceed without audio (graceful degradation)
    }
  }

  static async playStandardClick() {
    if (this.standardClickSound && this.isContextInitialized) {
      try {
        // replayAsync ensures the audio plays from the beginning even if already executing
        await this.standardClickSound.replayAsync();
      } catch (exception) {
        console.warn("Audio Playback Transport Error:", exception);
      }
    }
  }

  static async playVictorySoundSequence() {
    if (this.victorySoundSequence && this.isContextInitialized) {
      try {
        await this.victorySoundSequence.replayAsync();
      } catch (exception) {
        console.warn("Victory Audio Playback Transport Error:", exception);
      }
    }
  }
}
