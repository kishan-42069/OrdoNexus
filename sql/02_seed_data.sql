-- ═══════════════════════════════════════════════════════════════════
--  OrdoNexus v2 — Seed / Demo Data
--  Realistic large-scale dataset for demo & development
--
--  Contains:
--    • 5 scan_runs
--    • 60 file_metadata rows (varied risk, buckets, PII combos)
--    • 120+ audit_log entries
--    • 8 user_scores
--    • 90 risk_snapshots (30 days × 3 buckets)
--    • 5 policy_checks per DPDP article (25 total)
--    • 6 data_owners
--
--  Run AFTER 01_ddl_schema.sql
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────
--  SCAN RUNS
-- ─────────────────────────────────────────
INSERT INTO scan_runs (
    id, started_at, completed_at, triggered_by, triggered_user_id, status, environment,
    files_discovered, files_scanned, files_new, files_updated, files_skipped,
    high_risk_count, medium_risk_count, low_risk_count, critical_risk_count,
    total_pii_instances, total_liability_inr, duration_ms,
    scan_config
) VALUES
(1, NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days' + INTERVAL '12 seconds',
    'manual', 'user_arjun', 'COMPLETED', 'production',
    60, 60, 60, 0, 0, 8, 12, 40, 3, 287, 1200000000000, 12340,
    '{"base_path": "mock_s3", "pii_patterns": ["aadhaar","pan","gstin","email","phone"]}'::jsonb),

(2, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '11 seconds',
    'scheduled', 'system', 'COMPLETED', 'production',
    60, 60, 0, 15, 0, 8, 12, 40, 3, 301, 1200000000000, 11200,
    '{"base_path": "mock_s3", "pii_patterns": ["aadhaar","pan","gstin","email","phone"]}'::jsonb),

(3, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '10 seconds',
    'api', 'user_priya', 'COMPLETED', 'production',
    62, 62, 2, 10, 0, 9, 13, 40, 3, 315, 1200000000000, 10800,
    '{"base_path": "mock_s3", "pii_patterns": ["aadhaar","pan","gstin","email","phone","passport"]}'::jsonb),

(4, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '9 seconds',
    'manual', 'user_arjun', 'COMPLETED', 'production',
    62, 62, 0, 8, 0, 7, 11, 44, 2, 298, 1100000000000, 9500,
    '{"base_path": "mock_s3", "pii_patterns": ["aadhaar","pan","gstin","email","phone","passport"]}'::jsonb),

(5, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '8 seconds',
    'manual', 'user_arjun', 'COMPLETED', 'production',
    62, 62, 0, 5, 0, 7, 11, 44, 2, 301, 1100000000000, 8900,
    '{"base_path": "mock_s3", "pii_patterns": ["aadhaar","pan","gstin","email","phone","passport"]}'::jsonb)
ON CONFLICT DO NOTHING;

SELECT setval('scan_runs_id_seq', 5, true);


-- ─────────────────────────────────────────
--  DATA OWNERS
-- ─────────────────────────────────────────
INSERT INTO data_owners (bucket_name, environment, owner_team, owner_email, slack_channel, classification, retention_days) VALUES
('public_web',        'production', 'Marketing',          'marketing@acmecorp.in',       '#marketing-ops',     'PUBLIC',       90),
('finance_private',   'production', 'Finance',            'cfo-office@acmecorp.in',      '#finance-secure',    'RESTRICTED',   365),
('legacy_archive',    'production', 'Infrastructure',     'infra@acmecorp.in',           '#infra-team',        'CONFIDENTIAL', 730),
('hr_data',           'production', 'Human Resources',    'hr-ops@acmecorp.in',          '#hr-private',        'RESTRICTED',   1095),
('customer_db_dumps', 'production', 'Engineering',        'data-eng@acmecorp.in',        '#data-eng',          'RESTRICTED',   180),
('log_exports',       'production', 'Security',           'soc@acmecorp.in',             '#security-ops',      'CONFIDENTIAL', 90)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────
--  USER SCORES
-- ─────────────────────────────────────────
INSERT INTO user_scores (
    user_id, display_name, email, team, role,
    responsibility_score, scans_performed, high_risk_files_remediated,
    reports_generated, alerts_acknowledged, last_active_at
) VALUES
('user_arjun',    'Arjun Sharma',        'arjun@acmecorp.in',    'Engineering',    'admin',   72, 12, 8,  5, 34, NOW() - INTERVAL '2 hours'),
('user_priya',    'Priya Mehta',         'priya@acmecorp.in',    'Compliance',     'analyst', 88, 20, 15, 9, 61, NOW() - INTERVAL '1 day'),
('user_rohan',    'Rohan Desai',         'rohan@acmecorp.in',    'Finance',        'viewer',  45,  3,  1, 1,  8, NOW() - INTERVAL '5 days'),
('user_kavya',    'Kavya Nair',          'kavya@acmecorp.in',    'Security',       'auditor', 91, 30, 22, 14, 89, NOW() - INTERVAL '3 hours'),
('user_vikram',   'Vikram Bose',         'vikram@acmecorp.in',   'Infrastructure', 'analyst', 61,  8,  4, 3,  19, NOW() - INTERVAL '2 days'),
('user_ananya',   'Ananya Krishnan',     'ananya@acmecorp.in',   'Compliance',     'analyst', 79, 15, 11, 7,  42, NOW() - INTERVAL '6 hours'),
('user_siddharth','Siddharth Iyer',      'sid@acmecorp.in',      'Legal',          'viewer',  55,  2,  0, 2,  5,  NOW() - INTERVAL '7 days'),
('system',        'System Automations',  'noreply@acmecorp.in',  'Infra',          'admin',   100, 50,  0, 25, 0, NOW())
ON CONFLICT (user_id) DO NOTHING;


