// The real DOA (Department of Airports) 64-item document tracker, transcribed
// verbatim 2026-07-27 from the reference system (paper-pathfinder-pal.lovable.app
// — "ระบบติดตามเอกสาร — 3 ท่าอากาศยาน KKC · UTH · URT", spanning Khon Kaen (KKC),
// Udon Thani (UTH) and Surat Thani (URT) airports), extracted via full-page
// text capture and verified against the site's own docType totals (Shared 12 /
// Mandatory 21 = 33 of 64; the remaining 31 are Site-specific). Structural
// content only (code/name/folder path/filename/docType/site/phase) — live
// workflow-status state on the reference site could not be reliably attributed
// per-item, so every item here starts fully blank (workflowStatus/dates/
// responsible/link all undefined), same treatment as aotTemplate.ts.
import type { DoaDocType, DoaSite, Item, LifecyclePhase } from './types'


interface DoaItemSource {
  code: string
  name: string // Thai document description
  standard: string // the source folder path, e.g. "00_SHARED/01_Company_Qualifications"
  requirement: string // the real filename, e.g. "G1-REG_Company_Registration_Certificate.pdf"
  docType: DoaDocType
  site: DoaSite
  phase: LifecyclePhase // mapped from the item's G1/G2/G3 group: G1→Bidding, G2→AfterContract, G3→InstallationCommissioning
}

