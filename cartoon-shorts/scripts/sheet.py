"""Contact sheet of out/stills/*.png with time labels -> out/sheet.png (or argv[1])."""
import glob, sys, os
from PIL import Image, ImageDraw
files = sorted(glob.glob('out/stills/t*.png'))
cols = int(os.environ.get('COLS', 7))
tw = int(os.environ.get('TW', 270))
ims = [Image.open(f).convert('RGB') for f in files]
th = int(tw * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 22)), (255, 255, 255))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * tw, (i // cols) * (th + 22)
    sheet.paste(im.resize((tw, th)), (x, y + 22))
    d.text((x + 4, y + 4), os.path.basename(f)[1:-4] + ' s', fill=(0, 0, 0))
sheet.save(sys.argv[1] if len(sys.argv) > 1 else 'out/sheet.png')
print(sheet.size)
