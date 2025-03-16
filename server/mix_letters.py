#!/usr/bin/env python3
import random
import re
import sys

def mix_up_string(input_string):
    """
    Shuffles the characters in a given string randomly after removing spaces and non-letter characters.

    Parameters:
        input_string (str): The string to shuffle.

    Returns:
        str: The shuffled string containing only letters.
    """
    input_string = re.sub(r'[^a-zA-Z]', '', input_string)  # Remove non-letter characters
    
    if len(input_string) <= 1:
        return input_string  # No need to shuffle if empty or single character

    char_list = list(input_string)
    random.shuffle(char_list)
    return ''.join(char_list)

# When run as a script, read from stdin or command line argument
if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_string = sys.argv[1]
    else:
        input_string = sys.stdin.read().strip()
    
    if not input_string:
        print("Error: Please provide a non-empty string with at least one letter.", file=sys.stderr)
        sys.exit(1)
    else:
        print(mix_up_string(input_string))