-- ─────────────────────────────────────────
--  FILE METADATA  (60 rows)
--  Triggers auto-set: risk_level, financial_liability
-- ─────────────────────────────────────────
INSERT INTO file_metadata (
    file_path, file_name, bucket_name, data_source, environment, owner_team,
    file_size_bytes, file_extension, mime_type,
    aadhaar_count, pan_count, gstin_count, email_count, phone_count, passport_count, dob_count,
    sensitivity_score, exposure_multiplier, staleness_multiplier, final_risk_score,
    file_last_modified, first_seen_at, last_scanned_at, scan_batch_id, remediation_status
) VALUES

-- ── finance_private (most sensitive) ─────────────────────────────
('mock_s3/finance_private/salary_records_2023.csv',    'salary_records_2023.csv',   'finance_private','MOCK','production','Finance',  245760,'.csv','text/csv',       4,3,2,12,8,0,6, 9.5,1.5,2.0,28.50, NOW()-INTERVAL '400 days', NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/customer_data_dump.txt',     'customer_data_dump.txt',    'finance_private','MOCK','production','Finance',  102400,'.txt','text/plain',     6,4,1,18,5,0,0, 9.8,1.5,2.5,36.75, NOW()-INTERVAL '800 days', NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/payroll_q1_2024.xlsx',       'payroll_q1_2024.xlsx',      'finance_private','MOCK','production','Finance',  389120,'.xlsx','application/vnd.ms-excel', 8,6,0,24,12,0,8, 10.0,1.5,1.5,22.50, NOW()-INTERVAL '60 days',  NOW()-INTERVAL '10 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/audit_trail_2022.pdf',       'audit_trail_2022.pdf',      'finance_private','MOCK','production','Finance',  512000,'.pdf','application/pdf',3,2,4,8,2,0,0, 8.0,1.5,2.0,24.00, NOW()-INTERVAL '600 days', NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/vendor_contracts_2021.docx', 'vendor_contracts_2021.docx','finance_private','MOCK','production','Finance',  204800,'.docx','application/msword', 2,1,5,6,1,0,0, 7.2,1.5,2.5,27.00, NOW()-INTERVAL '1100 days',NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/tax_filings_fy23.zip',       'tax_filings_fy23.zip',      'finance_private','MOCK','production','Finance',  819200,'.zip','application/zip',5,8,3,15,4,0,0, 9.6,1.5,1.5,21.60, NOW()-INTERVAL '200 days', NOW()-INTERVAL '10 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/expense_reports_mar24.csv',  'expense_reports_mar24.csv', 'finance_private','MOCK','production','Finance',   81920,'.csv','text/csv',       1,2,1,10,3,0,2, 5.5,1.5,1.0, 8.25, NOW()-INTERVAL '10 days',  NOW()-INTERVAL '3 days',  NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/bank_recon_jan24.xlsx',      'bank_recon_jan24.xlsx',     'finance_private','MOCK','production','Finance',  163840,'.xlsx','application/vnd.ms-excel', 2,4,2,8,2,0,0, 7.4,1.5,1.5,16.65, NOW()-INTERVAL '90 days',  NOW()-INTERVAL '10 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/investor_list_2023.csv',     'investor_list_2023.csv',    'finance_private','MOCK','production','Finance',  102400,'.csv','text/csv',       3,5,0,20,6,2,0, 9.0,1.5,2.0,27.00, NOW()-INTERVAL '450 days', NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/finance_private/gst_returns_q3_2022.xml',    'gst_returns_q3_2022.xml',   'finance_private','MOCK','production','Finance',   40960,'.xml','application/xml',0,2,8,4,0,0,0, 6.8,1.5,2.0,20.40, NOW()-INTERVAL '550 days', NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),

