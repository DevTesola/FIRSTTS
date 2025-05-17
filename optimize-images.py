import os
from PIL import Image
import shutil

# 이미지 경로
image_dir = '/home/tesola/ttss/tesolafixjs/public/zz'
backup_dir = os.path.join(image_dir, 'backup')

# 백업 폴더 생성
if not os.path.exists(backup_dir):
    os.makedirs(backup_dir)

# 이미지 압축 함수
def compress_image(input_path, output_path, quality=85):
    try:
        # 원본 백업
        backup_path = os.path.join(backup_dir, os.path.basename(input_path))
        if not os.path.exists(backup_path):
            shutil.copy2(input_path, backup_path)
        
        # 이미지 열기
        with Image.open(input_path) as img:
            # RGBA를 RGB로 변환 (JPG는 알파 채널 지원 안함)
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img
            
            # 원본 크기 확인
            width, height = img.size
            
            # 너무 큰 이미지는 리사이즈
            max_size = 1920
            if width > max_size or height > max_size:
                ratio = min(max_size/width, max_size/height)
                new_width = int(width * ratio)
                new_height = int(height * ratio)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # 저장
            img.save(output_path, 'JPEG', quality=quality, optimize=True)
            
            # 파일 크기 비교
            original_size = os.path.getsize(input_path)
            new_size = os.path.getsize(output_path)
            
            print(f"{os.path.basename(input_path)}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB ({(1-new_size/original_size)*100:.1f}% 감소)")
            
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

# PNG와 JPG 파일 찾기
for filename in os.listdir(image_dir):
    if filename.endswith(('.png', '.jpg', '.jpeg')):
        input_path = os.path.join(image_dir, filename)
        
        # PNG는 JPG로 변환
        if filename.endswith('.png'):
            output_path = os.path.join(image_dir, filename.replace('.png', '_optimized.jpg'))
        else:
            output_path = os.path.join(image_dir, filename.replace('.jpg', '_optimized.jpg').replace('.jpeg', '_optimized.jpg'))
        
        compress_image(input_path, output_path)

print("\n이미지 최적화 완료!")
print("원본 파일은 backup 폴더에 저장되었습니다.")