// 00_SHARED — applies to all 3 airports (17 items)
const SHARED: DoaItemSource[] = [
  { code: 'G1-REG', name: 'หนังสือรับรองการจดทะเบียนนิติบุคคล', standard: '00_SHARED/01_Company_Qualifications', requirement: 'G1-REG_Company_Registration_Certificate.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-BNK', name: 'หลักฐานไม่เป็นบุคคลล้มละลาย / ไม่เลิกกิจการ', standard: '00_SHARED/01_Company_Qualifications', requirement: 'G1-BNK_Non_Bankruptcy_Declaration.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-BLK', name: 'หลักฐานไม่ถูกระงับการยื่น / ไม่ขึ้นบัญชีผู้ทิ้งงาน', standard: '00_SHARED/01_Company_Qualifications', requirement: 'G1-BLK_Non_Blacklist_Declaration.pdf', docType: 'Mandatory', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-EGP', name: 'ทะเบียนผู้ประกอบการระบบ e-GP กรมบัญชีกลาง', standard: '00_SHARED/01_Company_Qualifications', requirement: 'G1-EGP_eGP_Registration_Proof.pdf', docType: 'Mandatory', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-FIN1', name: 'งบแสดงฐานะการเงิน 1 ปีล่าสุด (ผู้ตรวจสอบรับรอง)', standard: '00_SHARED/02_Financial', requirement: 'G1-FIN1_Audited_Financial_Statement_2024.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-FIN2', name: 'หนังสือรับรองวงเงินสินเชื่อจากธนาคาร (ไม่เกิน 90 วัน)', standard: '00_SHARED/02_Financial', requirement: 'G1-FIN2_Bank_Credit_Line_Certificate.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-FIN3', name: 'หนังสือรับรองบัญชีเงินฝาก มูลค่า 1/4 ของมูลค่างาน (ไม่เกิน 90 วัน)', standard: '00_SHARED/02_Financial', requirement: 'G1-FIN3_Bank_Deposit_Certificate.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-011', name: 'หนังสือแต่งตั้งตัวแทนจำหน่าย จากผู้ผลิต/ตัวแทนในประเทศไทย', standard: '00_SHARED/03_Distributor_Certificates', requirement: 'G1-011_Distributor_Appointment_Letter.pdf', docType: 'Mandatory', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-012', name: 'หนังสือรับรองอะไหล่สำรอง ≥ 5 ปี จากผู้ผลิต/ตัวแทน', standard: '00_SHARED/03_Distributor_Certificates', requirement: 'G1-012_Spare_Parts_Availability_Certificate_5yr.pdf', docType: 'Mandatory', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-013', name: 'หนังสือรับรองผลงานระบบลานจอดสนามบิน ≥ 1 แห่ง', standard: '00_SHARED/03_Distributor_Certificates', requirement: 'G1-013_Apron_Safety_System_Performance_Certificate.pdf', docType: 'Mandatory', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-021', name: 'CV + ใบปริญญา + ใบอนุญาตวิศวกร — ผู้จัดการโครงการ', standard: '00_SHARED/04_Personnel', requirement: 'G1-021_PM_CV_Degree_Engineer_License.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-022', name: 'CV + ใบปริญญา — วิศวกรคอมพิวเตอร์', standard: '00_SHARED/04_Personnel', requirement: 'G1-022_ComputerEngineer_CV_Degree.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-CAT', name: 'Catalog / Brochure อุปกรณ์หลักทั้งระบบ — ระบุเลขหน้าอ้างอิงในตาราง Comply', standard: '00_SHARED/05_Product_Catalog', requirement: '03_Product_Brochure_Tarmac_Safety_IMS_Rev0518F.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G1-WR', name: 'เอกสารระยะเวลารับประกันความชำรุดบกพร่อง (≥ 4 ปี = คะแนนเต็ม)', standard: '00_SHARED/05_Product_Catalog', requirement: 'G1-05-WR_Warranty_Period_Declaration.pdf', docType: 'Shared', site: 'Shared', phase: 'Bidding' },
  { code: 'G3-051', name: 'คู่มือการใช้งาน (Operating Manual) — 2 ชุด TH/EN + ไฟล์อิเล็กทรอนิกส์', standard: '00_SHARED/06_Manuals', requirement: 'G3-051_Operating_Manual_TH_EN.pdf', docType: 'Shared', site: 'Shared', phase: 'InstallationCommissioning' },
  { code: 'G3-052', name: 'คู่มือทางเทคนิค (Technical Manual) — 2 ชุด TH/EN + ไฟล์อิเล็กทรอนิกส์', standard: '00_SHARED/06_Manuals', requirement: 'G3-052_Technical_Manual_TH_EN.pdf', docType: 'Shared', site: 'Shared', phase: 'InstallationCommissioning' },
  { code: 'G3-053', name: 'คู่มือการบำรุงรักษา (Maintenance Manual) — 2 ชุด TH/EN + ไฟล์อิเล็กทรอนิกส์', standard: '00_SHARED/06_Manuals', requirement: 'G3-053_Maintenance_Manual_TH_EN.pdf', docType: 'Shared', site: 'Shared', phase: 'InstallationCommissioning' },
]

// 01_KKC — Khon Kaen airport only (17 items)
const KKC: DoaItemSource[] = [
  { code: 'G1-03-K', name: 'Outline Config Diagram — ท่าอากาศยานขอนแก่น (ระบุยี่ห้อ/รุ่นทุกตัว)', standard: '01_KKC/Phase1_Tender', requirement: 'G1-03_Outline_Configuration_Diagram_KKC.pdf', docType: 'Mandatory', site: 'KKC', phase: 'Bidding' },
  { code: 'G1-T1-K', name: 'ตาราง 1 ผนวก ข. — อุปกรณ์ 21 รายการ พร้อมยี่ห้อ/รุ่น KKC', standard: '01_KKC/Phase1_Tender', requirement: 'G1-04-T1_Equipment_Proposal_Table_Annex_B_KKC.xlsx', docType: 'Mandatory', site: 'KKC', phase: 'Bidding' },
  { code: 'G1-T2-K', name: 'ตาราง 2 — เปรียบเทียบ TOR ขอนแก่น vs. ข้อเสนอ (ระบุเลขหน้า Catalog)', standard: '01_KKC/Phase1_Tender', requirement: 'G1-04-T2_Technical_Compliance_Table_KKC.xlsx', docType: 'Mandatory', site: 'KKC', phase: 'Bidding' },
  { code: 'G1-SD-K', name: 'System Diagram ระบุยี่ห้อ/รุ่น ชื่อโครงการขอนแก่น (น้ำหนัก 5%)', standard: '01_KKC/Phase1_Tender', requirement: 'G1-05-SD_System_Diagram_with_BrandModel_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'Bidding' },
  { code: 'G1-SP-K', name: 'แผนดำเนินโครงการ + แผนเบิกจ่าย — KKC 360 วัน (น้ำหนัก 5%)', standard: '01_KKC/Phase1_Tender', requirement: 'G1-05-SP_Project_Schedule_Payment_Plan_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'Bidding' },
  { code: 'G1-PW-K', name: 'หนังสือรับรองผลงานระบบฯ ลานจอดสนามบิน (น้ำหนัก 10%)', standard: '01_KKC/Phase1_Tender', requirement: 'G1-05-PW_Quality_Performance_Reference_Letter.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'Bidding' },
  { code: 'G1-PR-K', name: 'ตารางราคา ผนวก ข. KKC — ราคากลาง 65,000,000 บาท', standard: '01_KKC/Phase1_Tender', requirement: 'G1-PRICE_Price_Table_Annex_B_Final_KKC.xlsx', docType: 'Mandatory', site: 'KKC', phase: 'Bidding' },
  { code: 'G2-01-K', name: 'Action Plan รายละเอียดงานตามระยะเวลาสัญญา KKC', standard: '01_KKC/Phase2_PostContract', requirement: 'G2-01_Action_Plan_Work_Schedule_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'AfterContract' },
  { code: 'G2-021-K', name: 'แผนประเมินความเสี่ยง — ส่งผู้อำนวยการท่าอากาศยานขอนแก่น', standard: '01_KKC/Phase2_PostContract', requirement: 'G2-021_Risk_Assessment_Plan_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'AfterContract' },
  { code: 'G2-022-K', name: 'แผนความปลอดภัย — ส่งผู้อำนวยการท่าอากาศยานขอนแก่น', standard: '01_KKC/Phase2_PostContract', requirement: 'G2-022_Safety_Plan_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'AfterContract' },
  { code: 'G2-03-K', name: 'Shop Drawing ระบบหลัก + ระบบไฟฟ้า layout ท่าอากาศยานขอนแก่น', standard: '01_KKC/Phase2_PostContract', requirement: 'G2-03_Shop_Drawing_KKC_Installation.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'AfterContract' },
  { code: 'G3-TR1-K', name: 'หลักสูตรฝึกอบรมผู้ใช้งาน ≥ 5 คน ≥ 8 ชม. KKC', standard: '01_KKC/Phase3_Handover', requirement: 'G3-021_Operator_Training_Curriculum_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'InstallationCommissioning' },
  { code: 'G3-TR2-K', name: 'หลักสูตรฝึกอบรมการบำรุงรักษา ≥ 5 คน ≥ 8 ชม. KKC', standard: '01_KKC/Phase3_Handover', requirement: 'G3-022_Maintenance_Training_Curriculum_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'InstallationCommissioning' },
  { code: 'G3-01-K', name: 'รายงานผลการทดสอบระบบ — DOA เข้าร่วม KKC', standard: '01_KKC/Phase3_Handover', requirement: 'G3-01_System_Acceptance_Test_Report_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'InstallationCommissioning' },
  { code: 'G3-03-K', name: 'หลักฐานอุปกรณ์ใหม่ 100% (Invoice + Packing List) KKC', standard: '01_KKC/Phase3_Handover', requirement: 'G3-03_Equipment_New_100pct_Invoice_PackingList_KKC.pdf', docType: 'Mandatory', site: 'KKC', phase: 'InstallationCommissioning' },
  { code: 'G3-04-K', name: 'รายงานส่งมอบระบบครบถ้วน ณ ท่าอากาศยานขอนแก่น ภายใน 360 วัน', standard: '01_KKC/Phase3_Handover', requirement: 'G3-04_System_Delivery_Completion_Report_KKC.pdf', docType: 'Mandatory', site: 'KKC', phase: 'InstallationCommissioning' },
  { code: 'G3-CL-K', name: 'บันทึกรับส่งงานและปิดโครงการ KKC', standard: '01_KKC/Phase3_Handover', requirement: 'G3-CLOSE_Project_Closeout_Handover_Record_KKC.pdf', docType: 'SiteSpecific', site: 'KKC', phase: 'InstallationCommissioning' },
]

// 02_UTH — Udon Thani airport only (15 items)
const UTH: DoaItemSource[] = [
  { code: 'G1-03-U', name: 'Outline Config Diagram — ท่าอากาศยานอุดรธานี ต้องออกใหม่ ระบุชื่อสถานที่', standard: '02_UTH/Phase1_Tender', requirement: 'G1-03_Outline_Configuration_Diagram_UTH.pdf', docType: 'Mandatory', site: 'UTH', phase: 'Bidding' },
  { code: 'G1-T1-U', name: 'ตาราง 1 ผนวก ข. TOR อุดรธานี — อุปกรณ์ 21 รายการ', standard: '02_UTH/Phase1_Tender', requirement: 'G1-04-T1_Equipment_Proposal_Table_Annex_B_UTH.xlsx', docType: 'Mandatory', site: 'UTH', phase: 'Bidding' },
  { code: 'G1-T2-U', name: 'ตาราง 2 — เปรียบเทียบ TOR อุดรธานี vs. ข้อเสนอ (ระบุเลขหน้า Catalog)', standard: '02_UTH/Phase1_Tender', requirement: 'G1-04-T2_Technical_Compliance_Table_UTH.xlsx', docType: 'Mandatory', site: 'UTH', phase: 'Bidding' },
  { code: 'G1-SD-U', name: 'System Diagram ระบุชื่อโครงการอุดรธานี (น้ำหนัก 5%)', standard: '02_UTH/Phase1_Tender', requirement: 'G1-05-SD_System_Diagram_with_BrandModel_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'Bidding' },
  { code: 'G1-SP-U', name: 'แผนดำเนินโครงการ + แผนเบิกจ่าย — UTH 360 วัน (น้ำหนัก 5%)', standard: '02_UTH/Phase1_Tender', requirement: 'G1-05-SP_Project_Schedule_Payment_Plan_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'Bidding' },
  { code: 'G1-PR-U', name: 'ตารางราคา ผนวก ข. UTH — ราคากลาง 64,997,150 บาท', standard: '02_UTH/Phase1_Tender', requirement: 'G1-PRICE_Price_Table_Annex_B_Final_UTH.xlsx', docType: 'Mandatory', site: 'UTH', phase: 'Bidding' },
  { code: 'G2-01-U', name: 'Action Plan ระบุชื่อโครงการ/สถานที่อุดรธานี', standard: '02_UTH/Phase2_PostContract', requirement: 'G2-01_Action_Plan_Work_Schedule_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'AfterContract' },
  { code: 'G2-021-U', name: 'แผนประเมินความเสี่ยง — ส่งผู้อำนวยการท่าอากาศยานอุดรธานี', standard: '02_UTH/Phase2_PostContract', requirement: 'G2-021_Risk_Assessment_Plan_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'AfterContract' },
  { code: 'G2-022-U', name: 'แผนความปลอดภัย — ส่งผู้อำนวยการท่าอากาศยานอุดรธานี', standard: '02_UTH/Phase2_PostContract', requirement: 'G2-022_Safety_Plan_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'AfterContract' },
  { code: 'G2-03-U', name: 'Shop Drawing layout ตาม site plan ท่าอากาศยานอุดรธานี', standard: '02_UTH/Phase2_PostContract', requirement: 'G2-03_Shop_Drawing_UTH_Installation.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'AfterContract' },
  { code: 'G3-TR1-U', name: 'หลักสูตรฝึกอบรมผู้ใช้งาน ≥ 5 คน ≥ 8 ชม. UTH', standard: '02_UTH/Phase3_Handover', requirement: 'G3-021_Operator_Training_Curriculum_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'InstallationCommissioning' },
  { code: 'G3-TR2-U', name: 'หลักสูตรฝึกอบรมการบำรุงรักษา ≥ 5 คน ≥ 8 ชม. UTH', standard: '02_UTH/Phase3_Handover', requirement: 'G3-022_Maintenance_Training_Curriculum_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'InstallationCommissioning' },
  { code: 'G3-01-U', name: 'รายงานผลการทดสอบระบบ ณ ท่าอากาศยานอุดรธานี', standard: '02_UTH/Phase3_Handover', requirement: 'G3-01_System_Acceptance_Test_Report_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'InstallationCommissioning' },
  { code: 'G3-04-U', name: 'รายงานส่งมอบระบบครบถ้วน ณ ท่าอากาศยานอุดรธานี ภายใน 360 วัน', standard: '02_UTH/Phase3_Handover', requirement: 'G3-04_System_Delivery_Completion_Report_UTH.pdf', docType: 'Mandatory', site: 'UTH', phase: 'InstallationCommissioning' },
  { code: 'G3-CL-U', name: 'บันทึกรับส่งงานและปิดโครงการ UTH', standard: '02_UTH/Phase3_Handover', requirement: 'G3-CLOSE_Project_Closeout_Handover_Record_UTH.pdf', docType: 'SiteSpecific', site: 'UTH', phase: 'InstallationCommissioning' },
]

// 03_URT — Surat Thani airport only (15 items)
const URT: DoaItemSource[] = [
  { code: 'G1-03-R', name: 'Outline Config Diagram — ท่าอากาศยานสุราษฎร์ธานี ต้องออกใหม่ ระบุชื่อสถานที่', standard: '03_URT/Phase1_Tender', requirement: 'G1-03_Outline_Configuration_Diagram_URT.pdf', docType: 'Mandatory', site: 'URT', phase: 'Bidding' },
  { code: 'G1-T1-R', name: 'ตาราง 1 ผนวก ข. TOR สุราษฎร์ธานี — อุปกรณ์ 21 รายการ', standard: '03_URT/Phase1_Tender', requirement: 'G1-04-T1_Equipment_Proposal_Table_Annex_B_URT.xlsx', docType: 'Mandatory', site: 'URT', phase: 'Bidding' },
  { code: 'G1-T2-R', name: 'ตาราง 2 — เปรียบเทียบ TOR สุราษฎร์ธานี vs. ข้อเสนอ (ระบุเลขหน้า Catalog)', standard: '03_URT/Phase1_Tender', requirement: 'G1-04-T2_Technical_Compliance_Table_URT.xlsx', docType: 'Mandatory', site: 'URT', phase: 'Bidding' },
  { code: 'G1-SD-R', name: 'System Diagram ระบุชื่อโครงการสุราษฎร์ธานี (น้ำหนัก 5%)', standard: '03_URT/Phase1_Tender', requirement: 'G1-05-SD_System_Diagram_with_BrandModel_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'Bidding' },
  { code: 'G1-SP-R', name: 'แผนดำเนินโครงการ + แผนเบิกจ่าย — URT 360 วัน (น้ำหนัก 5%)', standard: '03_URT/Phase1_Tender', requirement: 'G1-05-SP_Project_Schedule_Payment_Plan_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'Bidding' },
  { code: 'G1-PR-R', name: 'ตารางราคา ผนวก ข. URT — ราคากลาง 64,991,400 บาท', standard: '03_URT/Phase1_Tender', requirement: 'G1-PRICE_Price_Table_Annex_B_Final_URT.xlsx', docType: 'Mandatory', site: 'URT', phase: 'Bidding' },
  { code: 'G2-01-R', name: 'Action Plan ระบุชื่อโครงการ/สถานที่สุราษฎร์ธานี', standard: '03_URT/Phase2_PostContract', requirement: 'G2-01_Action_Plan_Work_Schedule_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'AfterContract' },
  { code: 'G2-021-R', name: 'แผนประเมินความเสี่ยง — ส่งผู้อำนวยการท่าอากาศยานสุราษฎร์ธานี', standard: '03_URT/Phase2_PostContract', requirement: 'G2-021_Risk_Assessment_Plan_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'AfterContract' },
  { code: 'G2-022-R', name: 'แผนความปลอดภัย — ส่งผู้อำนวยการท่าอากาศยานสุราษฎร์ธานี', standard: '03_URT/Phase2_PostContract', requirement: 'G2-022_Safety_Plan_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'AfterContract' },
  { code: 'G2-03-R', name: 'Shop Drawing layout ตาม site plan ท่าอากาศยานสุราษฎร์ธานี', standard: '03_URT/Phase2_PostContract', requirement: 'G2-03_Shop_Drawing_URT_Installation.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'AfterContract' },
  { code: 'G3-TR1-R', name: 'หลักสูตรฝึกอบรมผู้ใช้งาน ≥ 5 คน ≥ 8 ชม. URT', standard: '03_URT/Phase3_Handover', requirement: 'G3-021_Operator_Training_Curriculum_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'InstallationCommissioning' },
  { code: 'G3-TR2-R', name: 'หลักสูตรฝึกอบรมการบำรุงรักษา ≥ 5 คน ≥ 8 ชม. URT', standard: '03_URT/Phase3_Handover', requirement: 'G3-022_Maintenance_Training_Curriculum_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'InstallationCommissioning' },
  { code: 'G3-01-R', name: 'รายงานผลการทดสอบระบบ ณ ท่าอากาศยานสุราษฎร์ธานี', standard: '03_URT/Phase3_Handover', requirement: 'G3-01_System_Acceptance_Test_Report_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'InstallationCommissioning' },
  { code: 'G3-04-R', name: 'รายงานส่งมอบระบบครบถ้วน ณ ท่าอากาศยานสุราษฎร์ธานี ภายใน 360 วัน', standard: '03_URT/Phase3_Handover', requirement: 'G3-04_System_Delivery_Completion_Report_URT.pdf', docType: 'Mandatory', site: 'URT', phase: 'InstallationCommissioning' },
  { code: 'G3-CL-R', name: 'บันทึกรับส่งงานและปิดโครงการ URT', standard: '03_URT/Phase3_Handover', requirement: 'G3-CLOSE_Project_Closeout_Handover_Record_URT.pdf', docType: 'SiteSpecific', site: 'URT', phase: 'InstallationCommissioning' },
]

const ALL_SOURCES: DoaItemSource[] = [...SHARED, ...KKC, ...UTH, ...URT]

export const DOA_TEMPLATE_ITEMS: Item[] = ALL_SOURCES.map((source, i) => ({
  no: i + 1,
  code: source.code,
  name: source.name,
  standard: source.standard,
  requirement: source.requirement,
  docType: source.docType,
  site: source.site,
  phase: source.phase,
}))

/** Display label for a DoaSite, matching the reference site's "KKC·UTH·URT" chip for shared items. */
export const DOA_SITE_LABEL: Record<DoaSite, string> = {
  Shared: 'KKC · UTH · URT',
  KKC: 'KKC',
  UTH: 'UTH',
  URT: 'URT',
}
