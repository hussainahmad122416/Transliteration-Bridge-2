import json
import os

class PostProcessingAgent:
    """
    Handles dictionary-based corrections and final text reconstruction.
    """
    
    def __init__(self, dictionary_path: str = None):
        self.dictionary = {}
        if dictionary_path and os.path.exists(dictionary_path):
            self.load_dictionary(dictionary_path)
        else:
            self.dictionary = {
                "سوہنا": "ਸੋਹਣਾ",
                "پنجاب": "ਪੰਜਾਬ",
                "ہے": "ਹੈ",
                "اے": "ਏ",
                "نوں": "ਨੂੰ",
                "دی": "ਦੀ",
                "دا": "ਦਾ",
                "دے": "ਦੇ",
                "وچ": "ਵਿੱਚ",
                "نال": "ਨਾਲ",
                "کیہ": "ਕੀ",
                "کی": "ਕੀ"
            }
        
        # Build reverse dictionary for Gurmukhi -> Shahmukhi overrides
        self.reverse_dictionary = {v: k for k, v in self.dictionary.items()}

    def load_dictionary(self, filepath: str):
        with open(filepath, 'r', encoding='utf-8') as f:
            self.dictionary = json.load(f)
            self.reverse_dictionary = {v: k for k, v in self.dictionary.items()}

    def apply_corrections(self, original_tokens: list[str], transliterated_tokens: list[str], direction: str = "shahmukhi_to_gurmukhi") -> list[str]:
        """
        Applies dictionary corrections where the rule-based transliteration usually fails.
        """
        if len(original_tokens) != len(transliterated_tokens):
            return transliterated_tokens # fallback if mismatch
            
        corrected = []
        for orig, trans in zip(original_tokens, transliterated_tokens):
            if direction == "gurmukhi_to_shahmukhi":
                # User inputted Gurmukhi, we want Shahmukhi output
                # If the exact Gurmukhi word is in reverse dict, use the Shahmukhi value
                if orig in self.reverse_dictionary:
                    corrected.append(self.reverse_dictionary[orig])
                else:
                    corrected.append(trans)
            else:
                # Default: Shahmukhi -> Gurmukhi
                if orig in self.dictionary:
                    corrected.append(self.dictionary[orig])
                else:
                    corrected.append(trans)
                
        return corrected
        
    def reconstruct_text(self, corrected_tokens: list[str]) -> str:
        """
        Reconstructs the final Gurmukhi text from tokens.
        Handles spacing around punctuation if we preserved it.
        """
        # Since our simple tokenizer just spit out words and punctuation tokens,
        # we can join them. We should avoid spaces before punctuation like commas/periods.
        
        result = []
        for idx, token in enumerate(corrected_tokens):
            if not token:
                continue
                
            # If it's pure punctuation (not alphanumeric in Gurmukhi)
            if len(token) == 1 and not token.isalnum() and token not in ['ਂ', 'ੰ', 'ਾ', 'ਿ', 'ੀ', 'ੁ', 'ੂ', 'ੇ', 'ੈ', 'ੋ', 'ੌ']:
                result.append(token)
            else:
                # Add a space before words (if not the first word)
                if idx > 0 and result and not result[-1].endswith(' '):
                    result[-1] += ' '
                result.append(token)
                
        # cleanup double spaces that might occur
        final_text = "".join(result).replace("  ", " ").strip()
        return final_text
