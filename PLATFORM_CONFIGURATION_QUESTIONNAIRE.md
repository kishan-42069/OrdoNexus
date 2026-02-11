# Shadow Data Governance Platform - Configuration Questionnaire

**Project Name:** OrdoNexus - DPDP Compliance Platform  
**Document Version:** 1.0  
**Date:** 2026-02-03  
**Status:** 🔴 Pending Completion

---

## Instructions

This document captures all essential information required to implement the Shadow Data Governance platform for DPDP (Digital Personal Data Protection Act, 2023) compliance. Please fill out each section carefully. Sections marked with 🔴 are **CRITICAL** and must be completed before development begins.

**Legend:**
- 🔴 **CRITICAL** - Must have for MVP
- 🟡 **IMPORTANT** - Should have for production readiness
- 🟢 **OPTIONAL** - Nice to have for enhanced functionality

---

## 1. AWS Infrastructure & Access 🔴

### 1.1 AWS Account Information

| Field | Value | Notes |
|-------|-------|-------|
| **Primary AWS Account ID** | | 12-digit account number |
| **Primary AWS Region** | | e.g., `ap-south-1` (Mumbai) |
| **Additional Regions** | | Comma-separated list |
| **Multi-Account Setup?** | ☐ Yes ☐ No | Cross-account scanning required? |
| **Additional Account IDs** | | If multi-account |

### 1.2 Authentication Method

**Select your preferred authentication approach:**

- ☐ **IAM User Access Keys**
  - Access Key ID: `_______________________________`
  - Secret Access Key: `_______________________________` (store securely)
  - User ARN: `_______________________________`

- ☐ **IAM Role Assumption**
  - Role ARN: `_______________________________`
  - External ID (if required): `_______________________________`
  - Trust relationship configured: ☐ Yes ☐ No

- ☐ **AWS SSO / Identity Center**
  - SSO Start URL: `_______________________________`
  - SSO Region: `_______________________________`
  - Permission Set Name: `_______________________________`

### 1.3 IAM Permissions

**Do you have permission to create IAM roles/policies?**
- ☐ Yes - I can create the required least-privilege roles
- ☐ No - Please provide the exact IAM policy JSON needed
- ☐ Partial - I need approval from: `_______________________________`

**Existing IAM Role (if already created):**
- Role Name: `_______________________________`
- Role ARN: `_______________________________`

---

## 2. S3 Bucket Configuration 🔴

### 2.1 Target Buckets

**List all S3 buckets to be scanned:**

| Bucket Name | Region | Approx. Size (GB) | Approx. Object Count | Primary File Types |
|-------------|--------|-------------------|----------------------|--------------------|
| | | | | |
| | | | | |
| | | | | |
| | | | | |
| | | | | |

**Bucket Selection Method:**
- ☐ Scan specific buckets (listed above)
- ☐ Scan all buckets in account
- ☐ Scan buckets matching pattern: `_______________________________`
- ☐ Scan buckets with specific tags: `_______________________________`

### 2.2 File Format Distribution

**Estimated percentage of each file type:**

| Format | Percentage | Notes |
|--------|------------|-------|
| PDF | _____ % | Scanned vs text-based ratio: _____ |
| CSV | _____ % | |
| JSON | _____ % | |
| SQL Dumps | _____ % | |
| Other | _____ % | Specify: _________________ |

### 2.3 S3 Access Logs 🟡

**Are S3 server access logs enabled?**
- ☐ Yes - Required for staleness calculation
  - Log bucket name: `_______________________________`
  - Log prefix: `_______________________________`
- ☐ No - Will enable before scanning
- ☐ No - Will use alternative method: `_______________________________`

### 2.4 Bucket Access Control

**For each bucket, specify access level:**

