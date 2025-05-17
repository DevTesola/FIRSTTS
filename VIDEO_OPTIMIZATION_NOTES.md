# 비디오 최적화 가이드

## 압축이 필요한 비디오 파일들
- intro.mp4 (16MB)
- dev.mp4 (4.4MB) 
- SOLARA.mp4 (4.6MB)

## FFmpeg 설치 방법

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

### macOS:
```bash
brew install ffmpeg
```

### Windows:
FFmpeg 공식 사이트에서 다운로드: https://ffmpeg.org/download.html

## 비디오 압축 명령어

압축 스크립트를 실행하거나 다음 명령어를 직접 사용할 수 있습니다:

```bash
# intro.mp4 압축 (높은 압축률)
ffmpeg -i public/intro.mp4 -c:v libx264 -preset slow -crf 30 -c:a aac -b:a 128k -movflags +faststart public/intro_compressed.mp4

# dev.mp4 압축
ffmpeg -i public/dev.mp4 -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 128k -movflags +faststart public/dev_compressed.mp4

# SOLARA.mp4 압축
ffmpeg -i public/SOLARA.mp4 -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 128k -movflags +faststart public/SOLARA_compressed.mp4
```

## 옵션 설명
- `-c:v libx264`: H.264 비디오 코덱 사용
- `-preset slow`: 느리지만 효율적인 압축
- `-crf 28-30`: 품질 수준 (낮을수록 품질 높음, 18-30 권장)
- `-c:a aac`: AAC 오디오 코덱
- `-b:a 128k`: 오디오 비트레이트
- `-movflags +faststart`: 웹 스트리밍 최적화

## 예상 결과
- intro.mp4: 16MB → 약 3-4MB (75% 감소)
- dev.mp4: 4.4MB → 약 1-2MB (60% 감소)
- SOLARA.mp4: 4.6MB → 약 1-2MB (60% 감소)