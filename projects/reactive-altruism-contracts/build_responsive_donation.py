#!/usr/bin/env python3
"""
Simple build script for ResponsiveDonation contract
Run this to build just the responsive_donation contract
"""

import subprocess
import sys
from pathlib import Path

def main():
    # Change to the contracts directory
    contracts_dir = Path(__file__).parent
    print(f"Building from: {contracts_dir}")
    
    try:
        # Run the build command
        result = subprocess.run([
            sys.executable, "-m", "smart_contracts", "build", "responsive_donation"
        ], cwd=contracts_dir, capture_output=True, text=True)
        
        print("=== BUILD OUTPUT ===")
        print(result.stdout)
        if result.stderr:
            print("=== BUILD ERRORS ===")
            print(result.stderr)
            
        if result.returncode == 0:
            print("✅ Build successful!")
            print("\nNext steps:")
            print("1. Deploy: python -m smart_contracts deploy responsive_donation")
            print("2. Test: pytest tests/responsive_donation_client_test.py")
        else:
            print("❌ Build failed!")
            return 1
            
    except Exception as e:
        print(f"Error running build: {e}")
        return 1
        
    return 0

if __name__ == "__main__":
    sys.exit(main())