| Bucket Name | Access Level | ACL Status | Bucket Policy |
|-------------|--------------|------------|---------------|
| | ☐ Public ☐ Private | ☐ Public ☐ Private | ☐ Public ☐ Private |
| | ☐ Public ☐ Private | ☐ Public ☐ Private | ☐ Public ☐ Private |
| | ☐ Public ☐ Private | ☐ Public ☐ Private | ☐ Public ☐ Private |

---

## 3. Compliance & Business Context 🔴

### 3.1 Organizational Information

| Field | Value |
|-------|-------|
| **Legal Company Name** | |
| **Industry Sector** | ☐ Financial ☐ Healthcare ☐ E-commerce ☐ Technology ☐ Other: _____ |
| **Company Size** | ☐ <50 ☐ 50-200 ☐ 200-1000 ☐ 1000+ employees |
| **Data Protection Officer (DPO) Name** | |
| **DPO Email** | |
| **DPO Phone** | |
| **Compliance Team Contact** | |
| **IT Security Contact** | |

### 3.2 Custom PII Types 🟡

**Beyond standard PII (Aadhaar, PAN, GSTIN, Email, Credit Cards), do you need to detect:**

| PII Type | Regex Pattern (if known) | Sensitivity Score (0-10) |
|----------|---------------------------|--------------------------|
| | | |
| | | |
| | | |

**Examples:** Passport numbers, Voter ID, Driving License, Employee IDs, Customer IDs, etc.

### 3.3 Sensitivity Score Customization 🟢

**Do you want to override default sensitivity scores?**

| PII Type | Default Score | Custom Score | Justification |
|----------|---------------|--------------|---------------|
| Aadhaar | 10 | | |
| PAN | 9 | | |
| GSTIN | 8 | | |
| Credit Card | 9 | | |
| Email | 3 | | |
| Internal Memos | 2 | | |

### 3.4 Risk Calculation Parameters

**Confirm or customize risk formula parameters:**

**Formula:** `Final Risk Score = Sensitivity × Exposure × Staleness`

| Parameter | Default Value | Custom Value | Notes |
|-----------|---------------|--------------|-------|
| **Exposure Multiplier (Public)** | 3× | | |
| **Exposure Multiplier (Private)** | 1× | | |
| **Staleness Threshold** | 3 years | | Data not accessed in X years |
| **Staleness Multiplier (Stale)** | 2× | | |
| **Staleness Multiplier (Recent)** | 1× | | |

**Risk Score Alert Thresholds:**
- 🟢 Low Risk: 0 - _____ (default: 0-30)
- 🟡 Medium Risk: _____ - _____ (default: 31-60)
- 🔴 High Risk: _____ - _____ (default: 61-100)
- ⚫ Critical Risk: _____ + (default: 100+)

---

## 4. Technical Infrastructure 🔴

### 4.1 Deployment Environment

**Where will the platform be deployed?**

- ☐ **AWS Cloud**
  - Service: ☐ EC2 ☐ ECS ☐ EKS ☐ Lambda ☐ Other: _____
  - Instance Type (if EC2): `_______________________________`
  - VPC ID: `_______________________________`
  - Subnet IDs: `_______________________________`
  - Security Group IDs: `_______________________________`

- ☐ **On-Premises**
  - Server OS: ☐ Linux (distro: _____) ☐ Windows Server
  - Available RAM: _____ GB
  - Available CPU Cores: _____
  - Available Storage: _____ GB/TB

- ☐ **Kubernetes Cluster**
  - Cluster Provider: ☐ EKS ☐ GKE ☐ AKS ☐ Self-hosted
  - Cluster Name: `_______________________________`
  - Namespace: `_______________________________`

- ☐ **Local Development (Initial)**
  - Development OS: ☐ Windows ☐ macOS ☐ Linux
  - Will migrate to: `_______________________________`

### 4.2 Database Configuration 🔴

**Select database for metadata storage:**

- ☐ **PostgreSQL**
  - Version: `_______________________________`
  - Host: `_______________________________`
  - Port: `_______________________________`
  - Database Name: `_______________________________`
  - Username: `_______________________________`
  - Password: `_______________________________` (store securely)
  - ☐ New database to be created ☐ Existing database

