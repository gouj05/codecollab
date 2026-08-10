import subprocess
import tempfile
import os
import sys

def run_python(code: str):

    temp = tempfile.NamedTemporaryFile(
        suffix=".py",
        delete=False,
        mode="w",
        encoding="utf-8"
    )

    temp.write(code)
    temp.close()

    print("Executable:", sys.executable)
    print("File:", temp.name)

    try:
        process = subprocess.Popen(
            [sys.executable, temp.name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        print("Process started. PID:", process.pid)

        stdout, stderr = process.communicate(timeout=5)

        print("stdout:", stdout)
        print("stderr:", stderr)

        return {
            "stdout": stdout,
            "stderr": stderr,
            "exit_code": process.returncode
        }

    except subprocess.TimeoutExpired:
        process.kill()
        stdout, stderr = process.communicate()

        print("PROCESS TIMED OUT")
        print("stdout:", stdout)
        print("stderr:", stderr)

        return {
            "stdout": stdout,
            "stderr": "Execution timed out.",
            "exit_code": -1
        }

    finally:
        os.remove(temp.name)
        
def run_code(language: str, code: str):

    language = language.lower()

    if language == "python":
        return run_python(code)

    elif language == "javascript":
        return {
            "stdout": "",
            "stderr": "JavaScript execution coming soon.",
            "exit_code": -1
        }

    elif language == "cpp":
        return {
            "stdout": "",
            "stderr": "C++ execution coming soon.",
            "exit_code": -1
        }

    return {
        "stdout": "",
        "stderr": "Unsupported language.",
        "exit_code": -1
    }