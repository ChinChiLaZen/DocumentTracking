// The real AOT (Airports of Thailand) 94-item bid-submission checklist,
// transcribed verbatim 2026-07-27 from the RSMS reference system
// (clean-list-it.lovable.app — Suvarnabhumi Airport, AOT PCL, Bid No.
// 6RP10-691062), extracted directly via full-page text capture and verified
// against the site's own phase totals (38/20/6/30 = 94). Structural content
// only (code/name/clause/deadline/importance/phase) — live tick/status state
// on the reference site could not be reliably attributed per-item, so every
// item here starts fully blank (workflowStatus/dates/responsible/link all
// undefined), same treatment as checklistTemplate.ts's blank MAR template.
import type { AotImportance, Item, LifecyclePhase } from './types'

interface AotItemSource {
  code: string
  name: string
  standard: string // the clause/reference note, e.g. "ข้อ 2.1-2.3"
  requirement: string // the deadline-stage label, e.g. "ก่อนยื่นข้อเสนอ"
  importance: AotImportance
  phase: LifecyclePhase
}

const PRE_BIDDING = 'ก่อนยื่นข้อเสนอ'
const BID_DAY = 'วันยื่นข้อเสนอ'
const POC_DAY = 'วันทดสอบ POC'

// Phase 0 — คุณสมบัติ & เตรียมยื่นข้อเสนอ (38 items) — LifecyclePhase 'PreBidding'
const PHASE_0: AotItemSource[] = [
  // S1 (10)
  { code: 'P0-S1-01', name: 'มีความสามารถตามกฎหมาย / ไม่เป็นบุคคลล้มละลาย / ไม่อยู่ระหว่างเลิกกิจการ', standard: 'ข้อ 2.1-2.3', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-02', name: 'ไม่อยู่ระหว่างถูกระงับการยื่นข้อเสนอหรือทำสัญญากับหน่วยงานรัฐชั่วคราว', standard: 'ตรวจสอบรายชื่อในระบบเครือข่ายสารสนเทศของกรมบัญชีกลาง — ข้อ 2.4', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-03', name: 'ไม่ถูกขึ้นบัญชีรายชื่อผู้ทิ้งงานของหน่วยงานรัฐ', standard: 'รวมถึงนิติบุคคลที่ผู้ทิ้งงานเป็นหุ้นส่วนผู้จัดการ กรรมการผู้จัดการ ผู้บริหาร หรือผู้มีอำนาจดำเนินงาน — ข้อ 2.5', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-04', name: 'มีคุณสมบัติและไม่มีลักษณะต้องห้ามตามระเบียบ คณก. นโยบายการจัดซื้อจัดจ้างฯ', standard: 'ข้อ 2.6', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-05', name: 'เป็นบุคคลธรรมดาหรือนิติบุคคลผู้มีอาชีพขายพัสดุที่ประกวดราคาครั้งนี้โดยตรง', standard: 'ข้อ 2.7', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-06', name: 'ไม่มีผลประโยชน์ร่วมกันกับผู้ยื่นข้อเสนอรายอื่น ณ วันประกาศ และไม่กระทำการขัดขวางการแข่งขันอย่างเป็นธรรม', standard: 'ข้อ 2.8', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-07', name: 'ไม่เป็นผู้ได้รับเอกสิทธิ์หรือความคุ้มกันซึ่งอาจปฏิเสธไม่ยอมขึ้นศาลไทย', standard: 'เว้นแต่รัฐบาลของผู้ยื่นข้อเสนอได้มีคำสั่งให้สละเอกสิทธิ์และความคุ้มกันเช่นว่านั้น — ข้อ 2.9', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-08', name: 'กรณียื่นในรูป "กิจการร่วมค้า" — กำหนดสัดส่วนและคุณสมบัติผู้ร่วมค้าให้ครบถ้วนตามข้อ 2.10', standard: 'ระบุผู้เข้าร่วมค้าหลัก (ถ้ามี) / สัดส่วนงาน / หนังสือมอบอำนาจ หรือลายมือชื่อผู้ร่วมค้าทุกรายในกรณีไม่ได้กำหนดผู้ร่วมค้าหลัก', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-09', name: 'มีนโยบายและแนวทางการป้องกันการทุจริตในการจัดซื้อจัดจ้าง', standard: 'ข้อ 2.13', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S1-10', name: 'ลงทะเบียนในระบบจัดซื้อจัดจ้างภาครัฐด้วยอิเล็กทรอนิกส์ (e-GP) ของกรมบัญชีกลาง ข้อมูลถูกต้องครบถ้วน', standard: 'ข้อ 2.11', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  // S2 (5)
  { code: 'P0-S2-01', name: 'กรณีจดทะเบียนเกิน 1 ปี — มีมูลค่าสุทธิของกิจการเป็นบวก 1 ปีล่าสุดก่อนวันยื่นข้อเสนอ', standard: 'จากงบแสดงฐานะการเงินที่ตรวจสอบรับรองแล้ว (สินทรัพย์สุทธิหักหนี้สินสุทธิ) — ข้อ 2.12 (1)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S2-02', name: 'กรณีนิติบุคคลไทยที่ยังไม่มีรายงานงบกับกรมพัฒนาธุรกิจการค้า — ต้องมีทุนจดทะเบียนชำระแล้ว ≥ 200 ล้านบาท', standard: 'ข้อ 2.12 (2)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S2-03', name: 'กรณีไม่มีมูลค่าสุทธิ/ทุนจดทะเบียนเพียงพอ — เลือกใช้วงเงินสินเชื่อ ≥ 1/4 ของวงเงินงบประมาณโครงการ', standard: 'ต้องเป็นหนังสือรับรองจากธนาคาร/บริษัทเงินทุนที่ ทอท. ยอมรับ อายุไม่เกิน 90 วันก่อนยื่นข้อเสนอ — ข้อ 2.12 (4)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S2-04', name: 'กรณีจัดซื้อจัดจ้างวงเงินเกิน 500,000 บาท — มีเงินฝากคงเหลือในบัญชีธนาคาร ≥ 1/4 ของวงเงินงบประมาณ', standard: 'หนังสือรับรองบัญชีเงินฝากไม่เกิน 90 วันก่อนวันยื่นข้อเสนอ — ข้อ 2.12 (3)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S2-05', name: 'กรณีนิติบุคคล/บุคคลธรรมดาต่างประเทศ — เอกสารมูลค่าสุทธิผ่านการรับรองตามระเบียบกระทรวงต่างประเทศ', standard: 'ต้องยื่นเอกสารพร้อมการยื่นข้อเสนอ มิฉะนั้นถือว่ายื่นเอกสารไม่ครบถ้วน — ข้อ 2.12 (5)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  // S3 (9)
  { code: 'P0-S3-01', name: 'ห้างหุ้นส่วนสามัญ/จำกัด — สำเนาหนังสือรับรองจดทะเบียนนิติบุคคล + บัญชีรายชื่อหุ้นส่วนผู้จัดการ', standard: 'ข้อ 3.1 (1)(ก)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S3-02', name: 'บริษัทจำกัด/มหาชน — สำเนาหนังสือรับรองจดทะเบียน + หนังสือบริคณห์สนธิ + บัญชีกรรมการผู้จัดการ + ผู้ถือหุ้นรายใหญ่ (ถ้ามี)', standard: 'ข้อ 3.1 (1)(ข)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S3-03', name: 'กรณีบุคคลธรรมดา/คณะบุคคล — สำเนาบัตรประชาชน + ข้อตกลงเข้าหุ้นส่วน (ถ้ามี) + บัตรประชาชน/หนังสือเดินทางผู้ถือหุ้นที่ไม่ได้ถือสัญชาติไทย', standard: 'ข้อ 3.1 (2)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S3-04', name: 'กรณีกิจการร่วมค้า — สำเนาสัญญาเข้าร่วมค้า + เอกสารตาม (1) หรือ (2) ของผู้ร่วมค้าแต่ละราย', standard: 'ข้อ 3.1 (3)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S3-05', name: 'หลักฐานมูลค่าสุทธิของกิจการ ตามที่เลือกในขั้นที่ 0 (ฐานะการเงิน) ข้างต้น', standard: 'ข้อ 3.1 (4)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S3-06', name: 'สำเนาใบทะเบียนพาณิชย์ (ถ้ามี)', standard: 'ข้อ 3.1 (6)', requirement: PRE_BIDDING, importance: 'Supporting', phase: 'PreBidding' },
  { code: 'P0-S3-07', name: 'สำเนาใบทะเบียนภาษีมูลค่าเพิ่ม (ถ้ามี)', standard: 'ข้อ 3.1 (7)', requirement: PRE_BIDDING, importance: 'Supporting', phase: 'PreBidding' },
  { code: 'P0-S3-08', name: 'นโยบายและแนวทางป้องกันการทุจริต + แบบตรวจสอบข้อมูลผู้ประกอบการ (เฉพาะวงเงิน ≥ 300 ล้านบาท)', standard: 'ข้อ 3.1 (5) — ตรงกับข้อ 1.8 ของเอกสารแนบท้าย', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S3-09', name: 'แนบไฟล์เอกสารส่วนที่ 1 ทั้งหมดผ่านระบบ e-GP ตามข้อ 1.6 (1) — ไม่ต้องแนบบัญชีเอกสารเป็น PDF เอง', standard: 'ระบบจะสร้างบัญชีเอกสารส่วนที่ 1 ให้อัตโนมัติเมื่อแนบไฟล์ครบถูกต้อง — ข้อ 3.1 (8)', requirement: PRE_BIDDING, importance: 'Supporting', phase: 'PreBidding' },
  // S4 (4)
  { code: 'P0-S4-01', name: 'วางหลักประกันการเสนอราคา จำนวน 68,459,670.00 บาท พร้อมการเสนอราคาทางระบบ e-GP', standard: 'หกสิบแปดล้านสี่แสนห้าหมื่นเก้าพันหกร้อยเจ็ดสิบบาทถ้วน — เลือกใช้อย่างหนึ่งอย่างใด: เงินสด / หนังสือค้ำประกันอิเล็กทรอนิกส์ของธนาคาร / พันธบัตรรัฐบาลไทย / หนังสือค้ำประกันบริษัทเงินทุน — ข้อ 5', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S4-02', name: 'กรณีวางเป็นพันธบัตรรัฐบาลไทย/หนังสือค้ำประกันบริษัทเงินทุน — ส่งต้นฉบับให้ ทอท. ตรวจสอบ วันที่ 9 กรกฎาคม 2569 เวลา 08.30-16.30 น.', standard: 'ข้อ 5.4', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S4-03', name: 'กรณีวางเป็นเงินสด — โอนเข้าบัญชี ธ.กรุงไทย เลขที่บัญชี 5713 1804254 ชื่อบัญชี บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)', standard: 'พร้อมส่งหลักฐานการชำระเงิน + แบบแจ้งความประสงค์ชำระเงินค่าหลักประกันฯ ให้ ทอท. ตรวจสอบ ภายในวันและเวลาเสนอราคาเท่านั้น', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S4-04', name: 'กรณียื่นในรูปกิจการร่วมค้า — หนังสือค้ำประกันต้องระบุชื่อผู้เข้าร่วมค้าที่สัญญาร่วมค้ากำหนดให้เป็นผู้ยื่นข้อเสนอ', standard: 'ข้อ 5 (หน้า 9-10)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  // S5 (6)
  { code: 'P0-S5-01', name: 'เสนอราคาเป็นเงินบาท เพียงครั้งเดียวและราคาเดียว ตัวเลขกับตัวหนังสือต้องตรงกัน', standard: 'หากไม่ตรงกันให้ถือตัวหนังสือเป็นสำคัญ ราคารวมต้องรวมภาษีมูลค่าเพิ่ม ภาษีอากรอื่น ค่าขนส่ง ค่าจดทะเบียน ค่าใช้จ่ายอื่นๆ ทั้งปวง — ข้อ 4.2', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S5-02', name: 'กำหนดยืนราคาไม่น้อยกว่า 120 วัน ตั้งแต่วันเสนอราคา', standard: 'ข้อ 4.2', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S5-03', name: 'กำหนดเวลาส่งมอบพัสดุไม่เกิน 540 วัน นับถัดจากวันลงนามในสัญญาซื้อ', standard: 'ข้อ 4.3', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S5-04', name: 'ยื่นข้อเสนอและเสนอราคาผ่านระบบ e-GP วันที่ 8 กรกฎาคม 2569 เวลา 09.00-12.00 น.', standard: 'เวลาในระบบ e-GP เป็นเกณฑ์ พ้นกำหนดแล้วจะไม่รับเอกสารโดยเด็ดขาด — ข้อ 4.5', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S5-05', name: 'จัดทำเอกสารเสนอราคาเป็นไฟล์ PDF ตรวจสอบความครบถ้วน/ชัดเจน ก่อน Upload ยืนยันการเสนอราคา', standard: 'ข้อ 4.6', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S5-06', name: 'ลงทะเบียนเข้าสู่กระบวนการเสนอราคาตามวัน เวลาที่กำหนด และศึกษาวิธีการเสนอราคาทางเว็บไซต์ www.gprocurement.go.th ล่วงหน้า', standard: 'ข้อ 4.9 (3),(5)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  // S6 (4)
  { code: 'P0-S6-01', name: 'มีมูลค่าสุทธิของกิจการตามหนังสือคณะกรรมการวินิจฉัยปัญหาการจัดซื้อจัดจ้างฯ', standard: 'ด่วนที่สุด ที่ กค (กวจ) 0405.2/ว 124 ลงวันที่ 1 มีนาคม 2566 — ข้อ 20.1', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S6-02', name: 'ได้รับแต่งตั้งเป็นตัวแทนจำหน่ายอย่างเป็นทางการในการจำหน่ายอุปกรณ์ตามข้อ 6.1', standard: 'จากผู้ผลิตหรือเจ้าของผลิตภัณฑ์ หรือเป็นผู้จัดจำหน่ายที่ได้รับสิทธิจากตัวแทนจำหน่ายภายในประเทศ หนังสือแต่งตั้งต้องมีผลบังคับใช้อยู่และยังไม่หมดอายุในวันยื่นข้อเสนอ — ข้อ 20.2 (เกี่ยวพันกับข้อ 21.1.1)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S6-03', name: 'เป็นผู้มีผลงานขายพร้อมติดตั้งระบบ ICT หรือผลงานพัฒนา/ปรับปรุงระบบ ICT สัญญาเดียว ≥ 200 ล้านบาท', standard: 'เป็นคู่สัญญาโดยตรงกับหน่วยงานรัฐหรือเอกชนที่ ทอท. เชื่อถือ — ข้อ 20.3 (เกี่ยวพันกับข้อ 21.1.2)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
  { code: 'P0-S6-04', name: 'มีนโยบายและแนวทางการป้องกันการทุจริตในการจัดซื้อจัดจ้างที่เหมาะสม เป็นลายลักษณ์อักษรชัดเจน', standard: 'ตามประกาศคณะกรรมการความร่วมมือป้องกันการทุจริต ตามมาตรฐานขั้นต่ำของนโยบายฯ ที่กำหนดตามมาตรา 19 แห่ง พ.ร.บ. จัดซื้อจัดจ้างฯ พ.ศ. 2560 — ข้อ 20.4 (เกี่ยวพันกับข้อ 21.1.3)', requirement: PRE_BIDDING, importance: 'Critical', phase: 'PreBidding' },
]

// Phase 1 — ยื่นประมูล (20 items) — LifecyclePhase 'Bidding'
const PHASE_1: AotItemSource[] = [
  // S1 (5)
  { code: 'P1-S1-01', name: 'หนังสือแต่งตั้งตัวแทนจำหน่าย (Authorized Dealer)', standard: 'ยังไม่หมดอายุ ณ วันยื่น — ออกโดยเจ้าของผลิตภัณฑ์/ผู้ผลิต ตามข้อ 6.1', requirement: BID_DAY, importance: 'Critical', phase: 'Bidding' },
  { code: 'P1-S1-02', name: 'หนังสือรับรองผลงาน วงเงินสัญญาเดียว ≥ 200 ล้านบาท', standard: 'คู่สัญญาโดยตรงกับหน่วยงานรัฐ/เอกชนที่ ทอท. เชื่อถือ + สำเนาสัญญา + หนังสือรับรองหักภาษี ณ ที่จ่าย', requirement: BID_DAY, importance: 'Critical', phase: 'Bidding' },
  { code: 'P1-S1-03', name: 'นโยบายป้องกันการทุจริต (ลายลักษณ์อักษร) + แบบตรวจสอบ ผนวก ฏ', standard: 'กรณีวงเงินโครงการเกิน 300 ล้านบาท — ตามประกาศคณะกรรมการความร่วมมือป้องกันการทุจริต', requirement: BID_DAY, importance: 'Critical', phase: 'Bidding' },
  { code: 'P1-S1-04', name: 'เอกสารรับรอง FAA สำหรับ FOD Detection Equipment', standard: 'AC No. 150/5220-24 หรือฉบับใหม่กว่า — Stationary Radar / Electro-Optical / Hybrid', requirement: BID_DAY, importance: 'Critical', phase: 'Bidding' },
  { code: 'P1-S1-05', name: 'เอกสารออกแบบติดตั้งอุปกรณ์ตรวจจับ + ประเมินพื้นผิวทางวิ่ง (Top View + Side View)', standard: 'ระบุตำแหน่งติดตั้ง ทางวิ่ง 01-19, 02R-20L, 02L-20R + coverage + ความสูง + ระยะจากเส้นกึ่งกลาง', requirement: BID_DAY, importance: 'Critical', phase: 'Bidding' },
  // S2 (9) — POC gates
  { code: 'P1-S2-01', name: 'เตรียมอุปกรณ์และเครื่องมือสำหรับทดสอบ POC (รุ่นและยี่ห้อที่ยื่นเสนอ)', standard: 'ทอท. เตรียม Object วัตถุทดสอบให้ — สถานที่ทดสอบ ทอท. แจ้งภายหลัง', requirement: BID_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  { code: 'P1-S2-02', name: 'POC ค.1 — FOD Detection กลางวัน (15 คะแนน)', standard: 'วัตถุ O และ △ ทดสอบ 2 ครั้ง — ตั้งค่าระบบก่อน 15 นาที', requirement: POC_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  { code: 'P1-S2-03', name: 'POC ค.2 — FOD Detection กลางคืน (15 คะแนน)', standard: 'วัตถุ O และ △ ทดสอบ 2 ครั้ง — ตั้งค่าระบบก่อน 15 นาที', requirement: POC_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  { code: 'P1-S2-04', name: 'POC ค.3 — FOD Detection ≥ 90% สุ่มวาง พื้นที่ 30×30 ม. กลางวัน (10 คะแนน)', standard: 'วัตถุตามชนิดที่ ทอท. กำหนด ทดสอบ 2 ครั้ง', requirement: POC_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  { code: 'P1-S2-05', name: 'POC ค.4 — FOD Detection ≥ 90% สุ่มวาง พื้นที่ 30×30 ม. กลางคืน (10 คะแนน)', standard: 'วัตถุตามชนิดที่ ทอท. กำหนด ทดสอบ 2 ครั้ง', requirement: POC_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  { code: 'P1-S2-06', name: 'POC ค.5 — FOD วัตถุ 2 ชิ้น ห่างกัน ≥ 3 ม. กลางวัน (10 คะแนน)', standard: 'ต้องแยกเป็น 2 เหตุการณ์ (Event) ต่างหาก', requirement: POC_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  { code: 'P1-S2-07', name: 'POC ค.6 — FOD วัตถุ 2 ชิ้น ห่างกัน ≥ 3 ม. กลางคืน (10 คะแนน)', standard: 'ต้องแยกเป็น 2 เหตุการณ์ (Event) ต่างหาก', requirement: POC_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  { code: 'P1-S2-08', name: 'POC ค.7 — Runway Surface Assessment กลางวัน (15 คะแนน)', standard: 'รายงานเมื่อ RWYCC เปลี่ยนแปลง เช่น 6→5 หรือ 6→3 ทดสอบ 2 ครั้ง', requirement: POC_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  { code: 'P1-S2-09', name: 'POC ค.8 — Runway Surface Assessment กลางคืน (15 คะแนน)', standard: 'รายงานเมื่อ RWYCC เปลี่ยนแปลง เช่น 6→5 หรือ 6→3 ทดสอบ 2 ครั้ง', requirement: POC_DAY, importance: 'CriticalCheckpoint', phase: 'Bidding' },
  // S3 (2)
  { code: 'P1-S3-01', name: 'ราคาค่าซ่อมบำรุงรักษาล่วงหน้า 9 ปี ตาม ผนวก ช', standard: 'ปี 1≤6% / ปี 5≤8% / ปี 9≤10% ของมูลค่างาน (ไม่รวม VAT)', requirement: BID_DAY, importance: 'Critical', phase: 'Bidding' },
  { code: 'P1-S3-02', name: 'คำนวณ Net Present Value (NPV) ค่าซ่อมบำรุง 9 ปี พร้อมเอกสารประกอบ', standard: 'NPV ต่ำสุด = 100 คะแนน น้ำหนัก 20% — ตามสูตรข้อ 22.1.4.2', requirement: BID_DAY, importance: 'Normal', phase: 'Bidding' },
  // S4 (3)
  { code: 'P1-S4-01', name: 'ระยะเวลารับประกันหลังการขาย ≥ 365 วัน (SLA ผนวก ข)', standard: '≥1,095 วัน=100 คะแนน · 913-1,094=85 · 730-912=70 · 548-729=65 · 365-547=50', requirement: BID_DAY, importance: 'Critical', phase: 'Bidding' },
  { code: 'P1-S4-02', name: 'แผนการให้บริการซ่อมบำรุงตาม Resolution Time (SLA ผนวก ข)', standard: 'Critical ≤3.5 ชม. · High ≤12 ชม. · Medium ≤48 ชม. · Low ≤72 ชม.', requirement: BID_DAY, importance: 'Normal', phase: 'Bidding' },
  { code: 'P1-S4-03', name: 'แผนการตรวจสอบระบบระหว่างรับประกัน ≥ 2 ครั้ง/ปี', standard: 'ทำความสะอาด / ตรวจ OS / ตรวจ App / Backup / ลบไฟล์ไม่จำเป็น / ตรวจไวรัส / รายงานผล', requirement: BID_DAY, importance: 'Normal', phase: 'Bidding' },
  // S5 (1)
  { code: 'P1-S5-01', name: 'ใบเสนอราคารวม (หน่วย: บาท)', standard: 'ราคาต่ำสุด = 100 คะแนน น้ำหนัก 30% — ต้องไม่สูงกว่าวงเงินซ่อมบำรุงล่วงหน้า (ข้อ 23.2)', requirement: BID_DAY, importance: 'Critical', phase: 'Bidding' },
]

// Phase 2 — หลังลงนามสัญญา (6 items) — LifecyclePhase 'AfterContract'
const PHASE_2: AotItemSource[] = [
  { code: 'P2-S1-01', name: 'แผนการดำเนินงานโครงการ (Project Plan)', standard: 'เสนอคณะกรรมการตรวจรับพัสดุ ทอท. เห็นชอบก่อนดำเนินการ', requirement: 'ภายใน 15 วัน หลังลงนาม', importance: 'Critical', phase: 'AfterContract' },
  { code: 'P2-S2-01', name: 'Shop Drawing ระบบหลัก + ระบบไฟฟ้า + รายละเอียดที่เกี่ยวข้อง', standard: 'เสนอคณะกรรมการตรวจรับเห็นชอบก่อนเริ่มติดตั้ง — ระบุ Type & Model อุปกรณ์อย่างชัดเจน', requirement: 'ภายใน 30 วัน หลังลงนาม', importance: 'Critical', phase: 'AfterContract' },
  { code: 'P2-S2-02', name: 'แผนประเมินความเสี่ยง (Risk Assessment Plan)', standard: 'เนื้อหาเป็นไปตามข้อกำหนด กพท. / ท่าอากาศยาน — เสนอผู้อำนวยการท่าอากาศยาน', requirement: 'ภายใน 30 วัน หลังลงนาม', importance: 'Normal', phase: 'AfterContract' },
  { code: 'P2-S2-03', name: 'แผนความปลอดภัย (Safety Plan)', standard: 'เนื้อหาเป็นไปตามข้อกำหนด กพท. / ท่าอากาศยาน — เสนอผู้อำนวยการท่าอากาศยาน', requirement: 'ภายใน 30 วัน หลังลงนาม', importance: 'Normal', phase: 'AfterContract' },
  { code: 'P2-S2-04', name: 'แผนดำเนินการด้านความปลอดภัย + แผนรักษาความปลอดภัย (ถ้ามี)', standard: 'MS Word/Excel + PDF ขนาด A4 จำนวน ≥ 3 ชุด', requirement: 'ภายใน 30 วัน หลังลงนาม', importance: 'Normal', phase: 'AfterContract' },
  { code: 'P2-S3-01', name: 'ลงนาม NDA ความมั่นคงปลอดภัย ICT (Non-Disclosure Agreement)', standard: 'ตามแบบฟอร์มในเว็บไซต์ www.airportthai.co.th — Clause 16.2', requirement: 'ภายใน 15 วัน หลังลงนาม', importance: 'Critical', phase: 'AfterContract' },
]

// Phase 3 — ติดตั้ง ทดสอบ ส่งมอบ (30 items) — LifecyclePhase 'InstallationCommissioning'
const PHASE_3: AotItemSource[] = [
  // S1 (2)
  { code: 'P3-S1-01', name: 'สำรวจและศึกษาภาพจริงของทางวิ่ง + พื้นที่ปลอดภัยรอบทางวิ่ง', standard: 'Clause 4.2.2.1 — ใช้ออกแบบระบบให้สอดคล้องกับกระบวนการทำงาน', requirement: 'ก่อน Go-live', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S1-02', name: 'ศึกษา/เก็บข้อมูลกระบวนการทำงานปัจจุบัน ทอท.', standard: 'จากหน่วยงานควบคุมเขตบิน / ส่วนสนามบิน / บริการข่าวสาร / ควบคุมสัตว์อันตราย', requirement: 'ก่อน Go-live', importance: 'Normal', phase: 'InstallationCommissioning' },
  // S2 (7)
  { code: 'P3-S2-01', name: 'เอกสารรายละเอียดออกแบบอุปกรณ์ตรวจจับฯ ตามข้อ 4 (MS Office + PDF)', standard: 'A3/A4 ≥ 3 ชุด + USB ≥ 3 ชุด — Clause 7.1.1.1', requirement: 'ก่อนเริ่มงานติดตั้ง', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S2-02', name: 'Flowchart การทำงานของระบบ / สถาปัตยกรรมซอฟต์แวร์ (AutoCAD + PDF)', standard: 'Clause 7.1.1.2', requirement: 'ก่อนเริ่มงานติดตั้ง', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S2-03', name: 'ไดอะแกรมแสดงการเชื่อมต่อและการทำงานระบบทั้งหมด (AutoCAD + PDF)', standard: 'Clause 7.1.1.3', requirement: 'ก่อนเริ่มงานติดตั้ง', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S2-04', name: 'รายละเอียดออกแบบอุปกรณ์ควบคุมและแสดงผล รวม Video Wall', standard: 'Clause 7.1.1.4', requirement: 'ก่อนเริ่มงานติดตั้ง', importance: 'Normal', phase: 'InstallationCommissioning' },
  { code: 'P3-S2-05', name: 'รายการและจำนวนอุปกรณ์ทั้งหมดที่นำเสนอ (MS Word/Excel + PDF)', standard: 'Clause 7.1.1.5', requirement: 'ก่อนเริ่มงานติดตั้ง', importance: 'Normal', phase: 'InstallationCommissioning' },
  { code: 'P3-S2-06', name: 'รายละเอียดซอฟต์แวร์ทั้งหมดที่ใช้ในการติดตั้ง', standard: 'Clause 7.1.1.6', requirement: 'ก่อนเริ่มงานติดตั้ง', importance: 'Normal', phase: 'InstallationCommissioning' },
  { code: 'P3-S2-07', name: 'รายละเอียดสายไฟฟ้า + สายนำสัญญาณทั้งหมด คุณสมบัติตามข้อ 2.4', standard: 'Clause 7.1.1.7', requirement: 'ก่อนเริ่มงานติดตั้ง', importance: 'Normal', phase: 'InstallationCommissioning' },
  // S3 (3)
  { code: 'P3-S3-01', name: 'ติดตั้งระบบ — ทางวิ่ง 01-19 ครบชุด', standard: 'ตาม Shop Drawing ที่ได้รับอนุมัติ — Clause 7.2.1', requirement: 'ภายใน 540 วัน หลังลงนาม', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S3-02', name: 'ติดตั้งระบบ — ทางวิ่ง 02R-20L ครบชุด', standard: 'ตาม Shop Drawing ที่ได้รับอนุมัติ — Clause 7.2.2', requirement: 'ภายใน 540 วัน หลังลงนาม', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S3-03', name: 'ติดตั้งระบบ — ทางวิ่ง 02L-20R ครบชุด', standard: 'ตาม Shop Drawing ที่ได้รับอนุมัติ — Clause 7.2.3', requirement: 'ภายใน 540 วัน หลังลงนาม', importance: 'Critical', phase: 'InstallationCommissioning' },
  // S4 (5)
  { code: 'P3-S4-01', name: 'ทดสอบสายใยแก้วนำแสง (OTDR) ทุกเส้นทุก Core', standard: '≤0.5 dB/Km @1310nm · ≤0.4 dB/Km @1550nm — Clause 8.1.1', requirement: 'ก่อน SAT', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S4-02', name: 'ทดสอบสาย UTP ทุกสาย + รายงานผล', standard: 'Clause 8.1.2', requirement: 'ก่อน SAT', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S4-03', name: 'ทดสอบสายไฟฟ้าทุกเส้น + แสดงผลตามมาตรฐาน', standard: 'Clause 8.1.3', requirement: 'ก่อน SAT', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S4-04', name: 'System Acceptance Test (SAT) — ทดสอบระบบทั้งหมด', standard: 'ตามฟังก์ชันข้อ 4 และข้อ 5 ทั้งหมด — Clause 8.3', requirement: 'ก่อนส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S4-05', name: 'System Integration Test (SIT) — เชื่อมโยงกับ iFIMS, AFTN', standard: 'ตามข้อ 4 — Clause 8.4', requirement: 'ก่อนส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  // S5 (2)
  { code: 'P3-S5-01', name: 'หลักสูตร Administrator Training ≥ 10 คน + Certificate of RSMS Administrator', standard: 'Clause 9.1', requirement: 'ก่อนวันส่งมอบ (ยื่นหลักสูตร 14 วันล่วงหน้า)', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S5-02', name: 'หลักสูตร User Training ≥ 20 คน + Certificate of RSMS User', standard: 'Clause 9.2', requirement: 'ก่อนวันส่งมอบ (ยื่นหลักสูตร 14 วันล่วงหน้า)', importance: 'Critical', phase: 'InstallationCommissioning' },
  // S6 (11)
  { code: 'P3-S6-01', name: 'คู่มือการใช้งาน (Operating Manual) ภาษาไทย/อังกฤษ — 3 ชุด + USB ≥ 3 ชุด', standard: 'Clause 10.1', requirement: 'วันส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-02', name: 'คู่มือการติดตั้งและซ่อมบำรุง (Installation & Maintenance Manual)', standard: 'Clause 10.2', requirement: 'วันส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-03', name: 'As-built Drawing — แสดงการติดตั้งและเดินสายทั้งหมด ขนาด ≥ A3', standard: 'Clause 10.3', requirement: 'วันส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-04', name: 'ไดอะแกรมแสดงการเชื่อมต่อและการทำงานระบบที่ออกแบบล่าสุด', standard: 'Clause 10.4', requirement: 'วันส่งมอบ', importance: 'Normal', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-05', name: 'เอกสารใบอนุญาตซอฟต์แวร์ (Software License) ระบบทั้งหมด', standard: 'Clause 10.5', requirement: 'วันส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-06', name: 'เอกสารสรุปจำนวนอุปกรณ์ สถานที่ติดตั้ง ยี่ห้อ รุ่น รายละเอียด + รูปถ่าย', standard: 'Clause 10.6', requirement: 'วันส่งมอบ', importance: 'Normal', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-07', name: 'รายงานผลการทดสอบทั้งหมด (ตามข้อ 8)', standard: 'Clause 10.7', requirement: 'วันส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-08', name: 'แผนบริหารความเสี่ยง + QA Plan + Backup & Recovery Plan', standard: 'Clause 10.8', requirement: 'วันส่งมอบ', importance: 'Normal', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-09', name: 'บัญชีรายการครุภัณฑ์ ตาม ผนวก ฉ', standard: 'Clause 10.9', requirement: 'วันส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-10', name: 'Interface Control Document (ICD) — รายละเอียดการเชื่อมโยงระบบ', standard: 'Clause 10.10', requirement: 'วันส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
  { code: 'P3-S6-11', name: 'ถอดและส่งคืนอุปกรณ์ FOD เดิม พร้อมบัญชีครุภัณฑ์', standard: 'Clause 7.3 — ส่งคืน ทอท. พร้อมบัญชีครุภัณฑ์', requirement: 'วันส่งมอบ', importance: 'Critical', phase: 'InstallationCommissioning' },
]

const ALL_SOURCES: AotItemSource[] = [...PHASE_0, ...PHASE_1, ...PHASE_2, ...PHASE_3]

export const AOT_TEMPLATE_ITEMS: Item[] = ALL_SOURCES.map((source, i) => ({
  no: i + 1,
  code: source.code,
  name: source.name,
  standard: source.standard,
  requirement: source.requirement,
  importance: source.importance,
  phase: source.phase,
}))

/** The real "จุดตัดสิทธิ์สำคัญ" (critical eligibility cutoff) notice from the AOT reference. */
export const AOT_CRITICAL_NOTICE: string[] = [
  'หากคุณสมบัติ (ขั้นที่ 0) หรือหลักฐานการยื่นข้อเสนอไม่ครบถ้วนตามข้อ 2-3 และ 21.1 คณะกรรมการจะไม่รับพิจารณาข้อเสนอทั้งหมด ' +
    'และในขั้นเทคนิค (POC) ต้องผ่านกก 2 เงื่อนไขพร้อมกัน: ได้คะแนนรวม ≥ 90 จาก 100 (ข้อ 22.1.2) และ ไม่ตกข้อทดสอบข้อใดหนึ่งเลย (ข้อ 22.1.4.1) ' +
    '— ขาดเงื่อนไขใดเงื่อนไขหนึ่ง กทท. จะไม่พิจารณาราคาต่อทันที',
]
