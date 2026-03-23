import sys
sys.stdout.reconfigure(encoding='utf-8')
from main import run_transliteration_pipeline

test_cases = [
    "پنجاب سوہنا اے",
    "یہ ایک کتاب ہے۔",
    "کیا حال ہے؟",
    "کھل",          # Aspirates: Kh
    "وقت",           # Vav at the start
]

print("Starting Pipeline Test...\n" + "="*40)
for text in test_cases:
    res = run_transliteration_pipeline(text)
    print(f"Shahmukhi Input: {text}")
    print(f"Gurmukhi Output: {res['gurmukhi']}")
    print(f"Stats: {res['word_count']} words, {res['char_count']} chars, {res['process_time_ms']}ms")
    print("-" * 40)
print("Pipeline Test Completed successfully.")