- ☐ **MySQL/MariaDB**
  - Version: `_______________________________`
  - Connection details: (same fields as PostgreSQL)

- ☐ **MongoDB**
  - Version: `_______________________________`
  - Connection String: `_______________________________`

- ☐ **Amazon DynamoDB**
  - Table Name: `_______________________________`
  - Region: `_______________________________`
  - Billing Mode: ☐ On-Demand ☐ Provisioned

- ☐ **Other:** `_______________________________`

### 4.3 Audit Log Storage 🟡

**Where should immutable audit logs be stored?**

- ☐ Same database as metadata
- ☐ Separate database (specify): `_______________________________`
- ☐ Amazon S3 bucket: `_______________________________`
- ☐ Amazon CloudWatch Logs (Log Group): `_______________________________`
- ☐ External SIEM (specify): `_______________________________`

**Audit Log Retention Period:**
- ☐ 1 year
- ☐ 3 years
- ☐ 7 years (recommended for compliance)
- ☐ Custom: _____ years

### 4.4 Network Configuration 🟡

**Network Access Requirements:**

| Configuration | Value |
|---------------|-------|
| **Outbound Internet Access Required?** | ☐ Yes ☐ No (for AWS API calls) |
| **Proxy Server** | ☐ Yes ☐ No |
| **Proxy URL (if yes)** | |
| **Proxy Authentication** | ☐ Required ☐ Not Required |
| **Firewall Rules to Configure** | |
| **IP Whitelisting Required** | ☐ Yes ☐ No |

---

## 5. Integration Requirements 🟡

### 5.1 Notification Systems

**Email Notifications:**
- ☐ **AWS SES**
  - SES Region: `_______________________________`
  - Verified Sender Email: `_______________________________`
  - Recipient Email(s): `_______________________________`

- ☐ **SMTP Server**
  - SMTP Host: `_______________________________`
  - SMTP Port: `_______________________________`
  - Username: `_______________________________`
  - Password: `_______________________________`
  - TLS/SSL: ☐ Yes ☐ No

- ☐ **No Email Integration (Initial)**

**Slack Integration:**
- ☐ Enable Slack notifications
  - Webhook URL: `_______________________________`
  - Channel: `_______________________________`

**Microsoft Teams Integration:**
- ☐ Enable Teams notifications
  - Webhook URL: `_______________________________`

### 5.2 Authentication & User Management 🟡

**How will users access the platform dashboard?**

- ☐ **AWS Cognito**
  - User Pool ID: `_______________________________`
  - App Client ID: `_______________________________`

- ☐ **OAuth 2.0 / SAML**
  - Provider: `_______________________________`
  - Client ID: `_______________________________`
  - Authorization URL: `_______________________________`

- ☐ **LDAP / Active Directory**
  - LDAP Server: `_______________________________`
  - Base DN: `_______________________________`

- ☐ **Basic Authentication (Dev Only)**
  - Admin Username: `_______________________________`
  - Admin Password: `_______________________________`

### 5.3 User/Team Roster (for Gamification) 🟡

**Upload or provide:**
- ☐ CSV file with user/team mappings (attach separately)
- ☐ Integration with HR system: `_______________________________`
- ☐ Manual entry (provide below)

**Sample Format:**

| User Email | Full Name | Team/Department | Role |
|------------|-----------|-----------------|------|
| | | | |
| | | | |

### 5.4 Existing Tool Integrations 🟢

**Do you use any of the following?**

| Tool Category | Tool Name | Integration Required? | API Key/Credentials |
|---------------|-----------|----------------------|---------------------|
| **Ticketing System** | ☐ Jira ☐ ServiceNow ☐ Other: _____ | ☐ Yes ☐ No | |
| **SIEM Platform** | ☐ Splunk ☐ ELK ☐ Other: _____ | ☐ Yes ☐ No | |
| **Data Catalog** | ☐ AWS Glue ☐ Collibra ☐ Other: _____ | ☐ Yes ☐ No | |
| **Compliance Tool** | ☐ OneTrust ☐ TrustArc ☐ Other: _____ | ☐ Yes ☐ No | |

