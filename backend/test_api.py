import requests
import os
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def check_data():
    print(f"Checking Supabase at: {url}")
    try:
        # Check Batches
        resp = requests.get(f"{url}/rest/v1/batches?select=name&limit=5", headers=headers)
        resp.raise_for_status()
        batches = resp.json()
        print(f"Found batches: {batches}")
        
        if batches:
            batch_name = batches[0]['name']
            # Test local API
            print(f"Testing local API /api/generate-timetable with batch: {batch_name}")
            local_resp = requests.post("http://127.0.0.1:5000/api/generate-timetable", 
                                       json={"batch_name": batch_name})
            print(f"Status: {local_resp.status_code}")
            print(f"Result: {local_resp.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_data()
