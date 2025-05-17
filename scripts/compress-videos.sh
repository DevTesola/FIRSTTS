#!/bin/bash

# 백업 디렉토리 생성
BACKUP_DIR="public/backup"
mkdir -p $BACKUP_DIR

# 영상 파일 목록
declare -a videos=("intro.mp4" "dev.mp4" "SOLARA.mp4")

# 각 영상 압축
for video in "${videos[@]}"
do
    echo "Processing $video..."
    
    # 백업
    if [ -f "public/$video" ]; then
        cp "public/$video" "$BACKUP_DIR/${video}.backup"
        echo "✅ Backed up: $video"
        
        # 압축 (더 높은 CRF 값으로 더 많이 압축)
        if [ "$video" = "intro.mp4" ]; then
            # intro.mp4는 16MB로 매우 크므로 더 많이 압축
            ffmpeg -i "public/$video" -c:v libx264 -preset slow -crf 32 -c:a aac -b:a 96k -movflags +faststart "public/${video}.temp" -y
        else
            # 다른 영상들은 적당히 압축
            ffmpeg -i "public/$video" -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 128k -movflags +faststart "public/${video}.temp" -y
        fi
        
        # 성공하면 원본 교체
        if [ $? -eq 0 ]; then
            mv "public/${video}.temp" "public/$video"
            
            # 크기 비교
            original_size=$(du -h "$BACKUP_DIR/${video}.backup" | cut -f1)
            new_size=$(du -h "public/$video" | cut -f1)
            echo "✅ Compressed: $video ($original_size → $new_size)"
        else
            echo "❌ Failed to compress $video"
            rm -f "public/${video}.temp"
        fi
    else
        echo "⚠️ $video not found"
    fi
    
    echo ""
done

echo "🎬 Video compression complete!"