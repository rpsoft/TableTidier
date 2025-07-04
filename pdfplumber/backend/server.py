from fastapi import FastAPI, UploadFile, File
import pdfplumber
import pandas as pd

app = FastAPI()

# You can tweak these as needed
table_settings = {
	"vertical_strategy": "text",       # Try 'lines', 'text', 'explicit'
    "horizontal_strategy": "lines",      # Try 'lines', 'text', 'explicit'
    "intersection_tolerance": 2,
    "snap_x_tolerance": 5,
    "snap_y_tolerance": 1,
    "join_x_tolerance": 5,
    "join_y_tolerance": 5,
    "edge_min_length": 3,
    "min_words_vertical": 3,
    "min_words_horizontal": 1,
    "text_x_tolerance": 30,
    "text_y_tolerance": 1,
}

@app.post("/extract-tables")
async def extract_tables(file: UploadFile = File(...)):
    with pdfplumber.open(file.file) as pdf:
        all_tables = []
        for page in pdf.pages:
            # Use the custom settings for better parsing
            tables = page.extract_tables(table_settings)
            for table in tables:
                df = pd.DataFrame(table)
                all_tables.append(df.to_html(index=False))
    return {"html_tables": all_tables}