---

## 6. Operational Parameters 🟡

### 6.1 Scanning Schedule

**How frequently should scans run?**
- ☐ On-demand only (manual trigger)
- ☐ Daily at _____ (time in IST/UTC)
- ☐ Weekly on _____ (day) at _____ (time)
- ☐ Monthly on day _____ at _____ (time)
- ☐ Custom cron expression: `_______________________________`

**Scan Type:**
- ☐ Full scan every time
- ☐ Incremental scan (only new/modified files since last scan)
- ☐ Hybrid (full scan monthly, incremental daily)

**Scan Time Windows (to avoid peak hours):**
- Preferred start time: _____
- Avoid scanning between: _____ and _____

### 6.2 Performance Constraints

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Maximum Scan Duration** | _____ hours | Timeout threshold |
| **Concurrent File Processing** | _____ files | Parallel processing limit |
| **API Rate Limit (S3 requests/sec)** | _____ | AWS throttling consideration |
| **Memory Limit per Worker** | _____ GB | |
| **Maximum File Size to Scan** | _____ MB | Skip files larger than this |

### 6.3 Data Retention 🟡

| Data Type | Retention Period | Storage Location |
|-----------|------------------|------------------|
| **Audit Logs** | _____ years | |
| **Scan Metadata** | _____ months | |
| **Risk Score History** | _____ months | |
| **Compliance Reports** | _____ years | |
| **Gamification Scores** | _____ months | |

---

## 7. Remediation Workflow 🟡

### 7.1 Approval Process

**Who approves simulated remediation actions?**

| Approval Level | Approver Role | Email | Approval Required For |
|----------------|---------------|-------|----------------------|
| Level 1 | | | Risk Score < 50 |
| Level 2 | | | Risk Score 50-80 |
| Level 3 | | | Risk Score > 80 |

**Approval Workflow:**
- ☐ Single approver (any Level 1 approver)
- ☐ Multi-stage (Level 1 → Level 2 → Level 3 based on risk)
- ☐ Parallel approval (any 2 approvers)
- ☐ Integration with existing change management: `_______________________________`

### 7.2 Allowed Remediation Actions

**Select permitted remediation types:**

- ☐ **Archive to Glacier**
  - Target Glacier Vault: `_______________________________`
  - Retrieval SLA: _____ hours/days

- ☐ **Delete Permanently**
  - Requires: ☐ Backup ☐ Approval ☐ Waiting period (_____ days)

- ☐ **Move to Secure Bucket**
  - Target bucket: `_______________________________`
  - Apply encryption: ☐ Yes ☐ No

- ☐ **Encrypt in Place**
  - KMS Key ARN: `_______________________________`

- ☐ **Tag for Manual Review**
  - Tag key: `_______________________________`
  - Tag value: `_______________________________`

- ☐ **Other:** `_______________________________`

**"What If" Analysis Parameters:**
- ☐ Simulate cost savings from deletion
- ☐ Simulate risk reduction from archival
- ☐ Simulate compliance improvement from encryption
- ☐ Show before/after risk scores

---

## 8. Reporting Requirements 🟡

### 8.1 Report Distribution

**Who should receive compliance reports?**

| Recipient Name | Email | Role | Report Frequency |
|----------------|-------|------|------------------|
| | | | ☐ Weekly ☐ Monthly ☐ Quarterly |
| | | | ☐ Weekly ☐ Monthly ☐ Quarterly |
| | | | ☐ Weekly ☐ Monthly ☐ Quarterly |

