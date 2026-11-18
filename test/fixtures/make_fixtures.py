"""生成 extract.test.mjs 使用的 docx/pptx fixture。

用法：python3 make_fixtures.py <输出目录>
依赖 bundled python 的 python-docx / python-pptx / Pillow；不写入项目其他位置。
生成文件：
  - sample.docx：中文段落 + 表格 + 图片，用于验证阅读顺序、表格、图片占位。
  - sample.pptx：两页幻灯片（正文 + 表格 + 图片），用于验证分页顺序。
  - sample.png：上面两个文档共用的图片。
"""

import os
import sys

from PIL import Image, ImageDraw


def make_image(path):
    image = Image.new("RGB", (240, 160), (245, 245, 250))
    draw = ImageDraw.Draw(image)
    draw.rectangle([10, 10, 230, 150], outline=(200, 30, 40), width=4)
    draw.line([20, 130, 220, 30], fill=(30, 60, 200), width=3)
    draw.ellipse([90, 55, 150, 115], fill=(250, 210, 60), outline=(40, 40, 40), width=2)
    image.save(path, "PNG")


def make_docx(output_dir, image_path):
    from docx import Document
    from docx.shared import Inches

    document = Document()
    document.add_heading("刷题模式文档抽取测试", level=1)
    document.add_paragraph("第一段：中文段落内容，用于验证段落顺序。")
    document.add_paragraph("第二段：包含 English words 与数字 12345。")

    table = document.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "表头甲"
    table.cell(0, 1).text = "表头乙"
    table.cell(1, 0).text = "数据一"
    table.cell(1, 1).text = "数据二"

    document.add_paragraph("第三段：表格之后出现的段落。")
    document.add_picture(image_path, width=Inches(1.2))
    document.add_paragraph("第四段：图片之后的结尾段落。")
    document.save(os.path.join(output_dir, "sample.docx"))


def make_pptx(output_dir, image_path):
    from pptx import Presentation
    from pptx.util import Inches

    presentation = Presentation()
    blank = presentation.slide_layouts[6]

    slide_one = presentation.slides.add_slide(blank)
    title = slide_one.shapes.add_textbox(Inches(0.6), Inches(0.4), Inches(8.0), Inches(1.0))
    title.text_frame.text = "第一页标题"
    body = slide_one.shapes.add_textbox(Inches(0.6), Inches(1.4), Inches(8.0), Inches(1.4))
    body.text_frame.text = "第一页正文：中文内容"
    body.text_frame.add_paragraph().text = "第一页第二段：English 123"
    slide_one.shapes.add_picture(image_path, Inches(0.6), Inches(3.2), width=Inches(1.5))

    slide_two = presentation.slides.add_slide(blank)
    title_two = slide_two.shapes.add_textbox(Inches(0.6), Inches(0.4), Inches(8.0), Inches(1.0))
    title_two.text_frame.text = "第二页标题"
    table_shape = slide_two.shapes.add_table(2, 2, Inches(0.6), Inches(1.6), Inches(5.0), Inches(1.2))
    table = table_shape.table
    table.cell(0, 0).text = "表头A"
    table.cell(0, 1).text = "表头B"
    table.cell(1, 0).text = "数据A"
    table.cell(1, 1).text = "数据B"

    presentation.save(os.path.join(output_dir, "sample.pptx"))


def main():
    if len(sys.argv) < 2:
        print("用法：python3 make_fixtures.py <输出目录>", file=sys.stderr)
        return 2
    output_dir = os.path.abspath(sys.argv[1])
    os.makedirs(output_dir, exist_ok=True)
    image_path = os.path.join(output_dir, "sample.png")
    make_image(image_path)
    make_docx(output_dir, image_path)
    make_pptx(output_dir, image_path)
    print("fixtures 已生成：sample.docx / sample.pptx / sample.png")
    return 0


if __name__ == "__main__":
    sys.exit(main())
