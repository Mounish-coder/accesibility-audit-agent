import sqlite3

def add_columns():
    conn = sqlite3.connect("accessai.db")
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE audits ADD COLUMN scan_depth VARCHAR DEFAULT 'Standard Scan'")
        cursor.execute("ALTER TABLE audits ADD COLUMN max_pages INTEGER DEFAULT 50")
        conn.commit()
        print("Columns added successfully")
    except Exception as e:
        print(f"Error adding columns: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_columns()
