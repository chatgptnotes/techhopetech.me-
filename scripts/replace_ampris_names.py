"""Replace company names in Ampris Rate Contract PDF.

In-place edit: collect rects of old names, redact them, insert new name in same box.
"""
import pymupdf

SRC = r"C:\Users\ap547\Downloads\Ampris_Rate_Contract_List_v1.0.pdf"
DST = r"C:\Users\ap547\Desktop\Ampris_Rate_Contract_List_v1.0_Sunrising.pdf"

NEW_NAME = "Sunrising Electrical Private Limited"
TARGETS = ["Rudra Automation"]

doc = pymupdf.open(SRC)
total = 0
for page in doc:
    hits = []
    for target in TARGETS:
        for rect in page.search_for(target):
            hits.append(rect)
    for rect in hits:
        page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions()
    for rect in hits:
        # Match original: Arial Bold 9pt, navy 0x1a375e
        page.insert_text(
            (rect.x0, rect.y1 - 1),
            NEW_NAME,
            fontsize=9, fontname="hebo",
            color=(0x1a / 255, 0x37 / 255, 0x5e / 255),
        )
        total += 1

doc.save(DST)
doc.close()
print(f"Replaced {total} occurrence(s). Saved to: {DST}")
