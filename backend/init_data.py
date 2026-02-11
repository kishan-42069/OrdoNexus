"""
Mock Data Initialization Script
Creates mock_s3 directory structure and populates with dummy files for testing.
This simulates an S3 environment locally without AWS costs.
"""
import os
from pathlib import Path

# Base directory for mock S3 buckets
MOCK_S3_BASE = Path("mock_s3")

# Mock bucket configurations
MOCK_BUCKETS = {
    "finance_private": {
        "files": {
            "customer_data_dump.txt": "CONFIDENTIAL. Aadhaar: 4521 8956 2314, PAN: ABCDE1234F.\nCustomer: Rajesh Kumar\nEmail: rajesh.kumar@example.com\nGSTIN: 29ABCDE1234F1Z5\nAadhaar: 8765 4321 9876",
            "salary_records_2023.csv": "Employee,PAN,Email,Salary\nPriya Sharma,XYZAB5678C,priya@company.com,850000\nAmit Patel,LMNOP9012D,amit@company.com,920000",
        }
    },
    "public_web": {
        "files": {
            "website_contact_list.csv": "Name,Email\nJohn,john@example.com\nSarah,sarah@example.com\nMichael,michael@example.com",
            "blog_posts.txt": "Welcome to our blog! Contact us at info@example.com for more information.",
        }
    },
    "legacy_archive": {
        "files": {
            "2019_transactions.txt": "Transaction ID: 559922. Date: 2019-01-01.\nTransaction ID: 559923. Date: 2019-01-02.\nCustomer PAN: QWERT1234U\nEmail: old.customer@legacy.com",
            "backup_2018.log": "System backup completed. Aadhaar numbers processed: 3456 7890 1234, 9876 5432 1098\nPAN cards verified: ASDFG5678H, ZXCVB9012K",
        }
    }
}


def create_mock_s3_structure():
    """
    Creates the mock S3 directory structure and populates it with dummy files.
    This function is idempotent - safe to run multiple times.
    """
    print("🚀 Initializing Mock S3 Environment...")
    
    # Create base directory
    MOCK_S3_BASE.mkdir(exist_ok=True)
    print(f"✅ Created base directory: {MOCK_S3_BASE.absolute()}")
    
    # Create buckets and files
    for bucket_name, bucket_config in MOCK_BUCKETS.items():
        bucket_path = MOCK_S3_BASE / bucket_name
        bucket_path.mkdir(exist_ok=True)
        print(f"📁 Created bucket: {bucket_name}")
        
        # Create files in bucket
        for filename, content in bucket_config["files"].items():
            file_path = bucket_path / filename
            file_path.write_text(content, encoding="utf-8")
            print(f"   ✍️  Created file: {filename} ({len(content)} bytes)")
    
    print(f"\n✅ Mock S3 environment ready at: {MOCK_S3_BASE.absolute()}")
    print(f"📊 Total buckets: {len(MOCK_BUCKETS)}")
    total_files = sum(len(b["files"]) for b in MOCK_BUCKETS.values())
    print(f"📄 Total files: {total_files}")
    
    return MOCK_S3_BASE.absolute()


def get_mock_buckets():
    """Returns list of mock bucket names"""
    return list(MOCK_BUCKETS.keys())


if __name__ == "__main__":
    create_mock_s3_structure()
