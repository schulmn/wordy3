def read_words_from_file(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
        words = content.split()
    print(f"Read {len(words)} words from {file_path}")
    print(f"Content of the file:\n{content[:500]}...")  # Print the first 500 characters for debugging
    return words

def categorize_words(words):
    categories = {
        '3_letters': [],
        '4_letters': [],
        '5_letters': [],
        '6_letters': [],
        '7_letters': []
    }
    
    for word in words:
        if len(word) == 3:
            categories['3_letters'].append(word)
        elif len(word) == 4:
            categories['4_letters'].append(word)
        elif len(word) == 5:
            categories['5_letters'].append(word)
        elif len(word) == 6:
            categories['6_letters'].append(word)
        elif len(word) == 7:
            categories['7_letters'].append(word)
    
    for length, words in categories.items():
        print(f"Categorized {len(words)} {length.replace('_', ' ')} words")
    
    return categories

def limit_words(categories):
    # No limits, return categories as is
    return categories

def format_as_js_set(categories):
    all_words = []
    for category in categories.values():
        all_words.extend(category)
    
    js_set = "export const validWords = new Set([\n"
    for word in all_words:
        js_set += f"    '{word.upper()}',\n"
    js_set = js_set.rstrip(',\n') + "\n]);"
    print(f"Formatted JavaScript set with {len(all_words)} words")
    return js_set

def save_js_file(js_content, output_file_path):
    with open(output_file_path, 'w') as file:
        file.write(js_content)
    print(f"Saved JavaScript set to {output_file_path}")

def main():
    input_file_path = 'temp.txt'  # Adjust the path if necessary
    output_file_path = 'wordlist.js'  # Adjust the path if necessary
    
    words = read_words_from_file(input_file_path)
    categorized_words = categorize_words(words)
    limited_words = limit_words(categorized_words)
    js_content = format_as_js_set(limited_words)
    save_js_file(js_content, output_file_path)

if __name__ == '__main__':
    main()