from PIL import Image, ImageDraw, ImageFont

def load_font(size):
    try:
        font_path = "C:/Windows/Fonts/timesbi.ttf" 
        return ImageFont.truetype(font_path, size)
    except OSError:
        # フォントが見つからない場合のフォールバック（デフォルトフォント）
        print("指定のフォントが見つかりませんでした。デフォルトを使用します。")
        return ImageFont.load_default()

ccolors = [ (204,96,96), (17,17,119), (96,96,204), (192,192,0), (186,115,87), (207,141,154) ]
wcolors = [ (238,128,128), (119,119,204), (192,192,255), (208,208,0), (222,150,122), (247,202,203)]
suits = ["Md.png", "Hm.png", "Sy.png", "Mm.png", "Ky.png", "Ng.png"]

mark_images = []
for s in suits:
    try:
        # 透過PNGとして読み込む
        mark_images.append(Image.open(s).convert("RGBA"))
    except FileNotFoundError:
        print(f"警告: {s} が見つかりません。")
        mark_images.append(None)

def generate_card_sheet():
    card_w, card_h = 90, 120
    cols, rows = 11, 6
    num_font = load_font(30)

    sheet_w = card_w * cols
    sheet_h = card_h * rows
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (0, 0, 0, 0))

    for i in range(rows):
        draw = ImageDraw.Draw(sheet)
        draw.rectangle((card_w, card_h*i, sheet_w, card_h*(i+1)), fill=ccolors[i])
        for j in range(1, cols):
            draw.rectangle((card_w*j+3, card_h*i+3, card_w*(j+1)-3, card_h*(i+1)-3), fill=wcolors[i])
            if mark_images[i]:
                mark_img = mark_images[i]
                # pasteの第3引数に同じ画像を渡すことで、アルファチャンネル（透過）を適用する
                sheet.paste(mark_img, (card_w * j, card_h * i), mark_img)

            text_x = card_w * (j+0.8)
            text_y = 10 + card_h * (i+0.8)
            draw.text((text_x, text_y), str(j), font=num_font, fill="white", stroke_width=2, stroke_fill=ccolors[i], anchor="ms")

    sheet.save("cardimages.png")
    print("cardimages.png を保存しました！")

if __name__ == "__main__":
    generate_card_sheet()