-- ── public_web (highest exposure multiplier) ──────────────────────
('mock_s3/public_web/contact_list.csv',                'contact_list.csv',          'public_web','MOCK','production','Marketing',  61440,'.csv','text/csv',         0,0,0,45,22,0,0, 3.0,3.0,1.0, 9.00, NOW()-INTERVAL '30 days',  NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/newsletter_subs_2023.csv',        'newsletter_subs_2023.csv',  'public_web','MOCK','production','Marketing',  92160,'.csv','text/csv',         0,0,0,380,150,0,0,3.0,3.0,2.0,18.00, NOW()-INTERVAL '500 days', NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/blog_posts.txt',                  'blog_posts.txt',            'public_web','MOCK','production','Marketing',  20480,'.txt','text/plain',        0,0,0,3,0,0,0,  0.6,3.0,1.0, 1.80, NOW()-INTERVAL '15 days',  NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/website_contact_list.csv',        'website_contact_list.csv',  'public_web','MOCK','production','Marketing',  30720,'.csv','text/csv',         1,0,0,25,8,0,0,  5.0,3.0,1.5,22.50, NOW()-INTERVAL '200 days', NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/lead_gen_form_dump_2022.csv',     'lead_gen_form_dump_2022.csv','public_web','MOCK','production','Marketing', 153600,'.csv','text/csv',         2,1,0,620,310,0,0,7.8,3.0,2.5,58.50, NOW()-INTERVAL '730 days', NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/event_registrations_2023.xlsx',   'event_registrations_2023.xlsx','public_web','MOCK','production','Marketing',204800,'.xlsx','application/vnd.ms-excel',3,0,0,180,90,0,12,7.2,3.0,2.0,43.20, NOW()-INTERVAL '400 days',NOW()-INTERVAL '10 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/webinar_attendees_q2.csv',        'webinar_attendees_q2.csv',  'public_web','MOCK','production','Marketing',  81920,'.csv','text/csv',         0,0,0,95,48,0,0,  3.0,3.0,1.5, 9.00, NOW()-INTERVAL '180 days', NOW()-INTERVAL '10 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/press_release_mar24.pdf',         'press_release_mar24.pdf',   'public_web','MOCK','production','Marketing',  40960,'.pdf','application/pdf',  0,0,0,2,0,0,0,  0.6,3.0,1.0, 1.80, NOW()-INTERVAL '5 days',   NOW()-INTERVAL '3 days',  NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/api_error_logs_public.txt',       'api_error_logs_public.txt', 'public_web','MOCK','production','Marketing',  20480,'.txt','text/plain',        0,0,0,12,3,0,0,  1.2,3.0,1.0, 3.60, NOW()-INTERVAL '20 days',  NOW()-INTERVAL '10 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/public_web/referral_program_data.csv',       'referral_program_data.csv', 'public_web','MOCK','production','Marketing',  71680,'.csv','text/csv',         0,0,0,55,20,0,0,  3.0,3.0,1.5, 9.00, NOW()-INTERVAL '150 days', NOW()-INTERVAL '10 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),

-- ── legacy_archive (staleness risk) ──────────────────────────────
('mock_s3/legacy_archive/2019_transactions.txt',       '2019_transactions.txt',     'legacy_archive','MOCK','production','Infrastructure',409600,'.txt','text/plain',  3,5,2,45,10,0,0, 9.2,2.0,2.5,46.00, NOW()-INTERVAL '1800 days',NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/customer_dump_2018.csv',      'customer_dump_2018.csv',    'legacy_archive','MOCK','production','Infrastructure',819200,'.csv','text/csv',    8,6,2,220,85,3,0,10.0,2.0,2.5,50.00, NOW()-INTERVAL '2190 days',NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/old_crm_export_2017.csv',     'old_crm_export_2017.csv',   'legacy_archive','MOCK','production','Infrastructure',1024000,'.csv','text/csv',  6,4,1,310,120,5,18,9.8,2.0,2.5,49.00, NOW()-INTERVAL '2555 days',NOW()-INTERVAL '29 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/kyc_backup_2020.zip',         'kyc_backup_2020.zip',       'legacy_archive','MOCK','production','Infrastructure',2048000,'.zip','application/zip',12,10,0,60,25,8,15,10.0,2.0,2.0,40.00, NOW()-INTERVAL '1460 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/support_tickets_2019.json',   'support_tickets_2019.json', 'legacy_archive','MOCK','production','Infrastructure',307200,'.json','application/json',2,1,0,88,30,0,0,5.6,2.0,2.5,28.00, NOW()-INTERVAL '1800 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/employee_records_2016.xlsx',  'employee_records_2016.xlsx','legacy_archive','MOCK','production','Infrastructure',512000,'.xlsx','application/vnd.ms-excel',15,12,0,45,30,5,30,10.0,2.0,2.5,50.00, NOW()-INTERVAL '2920 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/old_api_logs_2018.log',       'old_api_logs_2018.log',     'legacy_archive','MOCK','production','Infrastructure',204800,'.log','text/plain',  0,0,0,180,45,0,0,3.0,2.0,2.5,15.00, NOW()-INTERVAL '2190 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/db_snapshot_q4_2019.sql',     'db_snapshot_q4_2019.sql',   'legacy_archive','MOCK','production','Infrastructure',4096000,'.sql','text/plain', 20,18,5,350,140,0,25,10.0,2.0,2.5,50.00, NOW()-INTERVAL '1620 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/mobile_app_users_2020.csv',   'mobile_app_users_2020.csv', 'legacy_archive','MOCK','production','Infrastructure',716800,'.csv','text/csv',    5,3,0,420,210,0,12,9.0,2.0,2.0,36.00, NOW()-INTERVAL '1460 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/legacy_archive/log_backup_2021.tar.gz',      'log_backup_2021.tar.gz',    'legacy_archive','MOCK','production','Infrastructure',8192000,'.gz','application/gzip',0,0,0,22,8,0,0,0.6,2.0,2.0,2.40, NOW()-INTERVAL '1000 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),

-- ── hr_data ───────────────────────────────────────────────────────
('mock_s3/hr_data/employee_onboarding_2024.xlsx',      'employee_onboarding_2024.xlsx','hr_data','MOCK','production','Human Resources',204800,'.xlsx','application/vnd.ms-excel',5,5,0,28,15,2,10,9.5,1.5,1.0,14.25, NOW()-INTERVAL '45 days', NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/hr_data/appraisal_scores_fy24.csv',          'appraisal_scores_fy24.csv', 'hr_data','MOCK','production','Human Resources', 81920,'.csv','text/csv',           3,3,0,48,20,0,0, 8.5,1.5,1.0,12.75, NOW()-INTERVAL '30 days', NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/hr_data/exit_interviews_2023.docx',          'exit_interviews_2023.docx', 'hr_data','MOCK','production','Human Resources', 61440,'.docx','application/msword',2,1,0,15,6,0,0, 5.5,1.5,2.0,16.50, NOW()-INTERVAL '400 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/hr_data/background_checks_batch1.pdf',       'background_checks_batch1.pdf','hr_data','MOCK','production','Human Resources',102400,'.pdf','application/pdf',  8,6,0,12,8,4,5,  9.8,1.5,1.5,22.05, NOW()-INTERVAL '180 days',NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/hr_data/attendance_log_q1_2024.xlsx',        'attendance_log_q1_2024.xlsx','hr_data','MOCK','production','Human Resources', 40960,'.xlsx','application/vnd.ms-excel',0,0,0,48,22,0,0,3.0,1.5,1.0,4.50, NOW()-INTERVAL '60 days', NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/hr_data/health_insurance_claims.csv',        'health_insurance_claims.csv','hr_data','MOCK','production','Human Resources',163840,'.csv','text/csv',          4,3,0,22,10,0,8,  8.5,1.5,1.5,19.13, NOW()-INTERVAL '200 days',NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),

-- ── customer_db_dumps ─────────────────────────────────────────────
('mock_s3/customer_db_dumps/prod_users_export_jan24.csv','prod_users_export_jan24.csv','customer_db_dumps','MOCK','production','Engineering',2097152,'.csv','text/csv',10,8,0,1500,650,0,18,10.0,2.0,1.5,30.00, NOW()-INTERVAL '90 days', NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/customer_db_dumps/orders_dump_q4_2023.sql',   'orders_dump_q4_2023.sql',  'customer_db_dumps','MOCK','production','Engineering',5242880,'.sql','text/plain',   6,4,3,800,350,0,0, 9.2,2.0,2.0,36.80, NOW()-INTERVAL '200 days',NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/customer_db_dumps/kyc_verified_2024.csv',     'kyc_verified_2024.csv',    'customer_db_dumps','MOCK','production','Engineering',1048576,'.csv','text/csv',    15,12,0,280,120,8,20,10.0,2.0,1.5,30.00, NOW()-INTERVAL '60 days', NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/customer_db_dumps/failed_txn_log_mar24.json', 'failed_txn_log_mar24.json','customer_db_dumps','MOCK','production','Engineering', 204800,'.json','application/json',0,2,0,320,160,0,0,4.6,2.0,1.0,9.20, NOW()-INTERVAL '20 days', NOW()-INTERVAL '3 days', NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/customer_db_dumps/chargeback_data_2023.csv',  'chargeback_data_2023.csv', 'customer_db_dumps','MOCK','production','Engineering', 409600,'.csv','text/csv',    3,5,1,180,80,0,0, 8.0,2.0,2.0,32.00, NOW()-INTERVAL '450 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/customer_db_dumps/premium_users_segment.csv', 'premium_users_segment.csv','customer_db_dumps','MOCK','production','Engineering', 307200,'.csv','text/csv',    4,3,0,420,190,2,0, 9.0,2.0,1.5,27.00, NOW()-INTERVAL '120 days',NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),

-- ── log_exports ───────────────────────────────────────────────────
('mock_s3/log_exports/app_server_logs_feb24.log',      'app_server_logs_feb24.log', 'log_exports','MOCK','production','Security',1048576,'.log','text/plain',           0,0,0,85,30,0,0, 3.0,1.5,1.0,4.50, NOW()-INTERVAL '45 days', NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/log_exports/auth_events_jan24.jsonl',        'auth_events_jan24.jsonl',   'log_exports','MOCK','production','Security', 819200,'.jsonl','application/jsonlines',0,0,0,420,180,0,0,3.0,1.5,1.5,6.75, NOW()-INTERVAL '90 days', NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/log_exports/pii_scan_debug_2022.txt',        'pii_scan_debug_2022.txt',   'log_exports','MOCK','production','Security', 102400,'.txt','text/plain',           2,1,0,28,0,0,0, 5.6,1.5,2.0,16.80, NOW()-INTERVAL '600 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/log_exports/waf_events_q1_2024.csv',         'waf_events_q1_2024.csv',    'log_exports','MOCK','production','Security', 204800,'.csv','text/csv',             0,0,0,45,20,0,0, 3.0,1.5,1.0,4.50, NOW()-INTERVAL '30 days', NOW()-INTERVAL '10 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),
('mock_s3/log_exports/intrusion_alerts_2023.json',     'intrusion_alerts_2023.json','log_exports','MOCK','production','Security', 153600,'.json','application/json',     0,0,0,15,8,0,0, 1.2,1.5,2.0,3.60, NOW()-INTERVAL '500 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '2 hours', 5,'ACTIVE'),

-- ── Already-remediated files (for realism) ────────────────────────
('mock_s3/finance_private/old_salary_2020.csv',        'old_salary_2020.csv',       'finance_private','MOCK','production','Finance',  204800,'.csv','text/csv',        6,5,2,22,10,0,5, 9.5,1.5,2.5,35.63, NOW()-INTERVAL '1460 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '3 days',  4,'REMEDIATED'),
('mock_s3/legacy_archive/crm_dump_2016.csv',           'crm_dump_2016.csv',         'legacy_archive','MOCK','production','Infrastructure',2097152,'.csv','text/csv',   10,8,3,520,200,6,20,10.0,2.0,2.5,50.00, NOW()-INTERVAL '2920 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '10 days', 3,'REMEDIATED'),
('mock_s3/public_web/old_form_data_2019.csv',          'old_form_data_2019.csv',    'public_web','MOCK','production','Marketing',  409600,'.csv','text/csv',            4,2,0,850,320,0,0,8.2,3.0,2.5,61.50, NOW()-INTERVAL '1800 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '20 days', 2,'REMEDIATED'),
('mock_s3/hr_data/terminated_employees_2021.xlsx',     'terminated_employees_2021.xlsx','hr_data','MOCK','production','Human Resources',163840,'.xlsx','application/vnd.ms-excel',8,6,0,30,12,2,8,9.8,1.5,2.0,29.40, NOW()-INTERVAL '1100 days',NOW()-INTERVAL '29 days',NOW()-INTERVAL '15 days', 3,'REMEDIATED')
ON CONFLICT (file_path) DO NOTHING;


-- ─────────────────────────────────────────
--  AUDIT LOG  (120+ entries)
-- ─────────────────────────────────────────

-- Seed audit entries for scan runs
INSERT INTO audit_log (timestamp, action_type, user_id, user_ip, file_id, scan_run_id, severity, details) VALUES

-- Scan 1 (29 days ago)
(NOW()-INTERVAL '29 days',       'SCAN_STARTED',     'user_arjun', '10.0.1.42',  NULL, 1, 'INFO',
    '{"scan_run_id": 1, "triggered_by": "manual", "base_path": "mock_s3"}'::jsonb),
(NOW()-INTERVAL '29 days' + INTERVAL '12s', 'SCAN_COMPLETED', 'system', NULL, NULL, 1, 'INFO',
    '{"scan_run_id": 1, "files_scanned": 60, "high_risk_files": 8, "medium_risk_files": 12, "total_pii": 287, "duration_ms": 12340}'::jsonb),
(NOW()-INTERVAL '29 days' + INTERVAL '13s', 'ALERT_GENERATED', 'system', NULL, NULL, 1, 'WARN',
    '{"reason": "High-risk files detected", "high_risk_count": 8, "total_liability_crore": 5875}'::jsonb),

-- Scan 2 (20 days ago)
(NOW()-INTERVAL '20 days',       'SCAN_STARTED',     'system',     NULL,         NULL, 2, 'INFO',
    '{"scan_run_id": 2, "triggered_by": "scheduled"}'::jsonb),
(NOW()-INTERVAL '20 days' + INTERVAL '11s', 'SCAN_COMPLETED', 'system', NULL, NULL, 2, 'INFO',
    '{"scan_run_id": 2, "files_scanned": 60, "high_risk_files": 8, "files_updated": 15}'::jsonb),

-- Report generation
(NOW()-INTERVAL '18 days',       'REPORT_GENERATED', 'user_priya', '10.0.1.55',  NULL, NULL, 'INFO',
    '{"report_type": "DPDP_COMPLIANCE", "format": "PDF", "pages": 12, "generated_by": "user_priya"}'::jsonb),
(NOW()-INTERVAL '15 days',       'REPORT_GENERATED', 'user_kavya', '10.0.1.78',  NULL, NULL, 'INFO',
    '{"report_type": "EXECUTIVE_SUMMARY", "format": "PDF", "pages": 6}'::jsonb),

-- Scan 3 (10 days ago)
(NOW()-INTERVAL '10 days',       'SCAN_STARTED',     'user_priya', '10.0.1.55',  NULL, 3, 'INFO',
    '{"scan_run_id": 3, "triggered_by": "api"}'::jsonb),
(NOW()-INTERVAL '10 days' + INTERVAL '10s', 'SCAN_COMPLETED', 'system', NULL, NULL, 3, 'INFO',
    '{"scan_run_id": 3, "files_scanned": 62, "high_risk_files": 9, "files_new": 2}'::jsonb),

-- Remediation simulations
(NOW()-INTERVAL '9 days',        'SIMULATE_REMEDIATION','user_arjun','10.0.1.42', 2,  NULL, 'INFO',
    '{"file_name": "customer_data_dump.txt", "risk_reduction": 36.75, "liability_saved_crore": 3150, "recommendation": "Archive to cold storage"}'::jsonb),
(NOW()-INTERVAL '9 days',        'SIMULATE_REMEDIATION','user_arjun','10.0.1.42', 22, NULL, 'INFO',
    '{"file_name": "old_crm_export_2017.csv", "risk_reduction": 49.0, "liability_saved_crore": 3150, "recommendation": "Delete permanently"}'::jsonb),
(NOW()-INTERVAL '8 days',        'REMEDIATION_EXECUTED','user_arjun','10.0.1.42', 57, NULL, 'WARN',
    '{"file_name": "old_salary_2020.csv", "action": "ARCHIVE", "executed_by": "user_arjun", "approved_by": "user_kavya"}'::jsonb),
(NOW()-INTERVAL '8 days',        'REMEDIATION_EXECUTED','user_arjun','10.0.1.42', 58, NULL, 'WARN',
    '{"file_name": "crm_dump_2016.csv", "action": "DELETE", "executed_by": "user_arjun", "approved_by": "user_kavya"}'::jsonb),
(NOW()-INTERVAL '7 days',        'REMEDIATION_EXECUTED','user_priya','10.0.1.55', 59, NULL, 'WARN',
    '{"file_name": "old_form_data_2019.csv", "action": "DELETE", "executed_by": "user_priya"}'::jsonb),
(NOW()-INTERVAL '7 days',        'REMEDIATION_EXECUTED','user_ananya','10.0.2.10',60, NULL, 'WARN',
    '{"file_name": "terminated_employees_2021.xlsx", "action": "ARCHIVE", "executed_by": "user_ananya"}'::jsonb),

-- Policy checks
(NOW()-INTERVAL '6 days',        'POLICY_CHECK',     'user_kavya', '10.0.1.78',  NULL,NULL, 'INFO',
    '{"policy_id": "POL-003", "article": "Article 6", "result": "FAILING", "checks_failed": 3}'::jsonb),
(NOW()-INTERVAL '5 days',        'POLICY_CHECK',     'user_kavya', '10.0.1.78',  NULL,NULL, 'INFO',
    '{"policy_id": "POL-001", "article": "Article 4", "result": "PARTIAL", "checks_failed": 2}'::jsonb),

-- Scan 4 (3 days ago)
(NOW()-INTERVAL '3 days',        'SCAN_STARTED',     'user_arjun', '10.0.1.42',  NULL, 4, 'INFO',
    '{"scan_run_id": 4, "triggered_by": "manual"}'::jsonb),
(NOW()-INTERVAL '3 days' + INTERVAL '9s', 'SCAN_COMPLETED', 'system', NULL, NULL, 4, 'INFO',
    '{"scan_run_id": 4, "files_scanned": 62, "high_risk_files": 7, "total_pii": 298}'::jsonb),

-- Alerts acknowledged
(NOW()-INTERVAL '2 days',        'ALERT_ACKNOWLEDGED','user_vikram','10.0.1.90',  15, NULL, 'INFO',
    '{"file_name": "lead_gen_form_dump_2022.csv", "alert_type": "CRITICAL", "acknowledged_by": "user_vikram"}'::jsonb),
(NOW()-INTERVAL '2 days',        'ALERT_ACKNOWLEDGED','user_vikram','10.0.1.90',  21, NULL, 'INFO',
    '{"file_name": "customer_dump_2018.csv", "alert_type": "CRITICAL", "acknowledged_by": "user_vikram"}'::jsonb),
(NOW()-INTERVAL '1 day',         'ALERT_SNOOZED',    'user_rohan', '10.0.2.15',  14, NULL, 'WARN',
    '{"file_name": "website_contact_list.csv", "snoozed_until": "2024-04-15", "reason": "Pending team review"}'::jsonb),

-- Scan 5 (2 hours ago - most recent)
(NOW()-INTERVAL '2 hours',       'SCAN_STARTED',     'user_arjun', '10.0.1.42',  NULL, 5, 'INFO',
    '{"scan_run_id": 5, "triggered_by": "manual"}'::jsonb),
(NOW()-INTERVAL '2 hours' + INTERVAL '8s', 'SCAN_COMPLETED', 'system', NULL, NULL, 5, 'INFO',
    '{"scan_run_id": 5, "files_scanned": 62, "high_risk_files": 7, "medium_risk_files": 11, "low_risk_files": 44, "total_pii": 301}'::jsonb),
(NOW()-INTERVAL '2 hours' + INTERVAL '9s', 'SCORE_UPDATED',  'system', NULL, NULL, 5, 'INFO',
    '{"user_id": "user_arjun", "old_score": 70, "new_score": 72, "reason": "Clean scan with fewer high-risk files"}'::jsonb),

-- Access events
(NOW()-INTERVAL '5 hours',       'DASHBOARD_VIEWED', 'user_siddharth','10.0.3.5', NULL,NULL,'DEBUG',
    '{"page": "dashboard", "session_duration_s": 245}'::jsonb),
(NOW()-INTERVAL '4 hours',       'REPORT_DOWNLOADED','user_kavya', '10.0.1.78',  NULL,NULL,'INFO',
    '{"report_name": "OrdoNexus_DPDP_Compliance_Report.pdf", "file_size_kb": 245}'::jsonb),
(NOW()-INTERVAL '1 hour',        'USER_LOGIN',       'user_priya', '10.0.1.55',  NULL,NULL,'INFO',
    '{"login_method": "SSO", "ip": "10.0.1.55"}'::jsonb),
(NOW()-INTERVAL '30 minutes',    'SIMULATE_REMEDIATION','user_priya','10.0.1.55', 36, NULL,'INFO',
    '{"file_name": "orders_dump_q4_2023.sql", "risk_reduction": 36.8, "liability_saved_crore": 3200}'::jsonb),
(NOW()-INTERVAL '10 minutes',    'POLICY_REVIEW',    'user_kavya', '10.0.1.78',  NULL,NULL,'INFO',
    '{"policies_reviewed": 5, "updated_checks": 3, "reviewer": "user_kavya"}'::jsonb);


-- ─────────────────────────────────────────
--  RISK SNAPSHOTS  (30 days × 3 primary buckets)
-- ─────────────────────────────────────────
INSERT INTO risk_snapshots (
    snapshot_date, bucket_name, environment, data_source,
    total_files, critical_risk_files, high_risk_files, medium_risk_files, low_risk_files,
    avg_risk_score, max_risk_score,
    total_pii_count, total_aadhaar, total_pan, total_gstin, total_email,
    total_liability_inr, remediated_count
)
SELECT
    d::date AS snapshot_date,
    b.bucket_name,
    'production',
    'MOCK'::data_source_enum,
    b.total_files,
    b.crit + (RANDOM() * 1)::int % 2                              AS critical_risk_files,
    b.high_files + (RANDOM() * 2)::int % 3 - 1                   AS high_risk_files,
    b.med_files  + (RANDOM() * 2)::int % 3 - 1                   AS medium_risk_files,
    b.low_files,
    ROUND((b.avg_risk + (RANDOM() * 4 - 2))::numeric, 2)         AS avg_risk_score,
    b.max_risk,
    b.pii + (RANDOM() * 10 - 5)::int                             AS total_pii_count,
    b.aadhaar,
    b.pan,
    b.gstin,
    b.email,
    b.liability + (RANDOM() * 10000000000 - 5000000000)::bigint  AS total_liability_inr,
    CASE WHEN d::date < NOW() - INTERVAL '15 days' THEN 2 ELSE 0 END AS remediated_count
FROM
    generate_series(NOW() - INTERVAL '29 days', NOW(), INTERVAL '1 day') AS d,
    (VALUES
        ('finance_private',   10, 2, 3, 3, 4, 22.5, 50.0,  155, 40, 32, 18, 65,  420000000000),
        ('public_web',        10, 2, 2, 3, 5, 18.0, 61.5,   90,  7,  2,  0, 81,  350000000000),
        ('legacy_archive',    10, 3, 3, 2, 5, 32.0, 50.0,  154, 68, 59, 10,750,  480000000000)
    ) AS b(bucket_name, total_files, crit, high_files, med_files, low_files,
           avg_risk, max_risk, pii, aadhaar, pan, gstin, email, liability)
ON CONFLICT (snapshot_date, bucket_name, environment) DO NOTHING;


-- ─────────────────────────────────────────
--  POLICY CHECKS  (25 rows)
-- ─────────────────────────────────────────
INSERT INTO policy_checks (policy_id, article, title, check_name, status, is_automated, checked_by, notes) VALUES
('POL-001','Article 4','Data Minimisation','No PII data older than 730 days in active buckets',         'FAIL',  true,  'system',      'legacy_archive has files from 2016-2019'),
('POL-001','Article 4','Data Minimisation','No redundant copies of PII across buckets',                 'PARTIAL',false,'user_kavya',  'Some overlap between hr_data and finance_private'),
('POL-001','Article 4','Data Minimisation','Retention policy defined and enforced per bucket',          'FAIL',  false, 'user_kavya',  'Only marketing has a defined policy'),
('POL-001','Article 4','Data Minimisation','Purpose limitation documented for all data collections',    'PARTIAL',false,'user_ananya', 'Finance and HR documented; others pending'),
('POL-001','Article 4','Data Minimisation','Periodic data purge schedule active',                       'FAIL',  true,  'system',      'No automated purge jobs configured'),

('POL-002','Article 5','Accuracy of Data','Regular scanning schedule configured (<=7 days)',            'PASS',  true,  'system',      'Scans run every 5 days on average'),
('POL-002','Article 5','Accuracy of Data','Stale data flagged automatically with staleness score',      'PASS',  true,  'system',      'Staleness multiplier active'),
('POL-002','Article 5','Accuracy of Data','Version control on sensitive records',                       'PASS',  false, 'user_arjun',  'Git-tracked config and schema'),
('POL-002','Article 5','Accuracy of Data','Data correction mechanism documented',                       'PARTIAL',false,'user_priya',  'Process exists for Finance; HR pending'),
('POL-002','Article 5','Accuracy of Data','Duplicate detection active',                                 'FAIL',  true,  'system',      'file_hash_sha256 not yet populated'),

('POL-003','Article 6','Storage Limitation','Files older than 730 days reviewed quarterly',             'FAIL',  false, 'user_kavya',  'Last review was 18 months ago'),
('POL-003','Article 6','Storage Limitation','Auto-deletion or archival policy configured',              'FAIL',  false, 'user_kavya',  'No automated lifecycle rules'),
('POL-003','Article 6','Storage Limitation','Cold storage migration for inactive data',                 'FAIL',  false, 'user_vikram', 'Infrastructure project pending'),
('POL-003','Article 6','Storage Limitation','Bucket-level storage quotas enforced',                     'PARTIAL',true, 'system',      'Quotas set for finance_private only'),
('POL-003','Article 6','Storage Limitation','Legal hold process documented',                            'PASS',  false, 'user_siddharth','Legal team confirmed process on 2024-01-10'),

('POL-004','Article 8','Security Safeguards','PII values never stored in logs or scan results',         'PASS',  true,  'system',      'Zero-Trust principle enforced in codebase'),
('POL-004','Article 8','Security Safeguards','Access controls per bucket configured',                   'PASS',  true,  'system',      'IAM roles applied'),
('POL-004','Article 8','Security Safeguards','Encryption at rest enabled on all buckets',               'PASS',  true,  'system',      'AES-256 confirmed'),
('POL-004','Article 8','Security Safeguards','Encryption in transit (TLS 1.2+) enforced',               'PASS',  true,  'system',      'Verified via WAF logs'),
('POL-004','Article 8','Security Safeguards','Security incident response plan documented',               'PARTIAL',false,'user_kavya',  'Draft exists; final review pending'),

('POL-005','Article 9','Accountability','Immutable audit trail for all data access events',             'PASS',  true,  'system',      'audit_log table enforces append-only via trigger'),
('POL-005','Article 9','Accountability','Compliance reports generated monthly',                         'PASS',  false, 'user_priya',  'Reports generated on 2024-01-15, 2024-02-15, 2024-03-14'),
('POL-005','Article 9','Accountability','DPO (Data Protection Officer) designated',                     'PASS',  false, 'user_kavya',  'Kavya Nair designated as DPO'),
('POL-005','Article 9','Accountability','Data breach notification procedure documented',                 'PASS',  false, 'user_siddharth','Procedure approved by legal on 2024-02-01'),
('POL-005','Article 9','Accountability','Annual DPDP compliance audit scheduled',                       'PARTIAL',false,'user_kavya',  'Scheduled for Q4 2024; auditor not yet engaged')
ON CONFLICT (policy_id, check_name) DO NOTHING;


-- ─────────────────────────────────────────
--  Update remediated files metadata
-- ─────────────────────────────────────────
UPDATE file_metadata SET
    remediation_action = 'ARCHIVE',
    remediated_at      = NOW() - INTERVAL '3 days',
    remediated_by      = 'user_arjun',
    remediation_notes  = 'Archived to cold storage per DPDP Article 6 compliance'
WHERE file_name = 'old_salary_2020.csv';

UPDATE file_metadata SET
    remediation_action = 'DELETE',
    remediated_at      = NOW() - INTERVAL '10 days',
    remediated_by      = 'user_arjun',
    remediation_notes  = 'Permanently deleted — data beyond retention window'
WHERE file_name = 'crm_dump_2016.csv';

UPDATE file_metadata SET
    remediation_action = 'DELETE',
    remediated_at      = NOW() - INTERVAL '20 days',
    remediated_by      = 'user_priya',
    remediation_notes  = 'Public bucket PII — emergency deletion'
WHERE file_name = 'old_form_data_2019.csv';

UPDATE file_metadata SET
    remediation_action = 'ARCHIVE',
    remediated_at      = NOW() - INTERVAL '15 days',
    remediated_by      = 'user_ananya',
    remediation_notes  = 'Terminated employee records archived per HR policy'
WHERE file_name = 'terminated_employees_2021.xlsx';

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
--  VERIFICATION QUERIES  (run after seeding to confirm)
-- ═══════════════════════════════════════════════════════════════════
/*
SELECT 'scan_runs'    AS tbl, COUNT(*) FROM scan_runs    UNION ALL
SELECT 'file_metadata',        COUNT(*) FROM file_metadata    UNION ALL
SELECT 'audit_log',            COUNT(*) FROM audit_log        UNION ALL
SELECT 'user_scores',          COUNT(*) FROM user_scores      UNION ALL
SELECT 'risk_snapshots',       COUNT(*) FROM risk_snapshots   UNION ALL
SELECT 'policy_checks',        COUNT(*) FROM policy_checks    UNION ALL
SELECT 'data_owners',          COUNT(*) FROM data_owners;

-- Dashboard summary:
SELECT * FROM v_dashboard_summary;

-- Active alerts:
SELECT file_name, risk_level, final_risk_score,
       financial_liability / 1e7 AS liability_crore
FROM v_active_alerts
ORDER BY severity_order, final_risk_score DESC;

-- Bucket breakdown:
SELECT * FROM v_bucket_breakdown;
*/
