import Hls from 'hls.js';

class AudioController {
  constructor() {
    this.hls = null;
    this.audio = null;
    this.isPlaying = false;
    this.currentTapeId = null;
    this.volume = 0.5;
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;
  }

  // 초기화 함수
  init(audioElement) {
    if (!audioElement) {
      console.error('Audio element not provided');
      return false;
    }

    this.audio = audioElement;
    this.audio.volume = this.volume;

    // 이벤트 리스너 설정
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onPlayCallback) this.onPlayCallback();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.onPauseCallback) this.onPauseCallback();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onEndCallback) this.onEndCallback();
    });

    this.audio.addEventListener('error', (error) => {
      console.error('Audio error:', error);
      this.isPlaying = false;
      if (this.onErrorCallback) this.onErrorCallback(error);
    });

    return true;
  }

  // 테이프 재생 함수
  async playTape(tapeId) {
    if (!this.audio) {
      console.error('Audio controller not initialized');
      return false;
    }

    try {
      // 현재 재생 중인 테이프가 있으면 정지
      if (this.isPlaying) {
        this.stopTape();
      }

      // HLS 지원 확인
      if (Hls.isSupported()) {
        // 기존 HLS 인스턴스 정리
        if (this.hls) {
          this.hls.destroy();
        }

        // 새 HLS 인스턴스 생성
        this.hls = new Hls({
          xhrSetup: (xhr, url) => {
            // 필요한 경우 요청 헤더 추가
            xhr.withCredentials = false; // 크로스 도메인 쿠키 사용 여부
          }
        });

        // 플레이리스트 URL 생성
        const playlistUrl = `/api/audio/playlist?tapeId=${tapeId}`;
        
        // HLS 로드 및 재생
        this.hls.loadSource(playlistUrl);
        this.hls.attachMedia(this.audio);
        
        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.audio.play()
            .then(() => {
              this.isPlaying = true;
              this.currentTapeId = tapeId;
              if (this.onPlayCallback) this.onPlayCallback();
            })
            .catch(error => {
              console.error('Playback error:', error);
              if (this.onErrorCallback) this.onErrorCallback(error);
            });
        });

        this.hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch(data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // 네트워크 에러 처리
                console.error('Network error:', data);
                this.hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                // 미디어 에러 처리
                console.error('Media error:', data);
                this.hls.recoverMediaError();
                break;
              default:
                // 복구 불가능한 에러
                console.error('Fatal error:', data);
                this.hls.destroy();
                if (this.onErrorCallback) this.onErrorCallback(data);
                break;
            }
          }
        });

        return true;
      } 
      // 기본 오디오 요소 사용 (모바일 사파리 등 HLS 지원하지 않는 브라우저)
      else if (this.audio.canPlayType('application/vnd.apple.mpegurl')) {
        this.audio.src = `/api/audio/playlist?tapeId=${tapeId}`;
        this.audio.play()
          .then(() => {
            this.isPlaying = true;
            this.currentTapeId = tapeId;
            if (this.onPlayCallback) this.onPlayCallback();
          })
          .catch(error => {
            console.error('Playback error:', error);
            if (this.onErrorCallback) this.onErrorCallback(error);
          });
        return true;
      } 
      // HLS를 지원하지 않는 경우 직접 MP3 스트리밍 (덜 안전한 방법)
      else {
        const timestamp = Date.now().toString();
        const token = await this.getStreamToken(tapeId, timestamp);
        this.audio.src = `/api/audio/stream?tapeId=${tapeId}&token=${token}&timestamp=${timestamp}&segment=0`;
        this.audio.play()
          .then(() => {
            this.isPlaying = true;
            this.currentTapeId = tapeId;
            if (this.onPlayCallback) this.onPlayCallback();
          })
          .catch(error => {
            console.error('Playback error:', error);
            if (this.onErrorCallback) this.onErrorCallback(error);
          });
        return true;
      }
    } catch (error) {
      console.error('Failed to play tape:', error);
      if (this.onErrorCallback) this.onErrorCallback(error);
      return false;
    }
  }

  // 스트림 토큰 가져오기 (클라이언트 측 시뮬레이션 - 실제로는 서버에서 처리해야 함)
  async getStreamToken(tapeId, timestamp) {
    try {
      // 실제로는 서버에 요청하여 토큰을 가져와야 함
      // 여기서는 간단한 해시를 생성하여 시뮬레이션
      const userAgent = navigator.userAgent;
      const data = `${tapeId}-${userAgent}-${timestamp}`;
      
      // 실제 구현에서는 이 부분을 서버 요청으로 대체해야 함
      return Array.from(new TextEncoder().encode(data))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('Failed to get stream token:', error);
      return '';
    }
  }

  // 테이프 일시 정지 함수
  pauseTape() {
    if (!this.audio || !this.isPlaying) return false;
    
    this.audio.pause();
    return true;
  }

  // 테이프 정지 함수
  stopTape() {
    if (!this.audio) return false;
    
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.currentTapeId = null;
    
    // HLS 정리
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    
    return true;
  }

  // 볼륨 설정 함수
  setVolume(volume) {
    if (!this.audio) return false;
    
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
    return true;
  }

  // 이벤트 콜백 설정 함수
  onPlay(callback) {
    this.onPlayCallback = callback;
  }

  onPause(callback) {
    this.onPauseCallback = callback;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  // 재생 상태 확인 함수
  isPlayingTape(tapeId) {
    return this.isPlaying && this.currentTapeId === tapeId;
  }

  // 현재 재생 중인 테이프 ID 반환 함수
  getCurrentTapeId() {
    return this.currentTapeId;
  }
}

// 싱글톤 인스턴스 생성
const audioController = new AudioController();
export default audioController;