**Report Delivery Method:**
- ☐ Email attachment (PDF)
- ☐ Upload to S3 bucket: `_______________________________`
- ☐ Dashboard download only
- ☐ Integration with BI tool: `_______________________________`

### 8.2 Report Customization 🟢

**Branding:**
- Company Logo: ☐ Attached separately ☐ URL: `_______________________________`
- Brand Colors (Hex codes):
  - Primary: `_______________________________`
  - Secondary: `_______________________________`
- Report Header Text: `_______________________________`

**Additional Compliance Frameworks:**
- ☐ DPDP Act 2023 only
- ☐ Also include GDPR mapping
- ☐ Also include HIPAA mapping
- ☐ Also include ISO 27001 mapping
- ☐ Custom framework: `_______________________________`

### 8.3 DPDP Penalty Mapping

**Which DPDP Act sections are most critical for your organization?**

| Section | Description | Priority (High/Medium/Low) |
|---------|-------------|----------------------------|
| Section 33 | Penalty up to ₹250 crore for data breach | |
| Section 34 | Penalty for non-compliance with data protection | |
| Other | | |

**Internal Risk Classification:**
- ☐ Use default DPDP penalty brackets
- ☐ Custom internal risk categories: `_______________________________`

---

## 9. Development & Testing 🟢

### 9.1 Test Environment

**Separate AWS account/buckets for testing?**
- ☐ Yes
  - Test AWS Account ID: `_______________________________`
  - Test S3 Buckets: `_______________________________`
  - Test IAM Role ARN: `_______________________________`
- ☐ No - Use production with dry-run mode
- ☐ Local testing with mock data only

### 9.2 Sample Data

**Do you have sample/synthetic data for testing?**
- ☐ Yes - Sample bucket: `_______________________________`
- ☐ No - Please generate synthetic PII data
- ☐ Will provide later

**Test Cases:**
- ☐ Test with 100% PII files (worst case)
- ☐ Test with 0% PII files (clean data)
- ☐ Test with mixed content (realistic scenario)
- ☐ Test with large files (>100MB PDFs)
- ☐ Test with scanned PDFs (OCR required)

### 9.3 Environment Separation

| Environment | AWS Account | S3 Buckets | Database | Purpose |
|-------------|-------------|------------|----------|---------|
| **Development** | | | | Local testing |
| **Staging** | | | | Pre-production validation |
| **Production** | | | | Live scanning |

---

## 10. Budget & Technology Preferences 🟡

### 10.1 Cost Constraints

**Estimated monthly budget:**
- AWS Services (S3 API calls, data transfer): ₹ _____ / $ _____
- Database hosting: ₹ _____ / $ _____
- Compute resources: ₹ _____ / $ _____
- Third-party tools/licenses: ₹ _____ / $ _____
- **Total Budget:** ₹ _____ / $ _____

**Cost Optimization Preferences:**
- ☐ Minimize S3 API calls (use batch operations)
- ☐ Use spot instances for compute
- ☐ Prefer serverless (Lambda) over always-on servers
- ☐ Open-source tools only (no commercial licenses)

### 10.2 OCR Tool Selection

**For scanned PDF processing:**
- ☐ **Tesseract OCR** (Free, open-source)
  - Language packs needed: ☐ English ☐ Hindi ☐ Other: _____
- ☐ **AWS Textract** (Paid, high accuracy)
  - Budget for Textract: ₹ _____ / $ _____ per month
- ☐ **Google Cloud Vision API** (Paid)
- ☐ **Azure Computer Vision** (Paid)
- ☐ **Other:** `_______________________________`

### 10.3 Technology Stack Preferences

**Programming Language:**
- ☐ Python (recommended for data processing)
- ☐ Java
- ☐ Node.js
- ☐ Go
- ☐ No preference

**Web Framework (for dashboard):**
- ☐ Django (Python)
- ☐ Flask (Python)
- ☐ FastAPI (Python)
- ☐ Spring Boot (Java)
- ☐ Express.js (Node.js)
- ☐ No preference

