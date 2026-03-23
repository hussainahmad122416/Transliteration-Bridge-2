import requests
import json

data = {"text": "ਸੋਹਣਾ", "direction": "gurmukhi_to_shahmukhi"}
response = requests.post("http://localhost:8000/api/transliterate", json=data)

# Print raw JSON directly
data = response.json()
with open("test_out.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Saved output to test_out.json")
