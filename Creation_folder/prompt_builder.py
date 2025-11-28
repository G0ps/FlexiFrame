import os

def concatenate_files(file1_name: str, file2_name: str) -> str:
    """
    Reads the content of two specified text files in the current directory,
    concatenates their contents, and returns the combined string.

    The content of file1 is placed before the content of file2, separated by
    a newline for clarity.

    Args:
        file1_name: The name of the first text file (e.g., 'data1.txt').
        file2_name: The name of the second text file (e.g., 'data2.txt').

    Returns:
        A string containing the concatenated content of both files, or an
        error message if a file is not found.
    """
    current_dir = os.getcwd()
    file1_path = os.path.join(current_dir, file1_name)
    file2_path = os.path.join(current_dir, file2_name)
    
    content1 = ""
    content2 = ""
    
    # 1. Read the first file
    try:
        with open(file1_path, 'r', encoding='utf-8') as f:
            content1 = f.read()
    except FileNotFoundError:
        return f"Error: The file '{file1_name}' was not found in the directory: {current_dir}"
    except Exception as e:
        return f"Error reading '{file1_name}': {e}"
    
    # 2. Read the second file
    try:
        with open(file2_path, 'r', encoding='utf-8') as f:
            content2 = f.read()
    except FileNotFoundError:
        return f"Error: The file '{file2_name}' was not found in the directory: {current_dir}"
    except Exception as e:
        return f"Error reading '{file2_name}': {e}"

    # 3. Concatenate and return
    # A newline is added between contents to clearly separate the data from the two files.
    return content1 + "\n\n" + content2