**Frontend (for dashboard):**
- ☐ React
- ☐ Vue.js
- ☐ Angular
- ☐ Simple HTML/CSS/JS
- ☐ No dashboard needed (API only)

**Infrastructure as Code:**
- ☐ Terraform
- ☐ AWS CloudFormation
- ☐ AWS CDK
- ☐ Pulumi
- ☐ Manual setup (no IaC)

---

## 11. Additional Requirements 🟢

### 11.1 Special Considerations

**Any specific requirements not covered above?**

```
[Free-form text area]







```

### 11.2 Compliance Certifications

**Does your organization have existing certifications?**
- ☐ ISO 27001
- ☐ SOC 2
- ☐ PCI DSS
- ☐ HIPAA
- ☐ Other: `_______________________________`

**Should the platform support these compliance frameworks?**
- ☐ Yes - Map findings to these frameworks as well
- ☐ No - DPDP only

### 11.3 Data Sovereignty

**Data residency requirements:**
- ☐ All data must remain in India (use `ap-south-1` region only)
- ☐ Data can be stored in other AWS regions
- ☐ Specific regions allowed: `_______________________________`
- ☐ Specific regions prohibited: `_______________________________`

---

## 12. Timeline & Milestones 🟡

### 12.1 Project Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| **Configuration Complete** | | ☐ Not Started |
| **Development Environment Setup** | | ☐ Not Started |
| **Discovery Engine MVP** | | ☐ Not Started |
| **Classification Engine MVP** | | ☐ Not Started |
| **Risk Scoring Engine MVP** | | ☐ Not Started |
| **First Test Scan** | | ☐ Not Started |
| **Remediation Module** | | ☐ Not Started |
| **Gamification Service** | | ☐ Not Started |
| **Audit Trail Implementation** | | ☐ Not Started |
| **Report Generation** | | ☐ Not Started |
| **UAT (User Acceptance Testing)** | | ☐ Not Started |
| **Production Deployment** | | ☐ Not Started |

### 12.2 Go-Live Criteria

**What conditions must be met before production deployment?**

- ☐ Successful scan of test bucket with 100% accuracy
- ☐ Risk scoring validated by compliance team
- ☐ Audit trail verified for immutability
- ☐ Performance benchmarks met (scan X GB in Y hours)
- ☐ Security review completed
- ☐ User training completed
- ☐ Disaster recovery plan documented
- ☐ Other: `_______________________________`

---

## 13. Sign-Off

### 13.1 Document Completion

**Completed by:**
- Name: `_______________________________`
- Role: `_______________________________`
- Email: `_______________________________`
- Date: `_______________________________`
- Signature: `_______________________________`

### 13.2 Approval

**Approved by:**
- Name: `_______________________________`
- Role: `_______________________________`
- Email: `_______________________________`
- Date: `_______________________________`
- Signature: `_______________________________`

---

## 14. Attachments Checklist

**Please attach the following documents separately:**

- ☐ IAM policy JSON (if custom policies needed)
- ☐ User/team roster CSV (for gamification)
- ☐ Company logo (PNG/SVG, high resolution)
- ☐ Sample data files (for testing)
- ☐ Existing compliance reports (for reference)
- ☐ Network diagram (if complex setup)
- ☐ Data flow diagram (if available)
- ☐ Other: `_______________________________`

---

## Next Steps

Once this questionnaire is completed:

1. **Review** - Technical team will review all provided information
2. **Clarification** - Any missing/unclear items will be flagged
3. **Architecture Design** - System architecture will be designed based on your inputs
4. **Implementation Plan** - Detailed implementation plan will be created
5. **Development** - Coding begins with regular progress updates
6. **Testing** - Rigorous testing in your test environment
7. **Deployment** - Production deployment with your approval

**Estimated time to first working prototype:** 4-6 weeks after configuration approval

---

**Document End**

*For questions or clarifications, contact: [Your Technical Lead Email]*
