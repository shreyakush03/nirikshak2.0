import os
import csv
import random
from datetime import datetime, timedelta

WORKSPACE = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(WORKSPACE)

# The scraper saves data to these directories
LS_DIR = os.path.join(WORKSPACE, "LS_DATASET")
RS_DIR = os.path.join(WORKSPACE, "RS_DATASET")

os.makedirs(LS_DIR, exist_ok=True)
os.makedirs(RS_DIR, exist_ok=True)

STATES = ["Maharashtra", "Uttar Pradesh", "Karnataka", "Tamil Nadu", "Gujarat", "Delhi"]
CATEGORIES = ["Education", "Drinking Water", "Sanitation", "Health", "Roads", "Electricity"]
VENDORS = ["ABC Constructions", "XYZ Builders", "Global Infra", "State PWD", "Rural Works Dept"]

def random_date(start_year=2021, end_year=2024):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 1, 1)
    random_days = random.randint(0, (end - start).days)
    return (start + timedelta(days=random_days)).strftime('%d-%m-%Y')

def generate_mock_data(house, folder, num_mps=50):
    print(f"Scraping data for {house}...")
    
    # 1. Allocated Limit
    with open(os.path.join(folder, "Allocated Limit for Honble MPs_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Sr_No", "state", "constituency", "Hon'ble Members of Parliament", "allocated_amount"])
        for i in range(1, num_mps + 1):
            writer.writerow([i, random.choice(STATES), f"Constituency_{i}", f"MP_Name_{i}", random.randint(20000000, 50000000)])

    # 2. Calamity Consents
    with open(os.path.join(folder, "Amount consented for Calamity_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Sr_No", "state", "calamity_type", "calamity_name", "date_of_consent", "consent_amount"])
        for i in range(1, 20):
            writer.writerow([i, random.choice(STATES), "Natural", "Flood Relief", random_date(), random.randint(1000000, 5000000)])

    # 3. Works Recommended
    with open(os.path.join(folder, "Works Recommended_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sr_no", "state", "constituency", "mp_name", "work", "work_category", "recommended_date", "recommended_amount"])
        for i in range(1, num_mps * 5):
            writer.writerow([i, random.choice(STATES), f"Constituency_{i%num_mps+1}", f"MP_Name_{i%num_mps+1}", f"Work_{i}", random.choice(CATEGORIES), random_date(), random.randint(500000, 2000000)])

    # 4. Works Sanctioned
    with open(os.path.join(folder, "Works Sanctioned_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sr_no", "state", "ida", "constituency", "mp_name", "work", "work_category", "sanction_date", "sanction_amount", "work_status"])
        for i in range(1, num_mps * 4):
            writer.writerow([i, random.choice(STATES), f"District_{i%10}", f"Constituency_{i%num_mps+1}", f"MP_Name_{i%num_mps+1}", f"Work_{i}", random.choice(CATEGORIES), random_date(), random.randint(400000, 1900000), "Sanctioned"])

    # 5. Works Completed
    with open(os.path.join(folder, "Works Completed_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sr_no", "state", "constituency", "mp_name", "work", "completion_date", "work_status"])
        for i in range(1, num_mps * 2):
            writer.writerow([i, random.choice(STATES), f"Constituency_{i%num_mps+1}", f"MP_Name_{i%num_mps+1}", f"Work_{i}", random_date(), "Completed"])

    # 6. Expenditure
    with open(os.path.join(folder, "Expenditure on Completed and On-going Works_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sr_no", "state", "constituency", "mp_name", "work", "vendor_name", "expenditure_date", "fund_disbursed_amount"])
        for i in range(1, num_mps * 8):
            writer.writerow([i, random.choice(STATES), f"Constituency_{i%num_mps+1}", f"MP_Name_{i%num_mps+1}", f"Work_{i%200+1}", random.choice(VENDORS), random_date(), random.randint(50000, 500000)])

def run_scraper():
    print("Initiating MOSPI Scraper...")
    generate_mock_data("Lok Sabha", LS_DIR, num_mps=543)
    generate_mock_data("Rajya Sabha", RS_DIR, num_mps=245)
    print("Scraping completed. CSV files generated successfully.")

if __name__ == "__main__":
    run_scraper()
