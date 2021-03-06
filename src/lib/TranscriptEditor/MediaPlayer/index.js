import React from 'react';
import PropTypes from 'prop-types';
// https://www.npmjs.com/package/react-keyboard-shortcuts
import { hotkeys } from 'react-keyboard-shortcuts';
import returnHotKeys from './defaultHotKeys';
import PlaybackRate from './PlaybackRate.js';
import RollBack from './RollBack.js';
import ProgressBar from './ProgressBar.js';
import PlayerControls from './PlayerControls.js';
import VolumeControl from './VolumeControl.js';
import PauseWhileTyping from './PauseWhileTyping.js';
import ScrollIntoView from './ScrollIntoView.js';

import styles from './index.module.css';

import { secondsToTimecode, timecodeToSeconds } from '../../Util/timecode-converter/index';

class MediaPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();

    this.state = {
      playBackRate: 1,
      rollBackValueInSeconds: 15,
      timecodeOffset: 0,
      hotKeys: returnHotKeys(this),
      isPausedWhileTyping: false
    }
  }
  /*eslint-disable camel case */
  hot_keys = returnHotKeys(this)

  componentDidMount() {
    this.props.hookSeek(this.setCurrentTime);
    this.props.hookPlayMedia(this.playMedia);
    this.props.hookIsPlaying(this.isPlaying);
  }

  setCurrentTime = (newCurrentTime) => {
    if (newCurrentTime !== '' && newCurrentTime !== null) {
    // hh:mm:ss:ff - mm:ss - m:ss - ss - seconds number or string and hh:mm:ss
      const newCurrentTimeInSeconds = timecodeToSeconds(newCurrentTime);
      if (this.videoRef.current !== null) {
        const videoRef = this.videoRef.current;
        // videoRef.load();
        if ( videoRef.readyState === 4 ) {
          // it's loaded
          videoRef.currentTime = newCurrentTimeInSeconds;
          videoRef.play();
        }
      }
    }
  }

  promptSetCurrentTime = () => {
    this.setCurrentTime( prompt('Jump to time - hh:mm:ss:ff hh:mm:ss mm:ss m:ss m.ss seconds'))
  }

  setTimeCodeOffset = (newTimeCodeOffSet) => {
    if (newTimeCodeOffSet !== '' && newTimeCodeOffSet !== null) {
      // use similar helper function from above to convert
      let newCurrentTimeInSeconds = newTimeCodeOffSet;
      if (newTimeCodeOffSet.includes(':')) {
        newCurrentTimeInSeconds = timecodeToSeconds(newTimeCodeOffSet);
        this.setState({ timecodeOffset: newCurrentTimeInSeconds })
      }
    }
  }

  rollBack = () => {
    if (this.videoRef.current !== null) {
      // get video duration
      const videoElem = this.videoRef.current;
      const tmpDesiredCurrentTime = videoElem.currentTime - this.state.rollBackValueInSeconds;
      // > 0 < duration of video
      this.setCurrentTime(tmpDesiredCurrentTime);
    }
  }

  handleTimeUpdate = (e) => {
    // eslint-disable-next-line react/prop-types
    this.props.hookOnTimeUpdate(e.target.currentTime)
  }

  handlePlayBackRateChange = (e) => {
    this.setPlayBackRate(e.target.value)
  }

  increasePlaybackRate = () => {
    const currentPlaybackRate = this.getCurrentPlaybackRate();
    let newPlaybackRate = currentPlaybackRate + 0.1;
    // rounding up eg 0.8-0.1 =  0.7000000000000001   => 0.7
    newPlaybackRate = Number((newPlaybackRate).toFixed(1));
    this.setPlayBackRate(newPlaybackRate);
  }

  decreasePlaybackRate = () => {
    const currentPlaybackRate = this.getCurrentPlaybackRate();
    let newPlaybackRate = currentPlaybackRate - 0.1;
    // rounding up eg 0.8-0.1 =  0.7000000000000001   => 0.7
    newPlaybackRate = Number((newPlaybackRate).toFixed(1));
    this.setPlayBackRate(newPlaybackRate);
  }

  getCurrentPlaybackRate = () => {
    if (this.videoRef.current !== null) {
      return this.videoRef.current.playbackRate;
    }
  }

  setPlayBackRate = (speedValue) => {
    // value between 0.2 and 3.5
    if (this.videoRef.current !== null) {
      if (speedValue >= 0.2 && speedValue <= 3.5) {
        this.setState({
          playBackRate: speedValue,
        }, () => {
          this.videoRef.current.playbackRate = speedValue;
        })
      }
    }
  }

  handleChangeReplayRollbackValue = (e) => {
    if (this.videoRef.current !== null) {
      this.setState({
        rollBackValueInSeconds: e.target.value,
      })
    }
  }

  handleMuteVolume = (e) => {
    // https://www.w3schools.com/tags/av_prop_volume.asp
    if (this.videoRef.current !== null) {
      if (this.videoRef.current.volume > 0) {
        this.videoRef.current.volume = 0;
      } else {
        this.videoRef.current.volume = 1;
      }
    }
  }

  handleTogglePauseWhileTyping = (e) => {
    console.log('triggered')
    console.log(this.state.isPausedWhileTyping)
    this.setState((prevState, props) => {
      console.log(prevState.isPausedWhileTyping)
      return { isPausedWhileTyping:  !prevState.isPausedWhileTyping }
    })
  }

  handleToggleScrollIntoView = (e) => {
    this.props.handleIsScrollIntoViewChange(e.target.checked);     
  }

  isPlaying=() => {
    if (this.videoRef.current !== null) {
      if (this.videoRef.current.paused) {
        return false;
      }
      return true;
    }
  }

  /**
   * @param {bool}  playPauseBool - is optional boolean - false -> pause | true -> play 
   * for integration with TimedTextEditor pause while typing
   * If bool is not provided then if paused --> play | if playing --> pause
   * Eg when triggered from play/pause btn 
   */
  playMedia = (playPauseBool) => {
    // checks that there is a video player element initialized
    if (this.videoRef.current !== null) {

      // if playMedia is being triggered by PlayerControl or Video element
      // then it will have a target attribute
      if(typeof playPauseBool !== 'boolean'){
          // checks on whether to use default fallback if no param is provided
          if (this.videoRef.current.paused) {
            this.videoRef.current.play();
          } else {
            this.videoRef.current.pause();
          }
      }
      else{
         // if param is provided and if pausedWhileTyping Toggle is on
        if(this.state.isPausedWhileTyping){
            if (playPauseBool) {
              this.videoRef.current.play();
            } else {
              this.videoRef.current.pause();
            }
          }
      }

    }
  }

  skipForward = () => {
    if (this.videoRef.current !== null) {
      const currentTime = this.videoRef.current.currentTime;
      const newCurrentTimeIncreased = currentTime + 10;
      const newCurrentTime = Number((newCurrentTimeIncreased).toFixed(1));
      this.setCurrentTime(newCurrentTime);
    }
  }

  skipBackward = () => {
    if (this.videoRef.current !== null) {
      const currentTime = this.videoRef.current.currentTime;
      const newCurrentTimeIncreased = currentTime - 10;
      const newCurrentTime = Number((newCurrentTimeIncreased).toFixed(1));
      this.setCurrentTime(newCurrentTime);
    }
  }

  handleProgressBarClick = (e) => {
    if (this.videoRef.current !== null) {
      // length of the bar
      const lengthOfBar = e.target.offsetWidth;
      // distance of the position of the lick from the start of the progress bar element
      // location of click - start point of the bar
      const clickLength = e.clientX - e.target.offsetLeft;
      const positionPercentage = clickLength / lengthOfBar;
      const totalTime = e.target.max;
      const resultInSeconds = totalTime * positionPercentage;
      // rounding up
      const roundNewCurrentTime = parseFloat((resultInSeconds).toFixed(2));
      this.setCurrentTime(roundNewCurrentTime);
    }
  }

  getMediaCurrentTime = () => {
   if(this.videoRef.current !== null) {
    return secondsToTimecode(this.videoRef.current.currentTime + this.state.timecodeOffset) 
   } 
     return '00:00:00:00';
  }

  getMediaDuration = () => {
    if(this.videoRef.current !== null){
      return secondsToTimecode(this.videoRef.current.duration + this.state.timecodeOffset);
    } 
      return  '00:00:00:00';
  }

  render() {
    // conditional, if media player not defined then don't show
    let mediaPlayerEl;
    if (this.props.mediaUrl !== null) {
      mediaPlayerEl = (
        <video
          id="video"
          playsInline
          // autoPlay
          // controls
          src={ this.props.mediaUrl }
          onTimeUpdate={ this.handleTimeUpdate }
          // TODO: video type - add logic to identify if video is playable and raise error if it's not
          type="video/mp4"
          data-testid="media-player-id"
          onClick={ this.playMedia.bind(this) }
          ref={ this.videoRef }
        />
      );
    }

    let playerControlsSection;
    if(this.props.mediaUrl !== null ){
      playerControlsSection = <section>

        <ProgressBar
          max={ this.videoRef.current !== null ? parseInt(this.videoRef.current.duration) : 100 }
          value={ this.videoRef.current !== null ? parseInt(this.videoRef.current.currentTime) : 0 }
          buttonClick={ this.handleProgressBarClick.bind(this) } 
        />
        <br/>

        <PlayerControls
          playMedia={ this.playMedia.bind(this) }
          isPlaying={ this.isPlaying.bind(this) }
          skipBackward={ this.skipBackward.bind(this) }
          skipForward={ this.skipForward.bind(this) }
          currentTime={ this.getMediaCurrentTime() }
          duration={ this.getMediaDuration() }
          onSetCurrentTime={ '' }
          onSetTimecodeOffset={ '' }
          promptSetCurrentTime={ this.promptSetCurrentTime.bind(this) }
          setTimeCodeOffset={ this.setTimeCodeOffset.bind(this) }
          timecodeOffset={ secondsToTimecode(this.state.timecodeOffset) }
        />
     
        <VolumeControl 
          handleMuteVolume={ this.handleMuteVolume.bind(this) }
        />

        <PauseWhileTyping 
          isPausedWhileTyping={ this.props.isPausedWhileTyping }
          handleToggle={ this.handleTogglePauseWhileTyping.bind(this) }
        />

        <ScrollIntoView 
          isScrollIntoViewOn={ this.props.isScrollIntoViewOn }
          handleToggle={ this.handleToggleScrollIntoView.bind(this) }
        />
   
        <PlaybackRate
          playBackRate={ this.state.playBackRate }
          handlePlayBackRateChange={ this.handlePlayBackRateChange.bind(this) }
          setPlayBackRate={ this.setPlayBackRate.bind(this) }
        />
   
        <RollBack
          rollBackValueInSeconds={ this.state.rollBackValueInSeconds }
          handleChangeReplayRollbackValue={ this.handleChangeReplayRollbackValue.bind(this) }
          rollBack={ this.rollBack.bind(this) }
        />  
   
      </section>
    };

    // list of keyboard shortcuts helper text
    const keyboardShortcutsElements = Object.keys(this.state.hotKeys).map((shortcutKey, index) => {
        return <p 
        className={ styles.helpText } 
        key={ shortcutKey }>
          <code>{shortcutKey}</code> 
          <small>
            <b> {this.state.hotKeys[shortcutKey].helperText}</b>
          </small>
        </p>
      })

    let keyboardShortcuts;
    if(this.props.mediaUrl !== null ){
      keyboardShortcuts = <section className={ styles.hideInMobile }><label>{keyboardShortcutsElements}</label>
        <br/>
        <small className={ styles.helpText }>Double click on a word to be taken to that time in the media.</small>
      </section> 
    }

    return (
      <section className={ styles.videoSection }>

        { mediaPlayerEl }

        { playerControlsSection }
      
        { keyboardShortcuts }  
      </section>
    );
  }
}

MediaPlayer.propTypes = {
  hookSeek: PropTypes.func,
  hookPlayMedia: PropTypes.func,
  mediaUrl: PropTypes.string,
  hookOnTimeUpdate: PropTypes.func,
  hookIsScrollSyncToggle: PropTypes.func
};

export default hotkeys(MediaPlayer);
