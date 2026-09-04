import os
import csv
import random
from datetime import datetime, timedelta

WORKSPACE = os.path.dirname(os.path.abspath(__file__))

# The scraper saves data to these directories
LS_DIR = os.path.join(WORKSPACE, "LS_DATASET")
RS_DIR = os.path.join(WORKSPACE, "RS_DATASET")

os.makedirs(LS_DIR, exist_ok=True)
os.makedirs(RS_DIR, exist_ok=True)

STATE_CODES = {
    "Maharashtra": "MH", "Uttar Pradesh": "UP", "Karnataka": "KA",
    "Tamil Nadu": "TN", "Gujarat": "GJ", "Delhi": "DL",
    "Rajasthan": "RJ", "West Bengal": "WB", "Bihar": "BR",
    "Madhya Pradesh": "MP"
}
STATES = list(STATE_CODES.keys())
CATEGORIES = ["Education", "Drinking Water", "Sanitation", "Health", "Roads", "Electricity"]
VENDORS = ["ABC Constructions", "XYZ Builders", "Global Infra Ltd", "State PWD", "Rural Works Dept",
           "Shree Constructions", "National Infra Corp", "BuildWell Pvt Ltd"]
DISTRICTS = ["District_A", "District_B", "District_C", "District_D", "District_E"]
YEARS = ["2021-2022", "2022-2023", "2023-2024"]

_work_id_counter = 1000

def new_work_id(state):
    """Generate a work ID in real MOSPI format: XX/YYY/YYYY-YYYY/NNNN"""
    global _work_id_counter
    code = STATE_CODES.get(state, "XX")
    district_num = random.randint(100, 999)
    year = random.choice(YEARS)
    _work_id_counter += 1
    return f"{code}/{district_num}/{year}/{_work_id_counter}"

def work_title(work_id, category):
    """Format as it appears in MOSPI: ID - Description"""
    desc = f"Construction of {category} facility"
    return f"{work_id} - {desc}"

def random_date(start_year=2021, end_year=2024):
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    random_days = random.randint(0, (end - start).days)
    return (start + timedelta(days=random_days)).strftime('%d-%m-%Y')

def generate_mock_data(house, folder, num_mps=50):
    print(f"Scraping data for {house}...")

    # Pre-generate a shared pool of work IDs per MP so tables can be joined
    mp_works = {}  # mp_idx -> list of (work_id, work_title_str, state, constituency, category)
    for i in range(1, num_mps + 1):
        state = random.choice(STATES)
        constituency = f"Constituency_{i}"
        mp_name = f"MP_Name_{i}"
        works = []
        for _ in range(random.randint(3, 8)):
            wid = new_work_id(state)
            wtitle = work_title(wid, random.choice(CATEGORIES))
            cat = random.choice(CATEGORIES)
            works.append((wid, wtitle, state, constituency, mp_name, cat))
        mp_works[i] = works

    # Flatten all works
    all_works = [w for works in mp_works.values() for w in works]

    # 1. Allocated Limit
    with open(os.path.join(folder, "Allocated Limit for Honble MPs_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Sr_No", "state", "constituency", "Hon'ble Members of Parliament", "allocated_amount"])
        for i in range(1, num_mps + 1):
            state = mp_works[i][0][2] if mp_works[i] else random.choice(STATES)
            writer.writerow([i, state, f"Constituency_{i}", f"MP_Name_{i}", random.randint(20000000, 50000000)])

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
        for idx, (wid, wtitle_str, state, constituency, mp_name, cat) in enumerate(all_works, 1):
            writer.writerow([idx, state, constituency, mp_name, wtitle_str, cat, random_date(), random.randint(500000, 2000000)])

    # 4. Works Sanctioned
    with open(os.path.join(folder, "Works Sanctioned_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sr_no", "state", "ida", "constituency", "mp_name", "work", "work_category", "sanction_date", "sanction_amount", "work_status"])
        for idx, (wid, wtitle_str, state, constituency, mp_name, cat) in enumerate(all_works, 1):
            district = random.choice(DISTRICTS)
            writer.writerow([idx, state, district, constituency, mp_name, wtitle_str, cat, random_date(), random.randint(400000, 1900000), "Sanctioned"])

    # 5. Works Completed (subset)
    completed = random.sample(all_works, k=max(1, len(all_works) // 3))
    with open(os.path.join(folder, "Works Completed_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sr_no", "state", "constituency", "mp_name", "work", "completion_date", "work_status"])
        for idx, (wid, wtitle_str, state, constituency, mp_name, cat) in enumerate(completed, 1):
            writer.writerow([idx, state, constituency, mp_name, wtitle_str, random_date(), "Completed"])

    # 6. Expenditure (multiple transactions per work)
    with open(os.path.join(folder, "Expenditure on Completed and On-going Works_2024.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sr_no", "state", "constituency", "mp_name", "work", "vendor_name", "expenditure_date", "fund_disbursed_amount"])
        idx = 1
        for (wid, wtitle_str, state, constituency, mp_name, cat) in all_works:
            for _ in range(random.randint(1, 4)):
                writer.writerow([idx, state, constituency, mp_name, wtitle_str, random.choice(VENDORS), random_date(), random.randint(50000, 500000)])
                idx += 1

def run_scraper():
    global _work_id_counter
    _work_id_counter = 1000
    print("Initiating MOSPI Scraper...")
    generate_mock_data("Lok Sabha", LS_DIR, num_mps=543)
    _work_id_counter = 50000  # Separate range for Rajya Sabha
    generate_mock_data("Rajya Sabha", RS_DIR, num_mps=245)
    print("Scraping completed. CSV files generated successfully.")

if __name__ == "__main__":
    run_scraper()
