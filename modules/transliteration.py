import re

class TransliterationEngine:
    """
    Bidirectional transliteration engine (Shahmukhi <-> Gurmukhi)
    Handling base mapping, contextual vowels, aspirated consonants, and nasalization.
    """
    
    def __init__(self):
        # --- SHAHMUKHI TO GURMUKHI MAPS ---
        
        # 1. Aspirated Consonants
        self.s2g_aspirated = {
            'کھ': 'ਖ', 'گھ': 'ਘ', 'چھ': 'ਛ', 'جھ': 'ਝ', 'ٹھ': 'ਠ',
            'ڈھ': 'ਢ', 'تھ': 'ਥ', 'دھ': 'ਧ', 'پھ': 'ਫ', 'بھ': 'ਭ', 'ڑھ': 'ੜ੍ਹ'
        }
        
        # 2. Base Consonants Mapping
        self.s2g_base = {
            'ب': 'ਬ', 'پ': 'ਪ', 'ت': 'ਤ', 'ٹ': 'ਟ', 'ث': 'ਸ', 'ج': 'ਜ',
            'چ': 'ਚ', 'ح': 'ਹ', 'خ': 'ਖ', 'د': 'ਦ', 'ڈ': 'ਡ', 'ذ': 'ਜ਼',
            'ر': 'ਰ', 'ڑ': 'ੜ', 'ز': 'ਜ਼', 'ژ': 'ਯ', 'س': 'ਸ', 'ش': 'ਸ਼',
            'ص': 'ਸ', 'ض': 'ਜ਼', 'ط': 'ਤ', 'ظ': 'ਜ਼', 'ع': 'ਅ', 'غ': 'ਗ਼',
            'ف': 'ਫ਼', 'ق': 'ਕ਼', 'ک': 'ਕ', 'گ': 'ਗ', 'ل': 'ਲ', 'م': 'ਮ',
            'ن': 'ਨ', 'ہ': 'ਹ', 'ھ': 'ਹ', 'ء': ''
        }

        # --- GURMUKHI TO SHAHMUKHI MAPS ---
        # Inverse mapping approach with some contextual tweaks 
        
        # 1. Aspirates inverse
        self.g2s_aspirated = {v: k for k, v in self.s2g_aspirated.items()}
        # Specific overrides
        self.g2s_aspirated['ੜ੍ਹ'] = 'ڑھ'
        
        # 2. Base Consonants inverse
        # Note: Gurmukhi lacks distinctions like S (س, ص, ث), Z (ز, ذ, ض, ظ). We default to the most common (س, ز).
        self.g2s_base = {
            'ਬ': 'ب', 'ਪ': 'پ', 'ਤ': 'ت', 'ਟ': 'ٹ', 'ਸ': 'س', 'ਜ': 'ج',
            'ਚ': 'چ', 'ਹ': 'ہ', 'ਖ': 'کھ', 'ਦ': 'د', 'ਡ': 'ڈ', 'ਜ਼': 'ز',
            'ਰ': 'ر', 'ੜ': 'ڑ', 'ਯ': 'ی', 'ਸ਼': 'ش', 'ਅ': 'ا', 'ਗ਼': 'غ',
            'ਫ਼': 'ف', 'ਕ਼': 'ق', 'ਕ': 'ک', 'ਗ': 'گ', 'ਲ': 'ل', 'ਮ': 'م',
            'ਨ': 'ن',
            # Vowel carriers/vowels roughly
            'ਆ': 'آ', 'ਇ': 'اِ', 'ਈ': 'ای', 'ਉ': 'اُ', 'ਊ': 'او',
            'ਏ': 'اے', 'ਐ': 'اے', 'ਓ': 'او', 'ਔ': 'او',
            # Gurmukhi Matras roughly to Shahmukhi
            'ਾ': 'ا', 'ਿ': '', 'ੀ': 'ی', 'ੁ': '', 'ੂ': 'و',
            'ੇ': 'ے', 'ੈ': 'ے', 'ੋ': 'و', 'ੌ': 'و'
        }
        
        self.g2s_nasal = {
            'ਂ': 'ں', 'ੰ': 'ں'
        }

    # ==========================================
    # SHAHMUKHI -> GURMUKHI
    # ==========================================
    def s2g_handle_aspirates(self, word: str) -> str:
        for s_asp, g_asp in self.s2g_aspirated.items():
            word = word.replace(s_asp, g_asp)
        return word

    def shahmukhi_to_gurmukhi_word(self, word: str) -> str:
        word = self.s2g_handle_aspirates(word)
        result = []
        i = 0
        length = len(word)
        
        while i < length:
            char = word[i]
            
            # Context Rules for Vaw (و)
            if char == 'و':
                if i == 0: result.append('ਵ')
                else:
                    prev_char = word[i-1] if i > 0 else ''
                    next_char = word[i+1] if i < length-1 else ''
                    if next_char == 'ا' or prev_char == 'ا': result.append('ਵ')
                    else: result.append('ੋ')
            
            # Context Rules for Alif (ا)
            elif char == 'ا':
                if i == 0: result.append('ਅ')
                else: result.append('ਾ')
                    
            # Context Rules for Yeh (ی)
            elif char == 'ی':
                if i == 0: result.append('ਯ')
                else: result.append('ੀ')
                    
            elif char == 'ے': result.append('ੇ')
            elif char == 'ں': result.append('ਂ')
            elif char in self.s2g_base: result.append(self.s2g_base[char])
            elif char in ['\u064E', '\u0650', '\u064F']: pass # Ignore diacritics
            else: result.append(char)
                
            i += 1
            
        return "".join(result)

    # ==========================================
    # GURMUKHI -> SHAHMUKHI
    # ==========================================
    def g2s_handle_aspirates(self, word: str) -> str:
        for g_asp, s_asp in self.g2s_aspirated.items():
            word = word.replace(g_asp, s_asp)
        return word

    def gurmukhi_to_shahmukhi_word(self, word: str) -> str:
        word = self.g2s_handle_aspirates(word)
        result = []
        i = 0
        length = len(word)
        
        while i < length:
            char = word[i]
            
            # special case for 'ਵ' (Vav) which is highly contextual
            if char == 'ਵ':
                result.append('و')
            elif char in self.g2s_nasal:
                # Nasal markers usually map to noon-ghunna at end, noon in middle
                if i == length - 1:
                    result.append('ں')
                else:
                    result.append('ن')
            elif char in self.g2s_base:
                result.append(self.g2s_base[char])
            else:
                result.append(char)
                
            i += 1
            
        return "".join(result)

    # ==========================================
    # MAIN WRAPPER
    # ==========================================
    def process(self, tokens: list[str], direction: str = "shahmukhi_to_gurmukhi") -> list[str]:
        if direction == "gurmukhi_to_shahmukhi":
            return [self.gurmukhi_to_shahmukhi_word(t) for t in tokens]
        else:
            return [self.shahmukhi_to_gurmukhi_word(t) for t in tokens]

# Test Case
if __name__ == "__main__":
    engine = TransliterationEngine()
    
    test_words = ['پنجاب', 'سوہنا', 'اے', 'کھل', 'وقت']
    print(f"{'Shahmukhi':<10} | {'Gurmukhi (Raw)':<15}")
    print("-" * 30)
    for w in test_words:
        res = engine.translate_word(w)
        print(f"{w:<10} | {res:<15}")
