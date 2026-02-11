"""
DPDP Compliance Report Generator
Generates PDF reports using ReportLab
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from sqlalchemy.orm import Session

from models import FileMetadata, AuditLog, UserScore
from services import RiskScoringEngine


def generate_compliance_report(db: Session) -> str:
    """
    Generates a comprehensive DPDP compliance PDF report.
    Returns the path to the generated PDF file.
    """
    # Create PDF filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    pdf_filename = f"OrdoNexus_DPDP_Report_{timestamp}.pdf"
    
    # Create PDF document
    doc = SimpleDocTemplate(pdf_filename, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Title
    story.append(Paragraph("OrdoNexus DPDP Compliance Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))
    
    files = db.query(FileMetadata).all()
    total_files = len(files)
    high_risk = len([f for f in files if f.final_risk_score >= 20.0])
    medium_risk = len([f for f in files if 10.0 <= f.final_risk_score < 20.0])
    low_risk = len([f for f in files if f.final_risk_score < 10.0])
    
    total_liability = sum(RiskScoringEngine.calculate_financial_liability(f) for f in files)
    
    summary_data = [
        ["Metric", "Value"],
        ["Total Files Scanned", str(total_files)],
        ["High Risk Files", str(high_risk)],
        ["Medium Risk Files", str(medium_risk)],
        ["Low Risk Files", str(low_risk)],
        ["Total Financial Liability", f"₹{total_liability:,.0f}"],
    ]
    
    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 0.3 * inch))
    
    # High Risk Files Detail
    story.append(Paragraph("High Risk Files (Risk Score ≥ 20)", heading_style))
    
    high_risk_files = [f for f in files if f.final_risk_score >= 20.0]
    
    if high_risk_files:
        file_data = [["File Name", "Bucket", "PII Types", "Risk Score", "Liability (₹)"]]
        
        for file in high_risk_files[:10]:  # Limit to top 10
            pii_types = []
            if file.aadhaar_count > 0:
                pii_types.append(f"Aadhaar({file.aadhaar_count})")
            if file.pan_count > 0:
                pii_types.append(f"PAN({file.pan_count})")
            if file.gstin_count > 0:
                pii_types.append(f"GSTIN({file.gstin_count})")
            if file.email_count > 0:
                pii_types.append(f"Email({file.email_count})")
            
            liability = RiskScoringEngine.calculate_financial_liability(file)
            
            file_data.append([
                file.file_path.split("\\")[-1][:30],  # Truncate long names
                file.bucket_name,
                ", ".join(pii_types),
                f"{file.final_risk_score:.1f}",
                f"{liability:,.0f}"
            ])
        
        file_table = Table(file_data, colWidths=[1.8*inch, 1.2*inch, 1.5*inch, 0.8*inch, 1.2*inch])
        file_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(file_table)
    else:
        story.append(Paragraph("No high-risk files detected. Excellent!", styles['Normal']))
    
    story.append(Spacer(1, 0.3 * inch))
    
    # Recommendations
    story.append(Paragraph("DPDP Compliance Recommendations", heading_style))
    
    recommendations = [
        "1. Immediately archive or delete high-risk files containing sensitive PII.",
        "2. Implement access controls on finance_private bucket.",
        "3. Review legacy_archive for data minimization opportunities.",
        "4. Establish automated scanning schedule (weekly recommended).",
        "5. Train team members on DPDP data handling requirements.",
        "6. Document all remediation actions in audit log."
    ]
    
    for rec in recommendations:
        story.append(Paragraph(rec, styles['Normal']))
        story.append(Spacer(1, 0.1 * inch))
    
    # Build PDF
    doc.build(story)
    
    return pdf_filename
