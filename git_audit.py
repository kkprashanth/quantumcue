import subprocess
import os

def audit_commit(commit_hash):
    print(f"Auditing commit: {commit_hash}")
    
    # Get file list
    try:
        result = subprocess.run(['git', 'ls-tree', '-r', commit_hash, '--name-only'], 
                               capture_output=True, text=True, check=True)
        files = result.stdout.splitlines()
    except Exception as e:
        print(f"Error getting file list: {e}")
        return

    print(f"Total files in commit: {len(files)}")
    
    # Check for .env files
    env_files = [f for f in files if '.env' in f.lower()]
    if env_files:
        print("\n[!] WARNING: Found .env files tracked in history:")
        for f in env_files:
            print(f"  - {f}")
    else:
        print("\n[+] No .env files found in the file list.")

    # Check for hardcoded secrets in certain file types
    suspicious_patterns = ['key', 'secret', 'password', 'token']
    file_extensions = ('.py', '.js', '.ts', '.tsx', '.yml', '.yaml', '.sh')
    
    print("\nScanning files for hardcoded secrets...")
    for f in files:
        if f.endswith(file_extensions):
            try:
                content = subprocess.run(['git', 'show', f"{commit_hash}:{f}"], 
                                       capture_output=True, text=True, check=True).stdout
                for line_num, line in enumerate(content.splitlines(), 1):
                    # Simple heuristic: searching for key=VALUE where VALUE is not a variable or env lookup
                    if any(p in line.lower() for p in suspicious_patterns) and '=' in line:
                        if 'getenv' not in line and 'os.environ' not in line and 'None' not in line:
                            # Print matching lines that look like hardcoded values
                            print(f"Found potential secret in {f}:{line_num}")
                            print(f"  > {line.strip()[:100]}")
            except Exception:
                pass

if __name__ == "__main__":
    # Audit the "Initial commit"
    audit_commit("20c5958")
    
    # Audit the current HEAD for comparison
    print("\n" + "="*50 + "\n")
    audit_commit("HEAD")
