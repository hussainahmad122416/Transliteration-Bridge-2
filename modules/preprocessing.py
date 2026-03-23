import re
import unicodedata

class PreprocessingAgent:
    """
    Handles text cleaning, Unicode normalization, script detection, 
    and word tokenization for Shahmukhi Punjabi.
    """
    
    def __init__(self):
        # 1. Shahmukhi detection regex
        self.shahmukhi_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')
        
        # Gurmukhi Unicode range: \u0A00-\u0A7F
        self.gurmukhi_pattern = re.compile(r'[\u0A00-\u0A7F]')

        # word_pattern captures sequences of word characters + our unicode blocks
        # including ZWNJ (\u200C) which is common in Urdu/Shahmukhi
        self.word_pattern = re.compile(r'[\w\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0A00-\u0A7F\u200C]+')

        # Urdu/Shahmukhi punctuation to map to standard or remove if noise
        # ، : comma (060C)
        # ؛ : semicolon (061B)
        # ؟ : question mark (061F)
        # ۔ : full stop (06D4)
        self.punctuation_mapping = {
            '،': ',',
            '؛': ';',
            '؟': '?',
            '۔': '.'
        }

    def normalize_unicode(self, text: str) -> str:
        """
        Normalizes Unicode characters to NFC to ensure consistent character representation.
        Also standardizes some common variants (e.g. Arabic vs Urdu letters if needed).
        """
        if not text:
            return ""
            
        text = unicodedata.normalize('NFC', text)
        
        # Standardize standard Arabic characters to their Urdu/Shahmukhi equivalents if mixed up
        # e.g., Arabic Kaf (ك) to Urdu Kaf (ک)
        text = text.replace('ك', 'ک')
        # Arabic Yeh (ي) to Urdu Yeh (ی)
        text = text.replace('ي', 'ی')
        # Arabic Heh (ه) to Urdu Heh (ہ)
        text = text.replace('ه', 'ہ')
        
        return text

    def clean_text(self, text: str) -> str:
        """
        Removes unnecessary noise, normalizes punctuation, and removes extra spaces.
        """
        if not text:
            return ""
            
        text = self.normalize_unicode(text)
        
        # Map Shahmukhi specific punctuation to standard (can be useful for uniform tokenization)
        for shahmukhi_punc, std_punc in self.punctuation_mapping.items():
            text = text.replace(shahmukhi_punc, std_punc)
            
        # Optional: remove noise like non-printable characters
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        # Replace multiple spaces/newlines with a single space (unless preserving paragraphs is strictly needed)
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    def is_shahmukhi(self, text: str) -> bool:
        """
        Detects if the given text contains Shahmukhi (Perso-Arabic) script.
        Checks if at least 50% of the alphabetic characters are from the Arabic block.
        """
        if not text:
            return False
            
        # Count all alphabetic characters
        alphabetic_chars = [c for c in text if c.isalpha()]
        if not alphabetic_chars:
            return False
            
        # Count Shahmukhi characters
        shahmukhi_chars = [c for c in alphabetic_chars if self.shahmukhi_pattern.match(c)]
        
        ratio = len(shahmukhi_chars) / len(alphabetic_chars)
        return ratio > 0.5

    def tokenize(self, text: str) -> list[str]:
        """
        Tokenizes the input text into a list of words, taking care of punctuation.
        """
        # We might want to keep the punctuation to reconstruct the sentence later.
        # So we can tokenize using a regex that splits by whitespace but keeps punctuation separate,
        # or just split by whitespace if punctuation is attached.
        # For transliteration, word-level is important. Let's use a regex that extracts words and non-words (punctuation/spaces).
        
        # This regex matches either a word (\w+) or a non-word (\W+)
        # Wait, \w includes english letters and numbers. For Shahmukhi, \w works fine in Python 3.
        # But to be safe, let's split by space, then strip punctuation during processing if needed, 
        # OR return tuples of (word, is_punctuation).
        
        # Let's use a simple approach: findall for words and punctuation
        # tokens = re.findall(r'\w+|[^\w\s]', text, re.UNICODE)
        # 4. Tokenization (Keep words vs punctuation/spaces separated)
        # Using the updated word_pattern which supports Shahmukhi, Gurmukhi and English
        tokens = []
        last_end = 0
        
        for match in self.word_pattern.finditer(text):
            start, end = match.span()
            if start > last_end:
                # Add non-word characters as a token
                tokens.append(text[last_end:start])
            tokens.append(match.group())
            last_end = end
            
        if last_end < len(text):
            tokens.append(text[last_end:])
            
        return tokens

    def process(self, raw_text: str) -> dict:
        """
        Full preprocessing pipeline.
        Returns a dictionary with cleaned text, tokens, and script check.
        """
        cleaned = self.clean_text(raw_text)
        is_shahmukhi_script = self.is_shahmukhi(cleaned)
        tokens = self.tokenize(cleaned)
        
        return {
            "cleaned_text": cleaned,
            "is_shahmukhi": is_shahmukhi_script,
            "tokens": tokens,
            "word_count": len([t for t in tokens if any(c.isalpha() for c in t)])
        }

# Example usage (for testing)
if __name__ == "__main__":
    agent = PreprocessingAgent()
    sample = "پنجاب سوہنا اے، کیا یہ سچ ہے؟"
    res = agent.process(sample)
    print("Cleaned:", res['cleaned_text'])
    print("Is Shahmukhi:", res['is_shahmukhi'])
    print("Tokens:", res['tokens'])
    print("Word Count:", res['word_count'])
