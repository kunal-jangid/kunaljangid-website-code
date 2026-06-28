import os

photo_dir = 'photography'
valid_extensions = ('.png', '.jpg', '.jpeg', '.webp')

if os.path.exists(photo_dir):
    # Scan directory and filter valid images
    photos = [
        f"{photo_dir}/{file}" for file in os.listdir(photo_dir)
        if file.lower().endswith(valid_extensions) and file != 'photos.js'
    ]
    
    # Save the array directly as an exported global JS variable
    with open(os.path.join(photo_dir, 'photos.js'), 'w') as js_file:
        js_file.write(f"window.photoAssets = {repr(photos)};")
        
    print(f"[OK] Dynamically indexed {len(photos)} images into photography/photos.js")
else:
    print(f"Error: '{photo_dir}' folder not found in your root directory.")