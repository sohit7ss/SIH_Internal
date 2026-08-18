# from fpdf import FPDF

# def make_pdf(summary_text: str, output_path: str, title: str = "Lecture Summary"):
#     pdf = FPDF()
#     pdf.add_page()
#     pdf.set_font("Helvetica", "B", 16)
#     pdf.cell(0, 10, title, ln=True)
#     pdf.ln(4)
#     pdf.set_font("Helvetica", size=11)
#     safe_text = summary_text.encode("latin-1", "ignore").decode("latin-1")
#     pdf.multi_cell(0, 7, safe_text)
#     pdf.output(output_path)

from fpdf import FPDF

def make_pdf(summary_text: str, output_path: str, title: str = "Lecture Summary"):
    pdf = FPDF()
    pdf.add_page()

    # Sanitize BOTH title and body — anything outside Latin-1 gets stripped
    safe_title = title.encode("latin-1", "ignore").decode("latin-1")
    safe_text = summary_text.encode("latin-1", "ignore").decode("latin-1")

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, safe_title, ln=True)
    pdf.ln(4)
    pdf.set_font("Helvetica", size=11)
    pdf.multi_cell(0, 7, safe_text)
    pdf.output(output_path)