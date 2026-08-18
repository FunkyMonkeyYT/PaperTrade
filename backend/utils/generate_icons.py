import math
from PIL import Image, ImageDraw

def create_pwa_icon(size, output_path, is_maskable=False):
    # Create image with RGBA
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    padding = int(size * (0.05 if not is_maskable else 0.12))
    corner_radius = int(size * 0.22) if not is_maskable else int(size * 0.15)
    
    # Background rounded rectangle
    bg_rect = [padding, padding, size - padding, size - padding]
    draw.rounded_rectangle(bg_rect, radius=corner_radius, fill=(11, 15, 25, 255), outline=(30, 41, 59, 255), width=max(1, int(size * 0.01)))

    # Draw grid lines
    line_col = (31, 41, 61, 150)
    for y_ratio in [0.35, 0.55, 0.75]:
        y = int(size * y_ratio)
        draw.line([(int(size * 0.18), y), (int(size * 0.82), y)], fill=line_col, width=max(1, int(size * 0.005)))

    # Draw Candlesticks
    # Candle 1 (Red)
    c1_x = int(size * 0.30)
    draw.line([(c1_x, int(size * 0.52)), (c1_x, int(size * 0.78))], fill=(71, 85, 105, 255), width=max(1, int(size * 0.008)))
    draw.rounded_rectangle([c1_x - int(size * 0.035), int(size * 0.58), c1_x + int(size * 0.035), int(size * 0.72)], radius=max(2, int(size * 0.008)), fill=(239, 68, 68, 220))

    # Candle 2 (Green)
    c2_x = int(size * 0.45)
    draw.line([(c2_x, int(size * 0.42)), (c2_x, int(size * 0.72))], fill=(71, 85, 105, 255), width=max(1, int(size * 0.008)))
    draw.rounded_rectangle([c2_x - int(size * 0.035), int(size * 0.48), c2_x + int(size * 0.035), int(size * 0.64)], radius=max(2, int(size * 0.008)), fill=(16, 185, 129, 220))

    # Candle 3 (Green)
    c3_x = int(size * 0.60)
    draw.line([(c3_x, int(size * 0.32)), (c3_x, int(size * 0.65))], fill=(71, 85, 105, 255), width=max(1, int(size * 0.008)))
    draw.rounded_rectangle([c3_x - int(size * 0.035), int(size * 0.38), c3_x + int(size * 0.035), int(size * 0.54)], radius=max(2, int(size * 0.008)), fill=(16, 185, 129, 220))

    # Candle 4 (Cyan)
    c4_x = int(size * 0.75)
    draw.line([(c4_x, int(size * 0.22)), (c4_x, int(size * 0.52))], fill=(71, 85, 105, 255), width=max(1, int(size * 0.008)))
    draw.rounded_rectangle([c4_x - int(size * 0.035), int(size * 0.26), c4_x + int(size * 0.035), int(size * 0.44)], radius=max(2, int(size * 0.008)), fill=(56, 189, 248, 240))

    # Dynamic Glowing Trend Line
    trend_points = [
        (int(size * 0.18), int(size * 0.75)),
        (int(size * 0.28), int(size * 0.68)),
        (int(size * 0.45), int(size * 0.52)),
        (int(size * 0.60), int(size * 0.40)),
        (int(size * 0.75), int(size * 0.26)),
        (int(size * 0.84), int(size * 0.18)),
    ]

    # Glow line behind
    draw.line(trend_points, fill=(56, 189, 248, 80), width=max(3, int(size * 0.05)), joint="curve")
    # Main trend line
    draw.line(trend_points, fill=(16, 185, 129, 255), width=max(2, int(size * 0.025)), joint="curve")

    # Peak Indicator Dot
    peak_x, peak_y = trend_points[-1]
    dot_r = int(size * 0.03)
    draw.ellipse([peak_x - dot_r, peak_y - dot_r, peak_x + dot_r, peak_y + dot_r], fill=(56, 189, 248, 255))
    draw.ellipse([peak_x - int(dot_r*1.6), peak_y - int(dot_r*1.6), peak_x + int(dot_r*1.6), peak_y + int(dot_r*1.6)], outline=(56, 189, 248, 140), width=max(1, int(size * 0.008)))

    img.save(output_path, "PNG")
    print(f"Generated {output_path} ({size}x{size})")

if __name__ == "__main__":
    import os
    out_dir = r"c:\Users\Samarth\Documents\PaperTrade\frontend\public"
    os.makedirs(out_dir, exist_ok=True)
    
    create_pwa_icon(192, os.path.join(out_dir, "pwa-192x192.png"))
    create_pwa_icon(512, os.path.join(out_dir, "pwa-512x512.png"))
    create_pwa_icon(512, os.path.join(out_dir, "maskable-icon-512x512.png"), is_maskable=True)
    create_pwa_icon(180, os.path.join(out_dir, "apple-touch-icon.png"))
    create_pwa_icon(64, os.path.join(out_dir, "favicon-64x64.png"))
