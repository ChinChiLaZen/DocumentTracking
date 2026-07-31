// CSI MasterFormat division/section list (Thai + English), transcribed verbatim
// from the reference list supplied for the "Project Type" picker on Add Project
// (added 2026-07-31). This is purely a classification field — independent of
// TemplateKind/GroupId/checklist structure (§5 in CLAUDE.md); it never drives
// derived logic in domain/derive.ts.
//
// Entries with no English translation in the source keep nameEn === '' rather
// than inventing one. Minor whitespace/paren normalization was applied (e.g.
// collapsing stray double spaces, closing an unbalanced paren) but wording,
// including source typos (e.g. "Stanpipes", "Speciaties"), was kept verbatim —
// never fabricate or "correct" content that wasn't actually provided.
export interface CsiMasterFormatEntry {
  code: string
  nameTh: string
  nameEn: string
}

export const CSI_MASTER_FORMAT: CsiMasterFormatEntry[] = [
  // Division 01 — General Requirements
  { code: '01 00 00', nameTh: 'ความต้องการทั่วไป', nameEn: 'General Requirements' },
  { code: '01 11 00', nameTh: 'ขอบเขตของงาน', nameEn: 'Summary of Work' },
  { code: '01 30 00', nameTh: 'ความต้องการด้านงานธุรการและเอกสาร', nameEn: 'Administrative Requirements' },
  {
    code: '01 31 00',
    nameTh: 'การบริหารโครงการและการประสานงาน',
    nameEn: 'Project Management and Coordination',
  },
  {
    code: '01 32 00',
    nameTh: 'เอกสารรายงานความก้าวหน้างานก่อสร้าง',
    nameEn: 'Construction Progress Documentation',
  },
  { code: '01 33 00', nameTh: 'ขั้นตอนของการส่งเอกสารต่างๆ', nameEn: 'Submittal Procedures' },
  { code: '01 40 00', nameTh: 'ความต้องการด้านคุณภาพ', nameEn: 'Quality Requirements' },
  { code: '01 42 00', nameTh: 'เอกสารอ้างอิงต่างๆ', nameEn: 'References' },
  {
    code: '01 50 00',
    nameTh: 'สิ่งอำนวยความสะดวกชั่วคราวและการควบคุม',
    nameEn: 'Temporary Facilities and Control',
  },
  {
    code: '01 57 19',
    nameTh: 'การควบคุมสิ่งแวดล้อมชั่วคราว',
    nameEn: 'Temporary Environmental Controls',
  },
  { code: '01 60 00', nameTh: 'ความต้องการเกี่ยวกับผลิตภัณฑ์', nameEn: 'Product Requirements' },
  {
    code: '01 70 00',
    nameTh: 'การบริหารเพื่อปิดงานนั้นๆ',
    nameEn: 'Execution and Closeout Requirements',
  },
  { code: '01 77 00', nameTh: 'ขั้นตอนของการปิดงานส่วนต่างๆ', nameEn: 'Closeout Procedures' },

  // Division 02 — Existing Conditions
  { code: '02 00 00', nameTh: 'สภาพเดิมของหน่วยงานก่อสร้าง', nameEn: 'Existing Conditions' },
  {
    code: '02 22 00',
    nameTh: 'การประเมินงานในพื้นที่เดิมก่อนการก่อสร้าง',
    nameEn: 'Existing Condition Assessment',
  },

  // Division 03 — Concrete
  { code: '03 00 00', nameTh: 'งานคอนกรีต', nameEn: 'Concrete' },
  { code: '03 05 19', nameTh: 'อุปกรณ์ฝังยึดในคอนกรีตภายหลัง', nameEn: '' },
  {
    code: '03 11 13',
    nameTh: 'ไม้แบบคอนกรีตโครงสร้างหล่อในที่',
    nameEn: 'Structural CIP Concrete Forming',
  },
  { code: '03 21 00', nameTh: 'เหล็กเส้นเสริมคอนกรีต', nameEn: 'Reinforcement Bars' },
  { code: '03 31 00', nameTh: 'คอนกรีตโครงสร้าง', nameEn: 'Structural Concrete' },
  { code: '03 38 19', nameTh: 'งานพื้นคอนกรีตอัดแรงภายหลัง', nameEn: 'Bonded Post-Tensioed Slab' },
  { code: '03 41 16', nameTh: 'งานพื้นคอนกรีตสำเร็จรูป', nameEn: '' },
  {
    code: '03 48 16',
    nameTh: 'ผนังคอนกรีตมวลเบาสำเร็จรูป',
    nameEn: 'Precast Lightweight Concrete Wall Panels',
  },

  // Division 04 — Masonry
  { code: '04 00 00', nameTh: 'งานก่อ', nameEn: 'Masonry' },
  { code: '04 20 00', nameTh: 'วัสดุก่อ', nameEn: 'Unit Masonry' },
  {
    code: '04 22 26',
    nameTh: 'งานก่ออิฐมวลเบา',
    nameEn: 'Autoclaved Aerated Concrete Unit Masonry',
  },

  // Division 05 — Metals
  { code: '05 00 00', nameTh: 'งานโลหะ', nameEn: 'Metals' },
  { code: '05 01 70', nameTh: 'การบำรุงรักษาโลหะเพื่องานตกแต่ง', nameEn: 'Maintenance of Decorative Metal' },
  {
    code: '05 05 19',
    nameTh: 'อุปกรณ์ฝังยึดคอนกรีตชนิดติดตั้งภายหลัง',
    nameEn: 'Post-Installed Concrete Anchors',
  },
  { code: '05 12 23', nameTh: 'งานเหล็กโครงสร้างอาคาร', nameEn: '' },
  {
    code: '05 15 19',
    nameTh: 'การติดตั้งเชือกลวดเหล็กไร้สนิม',
    nameEn: 'Stainless-Steel Wire Rope Assemblies',
  },
  { code: '05 52 13', nameTh: 'ราวบันไดและราวกันตก', nameEn: 'Pipe and Tube Railings' },
  { code: '05 55 16', nameTh: 'จมูกบันได', nameEn: 'Metal Stair Nosings' },
  { code: '05 59 00', nameTh: 'สแตนเลส', nameEn: 'Metal Specialties' },
  { code: '05 70 00', nameTh: 'งานโลหะเพื่อการตกแต่ง', nameEn: 'Decorative Metal' },
  { code: '05 75 00', nameTh: 'แผ่นอะลูมิเนียมอบสี', nameEn: 'Decorative Formed Metal' },

  // Division 06 — Wood, Plastics and Composites
  { code: '06 00 00', nameTh: 'งานไม้ พลาสติก และวัสดุประกอบ', nameEn: 'Wood, Plastics and Composites' },
  { code: '06 40 00', nameTh: 'งานไม้สำหรับงานสถาปัตยกรรม', nameEn: 'Architectural Woodwork' },
  {
    code: '06 42 19',
    nameTh: 'ผนังโครงคร่าวไม้กรุลามิเนท',
    nameEn: 'Plastic Laminate Faced Wood Paneling',
  },

  // Division 07 — Thermal and Moisture Protection
  {
    code: '07 00 00',
    nameTh: 'งานป้องกันความร้อนและป้องกันความชื้น',
    nameEn: 'Thermal and Moisture Protection',
  },
  { code: '07 13 53', nameTh: 'แผ่นป้องกันซึมชนิดยืดหยุ่น', nameEn: 'Elastomeric Sheet Waterproofing' },
  { code: '07 16 16', nameTh: 'ระบบกันซึมชนิดตกผลึก', nameEn: 'Crystalline Waterproofing' },
  { code: '07 21 00', nameTh: 'งานฉนวนป้องกันความร้อน', nameEn: 'Thermal Insulation' },
  { code: '07 41 13', nameTh: 'งานหลังคาโลหะ', nameEn: 'Metal Roof Panels' },
  { code: '07 42 13', nameTh: 'งานผนังโลหะ', nameEn: 'Metal Wall Panels' },
  { code: '07 80 00', nameTh: 'การป้องกันไฟและควัน', nameEn: 'Fire and Smoke Protection' },
  { code: '07 84 00', nameTh: 'วัสดุป้องกันไฟและควันลาม', nameEn: 'Fire Stopping' },
  { code: '07 92 00', nameTh: 'วัสดุอุดยาแนว', nameEn: 'Joint Sealants' },
  { code: '07 95 13', nameTh: 'ฝาครอบรอยต่ออาคาร', nameEn: 'Expansion Joint Cover Assemblies' },

  // Division 08 — Opening
  { code: '08 00 00', nameTh: 'งานช่องเปิด', nameEn: 'Opening' },
  { code: '08 11 13', nameTh: 'ประตูและวงกบโลหะแบบกลวง', nameEn: 'Hollow Metal Doors and Frames' },
  { code: '08 11 16', nameTh: 'งานประตูและวงกบอะลูมิเนียม', nameEn: 'Aluminum Doors and Frames' },
  { code: '08 14 00', nameTh: 'ประตูไม้', nameEn: 'Wood Doors' },
  { code: '08 15 66', nameTh: 'ประตูเกล็ดพลาสติก', nameEn: 'Plastic Screen Doors' },
  { code: '08 33 23', nameTh: 'ประตูเหล็กม้วน', nameEn: 'Overhead Coiling Doors' },
  { code: '08 33 44', nameTh: 'ม่านทนไฟและม่านกั้นควัน', nameEn: 'Fire Curtains' },
  { code: '08 44 00', nameTh: 'การประกอบผนังกระจก', nameEn: 'Curtain Wall and Glazed Assemblies' },
  { code: '08 71 00', nameTh: 'อุปกรณ์ประตู', nameEn: 'Door Hardware' },
  { code: '08 80 00', nameTh: 'งานกระจก', nameEn: 'Glazing' },
  { code: '08 81 13', nameTh: 'กระจกตกแต่ง', nameEn: 'Decorative Glass Glazing' },
  { code: '08 91 19', nameTh: 'งานเกล็ดติดตาย', nameEn: 'Fixed Louvers' },

  // Division 09 — Finishes
  { code: '09 00 00', nameTh: 'งานตกแต่งพื้นผิว', nameEn: 'Finishes' },
  { code: '09 24 00', nameTh: 'งานฉาบปูน', nameEn: 'Cement Plastering' },
  { code: '09 29 00', nameTh: 'งานยิปซั่มบอร์ด', nameEn: 'Gypsum Board' },
  { code: '09 30 00', nameTh: 'กระเบื้อง', nameEn: 'Tiling' },
  { code: '09 51 13', nameTh: 'ฝ้าเพดานแผ่นอคูสติก', nameEn: 'Acoustical Panel Ceilings' },
  { code: '09 51 33', nameTh: 'ฝ้าเพดานโลหะชนิดป้องกันเสียง', nameEn: 'Acoustical Metal Pan Ceilings' },
  { code: '09 54 00', nameTh: 'ฝ้าเพดานซีเมนต์บอร์ด', nameEn: 'Cement Board Ceiling' },
  {
    code: '09 54 33',
    nameTh: 'ฝ้าเพดานแผ่นตกแต่งกรุแผ่นพลาสติกลามิเนท บนไม้อัดยาง',
    nameEn: 'Decorative Panel Ceilings',
  },
  { code: '09 51 43', nameTh: 'ฝ้าเพดานหนังระบบขึง', nameEn: 'Stretched-Fabric Ceiling Systems' },
  { code: '09 62 00', nameTh: 'พื้นชนิดพิเศษ', nameEn: 'Specialty Flooring' },
  { code: '09 63 40', nameTh: 'งานพื้นหิน', nameEn: 'Stone Flooring' },
  { code: '09 63 43', nameTh: 'พื้นหินธรรมชาติอัด', nameEn: 'Composition Stone Flooring' },
  { code: '09 66 16', nameTh: 'กระเบื้องหินขัดปูพื้น', nameEn: 'Terrazzo Floor Tile' },
  { code: '09 68 13', nameTh: 'พื้นพรมแผ่น', nameEn: 'Tile Carpeting' },
  { code: '09 72 00', nameTh: 'วัสดุปิดผนัง', nameEn: 'Wall Coverings' },
  { code: '09 91 00', nameTh: 'งานสี', nameEn: 'Painting' },
  {
    code: '09 96 46',
    nameTh: 'การป้องกันไฟสำหรับโครงสร้างเหล็ก (ชนิด Intumescent Coating)',
    nameEn: '',
  },
  {
    code: '09 97 26',
    nameTh: 'ฉนวนป้องกันไฟชนิดพ่นบนโครงสร้างเหล็ก',
    nameEn: 'Cementitious Fireproofing On Steel Structure',
  },

  // Division 10 — Specialties
  { code: '10 00 00', nameTh: 'สิ่งก่อสร้างพิเศษ', nameEn: 'Specialties' },
  { code: '10 13 00', nameTh: 'ป้ายบอกรายละเอียด', nameEn: 'Directories' },
  { code: '10 14 00', nameTh: 'ป้ายสัญลักษณ์', nameEn: 'Signage' },
  { code: '10 14 43', nameTh: 'แถบเรืองแสงนำทาง', nameEn: 'Photoluminescent Path Marking' },
  { code: '10 21 13', nameTh: 'ผนังกั้นส่วนห้องน้ำ', nameEn: 'Toilet Compartments' },
  {
    code: '10 22 23',
    nameTh: 'ผนังเลื่อนกั้นห้อง',
    nameEn: 'Portable Partitions, Screens, and Panels',
  },
  { code: '10 44 16', nameTh: 'เครื่องดับเพลิงมือถือ', nameEn: 'Portable Fire Extinguisher' },
  { code: '10 51 00', nameTh: 'ตู้ล็อคเกอร์', nameEn: 'Lockers' },
  {
    code: '10 71 13',
    nameTh: 'แผงอุปกรณ์ควบคุมแสงแดดภายนอกอาคาร',
    nameEn: 'Exterior Sun Control Devices',
  },

  // Division 11 — Equipment
  { code: '11 00 00', nameTh: 'อุปกรณ์', nameEn: 'Equipment' },
  { code: '11 68 13', nameTh: 'พื้นยางสนามเด็กเล่น', nameEn: 'Playground Equipment' },

  // Division 12 — Furnishings
  { code: '12 00 00', nameTh: 'เครื่องตกแต่ง', nameEn: 'Furnishings' },
  { code: '12 14 23', nameTh: 'ศิลปะแบบนูน', nameEn: 'Relief' },
  { code: '12 17 00', nameTh: 'ศิลปะกระจก', nameEn: 'Art Glass' },
  { code: '12 22 00', nameTh: 'ม่านจีบ', nameEn: 'Curtains & Drapes' },
  { code: '12 28 00', nameTh: 'อุปกรณ์ประกอบ', nameEn: 'Toilet, Bath, and Laundry Accessories' },
  {
    code: '12 36 23.13',
    nameTh: 'เคาน์เตอร์หุ้มพลาสติกลามิเนท',
    nameEn: 'Plastic-Laminate-Clad Countertop',
  },
  { code: '12 36 40', nameTh: 'เคาน์เตอร์หิน', nameEn: 'Stone Countertop' },
  { code: '12 36 61', nameTh: 'เคาน์เตอร์หินเทียม', nameEn: 'Simulated Stone Countertop' },
  { code: '12 51 19', nameTh: 'ตู้ใส่ของ', nameEn: 'Filing Cabinets' },
  { code: '12 51 23', nameTh: 'โต๊ะสำนักงาน', nameEn: 'Office Tables' },
  { code: '12 52 13', nameTh: 'เก้าอี้', nameEn: 'Chairs' },
  { code: '12 52 83', nameTh: 'ที่นั่งสั่งผลิต', nameEn: 'Custom Seating' },
  { code: '12 60 00', nameTh: 'ที่นั่งแบบแถวเรียง', nameEn: 'Multiple Seating' },
  { code: '12 92 13', nameTh: 'ต้นไม้ประดิษฐ์', nameEn: 'Interior Artificial Plants' },
  { code: '12 92 33', nameTh: 'กระถางต้นไม้', nameEn: 'Interior Planters' },
  {
    code: '12 92 43',
    nameTh: 'อุปกรณ์สำหรับงานสวนภายใน',
    nameEn: 'Interior Landscape Accessories',
  },
  { code: '12 93 33', nameTh: 'กระถางสำเร็จรูป', nameEn: 'Manufactured Planters' },

  // Division 14 — Conveying Equipment
  { code: '14 00 00', nameTh: 'งานระบบอุปกรณ์ลำเลียง', nameEn: 'Conveying Equipment' },
  { code: '14 20 00', nameTh: 'ลิฟต์', nameEn: 'Elevators' },
  { code: '14 31 00', nameTh: 'บันไดเลื่อน', nameEn: 'Escalators' },
  { code: '14 32 00', nameTh: 'ทางเลื่อนอัตโนมัติ', nameEn: 'Moving Walks' },

  // Division 21 — Fire Suppression
  { code: '21 00 00', nameTh: 'ระบบป้องกันเพลิงไหม้', nameEn: 'Fire Suppression' },
  {
    code: '21 11 00',
    nameTh: 'สิ่งอำนวยความสะดวกของระบบดับเพลิง',
    nameEn: 'Facility Fire-Suppression Water-Service Piping',
  },
  { code: '21 12 00', nameTh: 'ท่อยืนในระบบดับเพลิง', nameEn: 'Fire-Suppression Stanpipes' },
  {
    code: '21 13 13',
    nameTh: 'ระบบดับเพลิงสปริงเกลอร์แบบท่อเปียก',
    nameEn: 'Wet-Pipe Sprinkler Systems',
  },
  {
    code: '21 16 00',
    nameTh: 'เครื่องสูบน้ำรักษาแรงดัน',
    nameEn: 'Fire Suppression Pressure Maintenance Pumps',
  },
  {
    code: '21 22 00',
    nameTh: 'ระบบดับเพลิงสารสะอาด',
    nameEn: 'Clean-Agent Fire Extinguishing Systems',
  },
  {
    code: '21 23 00',
    nameTh: 'ระบบดับเพลิงแบบสารเคมีเปียก',
    nameEn: 'Wet Chemical Fire-Extinguising Systems',
  },
  {
    code: '21 31 13',
    nameTh: 'เครื่องสูบน้ำดับเพลิงแบบหอยโข่งขับด้วยไฟฟ้า',
    nameEn: 'Electric-Drive, Vertical- Turbine Fire Pumps',
  },
  {
    code: '21 31 16',
    nameTh: 'เครื่องสูบน้ำดับเพลิงแบบแนวตั้งขับด้วยเครื่องยนต์ดีเซล',
    nameEn: 'Electric-Drive, Vertical-Turbine Fire Pumps',
  },
  {
    code: '21 32 13',
    nameTh: 'เครื่องสูบน้ำดับเพลิงแบบแนวตั้งขับด้วยไฟฟ้า',
    nameEn: 'Electric-Drive, Vertical- Turbine Fire Pumps',
  },
  {
    code: '21 32 16',
    nameTh: 'เครื่องสูบน้ำดับเพลิงแบบแนวตั้งขับด้วยเครื่องยนต์ดีเซล',
    nameEn: 'Electric-Drive, Vertical-Turbine Fire Pumps',
  },

  // Division 22 — Plumbing
  { code: '22 00 00', nameTh: 'ระบบประปาและสุขาภิบาล', nameEn: 'Plumbing' },
  { code: '22 08 00', nameTh: 'การทดสอบงานระบบประปาสุขาภิบาล', nameEn: 'Comissioning of Plumbing' },
  { code: '22 11 16', nameTh: 'ท่อจ่ายน้ำประปา', nameEn: 'Domestic Water Pipe' },
  {
    code: '22 11 19',
    nameTh: 'อุปกรณ์ประกอบท่อจ่ายน้ำประปา',
    nameEn: 'Domestic Water Piping Specialties',
  },
  { code: '22 11 23', nameTh: 'เครื่องสูบน้ำระบบประปา', nameEn: 'Domestic Water Pump' },
  { code: '22 13 16', nameTh: 'ท่อสุขาภิบาล', nameEn: 'Sanitary Waste and Vent Pipe' },
  {
    code: '22 13 19',
    nameTh: 'อุปกรณ์ประกอบระบบท่อสุขาภิบาล',
    nameEn: 'Sanitary Waste Piping Speciaties',
  },
  { code: '22 13 29', nameTh: 'เครื่องสูบน้ำระบบสุขาภิบาล', nameEn: 'Sanitary Sewerage Pump' },
  { code: '22 14 16', nameTh: 'ท่อระบายน้ำฝน', nameEn: 'Rainwater Leaders' },
  {
    code: '22 14 26',
    nameTh: 'สิ่งอำนวยความสะดวกด้านการระบายน้ำฝน',
    nameEn: 'Facility Storm Drains',
  },

  // Division 23 — Heating, Ventilating and Air Conditioning (HVAC)
  {
    code: '23 00 00',
    nameTh: 'ระบบปรับอากาศและระบายอากาศ',
    nameEn: 'Heating, Ventilating and Air Conditioning (HVAC)',
  },
  { code: '23 07 13', nameTh: 'ฉนวนท่อลม', nameEn: 'Duct Insulation' },
  { code: '23 07 19', nameTh: 'ฉนวนท่อระบบปรับอากาศ', nameEn: 'Hvac Piping Insulation' },
  { code: '23 08 00', nameTh: 'การทดสอบการทำงานของระบบ', nameEn: 'Commissioning of Hvac' },
  { code: '23 09 00', nameTh: 'เครื่องมือและอุปกรณ์ควมคุมระบบ', nameEn: '' },
  { code: '23 21 00', nameTh: 'ท่อน้ำ', nameEn: 'Hydronic Piping' },
  { code: '23 23 00', nameTh: 'ท่อน้ำยา', nameEn: 'Refrigerant Piping' },
  { code: '23 31 00', nameTh: 'ระบบท่อลม', nameEn: 'HVAC Ducts and Casings' },
  { code: '23 33 00', nameTh: 'อุปกรณ์ภายในท่อลม', nameEn: 'Air Duct Accessories' },
  {
    code: '23 33 14',
    nameTh: 'ชุดแผ่นปรับลมสำหรับการระบายอากาศในอุโมงค์',
    nameEn: 'Tunnel Ventilation Damper Units',
  },
  { code: '23 33 19', nameTh: 'อุปกรณ์ลดเสียง', nameEn: 'Sound Attenuators & Others' },
  { code: '23 34 00', nameTh: 'พัดลมระบายอากาศ', nameEn: 'HVAC FANS' },
  { code: '23 34 21', nameTh: 'พัดลมระบายอากาศในอุโมงค์', nameEn: 'Tunnel Ventilation Fans' },
  { code: '23 35 19', nameTh: 'ระบบระบายควัน', nameEn: 'Smoke Exhaust System' },
  { code: '23 35 20', nameTh: 'ระบบพัดลมอัดอากาศ', nameEn: 'Air Pressurized System' },
  { code: '23 37 00', nameTh: 'อุปกรณ์จ่ายลม', nameEn: 'Air Outlets and Inlets' },
  { code: '23 37 24', nameTh: 'เกล็ดระบายลมชนิดกันฝน', nameEn: 'Wind Driven Rain Louvers' },
  { code: '23 41 00', nameTh: 'แผ่นกรองอากาศ', nameEn: 'Particulate Air Filtration' },
  { code: '23 43 00', nameTh: 'เครื่องทำความสะอาดอากาศด้วยอิเล็กทรอนิกส์', nameEn: '' },
  {
    code: '23 72 00',
    nameTh: 'อุปกรณ์แลกเปลี่ยนพลังงาน',
    nameEn: 'Air-to-Air Energy Recovery Equipment',
  },
  {
    code: '23 73 00',
    nameTh: 'เครื่องส่งลมเย็นภายในอาคาร',
    nameEn: 'Indoor Central-Station Air-Handling Unit',
  },
  { code: '23 82 19', nameTh: 'เครื่องเป่าลมเย็น', nameEn: 'Fan Coil Unit' },

  // Division 26 — Electrical
  { code: '26 00 00', nameTh: 'ระบบไฟฟ้า', nameEn: 'Electrical' },
  {
    code: '26 05 19',
    nameTh: 'ตัวนำและสายไฟฟ้าแรงต่ำ',
    nameEn: 'Low-Voltage Electrical Power Conductor and Cable',
  },
  {
    code: '26 05 26',
    nameTh: 'การต่อลงดินและการต่อฝากทางไฟฟ้า',
    nameEn: 'Grounding and Bonding for Electrical Systems',
  },
  { code: '26 05 33.13', nameTh: 'ท่อร้อยสายไฟ', nameEn: 'Conduit for Electrical Systems' },
  {
    code: '26 05 33.16',
    nameTh: 'กล่องและอุปกรณ์ประกอบสำหรับงานระบบไฟฟ้า',
    nameEn: 'Boxes For Electrical Systms',
  },
  {
    code: '26 05 33.23',
    nameTh: 'ช่องเดินสายโลหะบนพื้นผิว',
    nameEn: 'Surface Raceways for Electrical Systems',
  },
  {
    code: '26 05 36',
    nameTh: 'รางเคเบิลสำหรับการติดตั้งระบบไฟฟ้า',
    nameEn: 'Cable Trays for Electrical Systems',
  },
  { code: '26 09 43.13', nameTh: 'ระบบควบคุมไฟฟ้าแสงสว่างแบบเครือข่ายดิจิตัล', nameEn: '' },
  {
    code: '26 09 43.14',
    nameTh: 'ระบบเครือข่ายสำหรับควบคุมไฟฟ้าแสงสว่างลานจอดอากาศยาน',
    nameEn: 'Apron Lighting Control System',
  },
  {
    code: '26 09 43.15',
    nameTh: 'ระบบแจ้งเตือนภัยในพื้นที่ลานจอดอากาศยาน',
    nameEn: 'Warning System',
  },
  { code: '26 24 13', nameTh: 'แผงตู้ไฟฟ้าหลัก', nameEn: 'Switchboards' },
  { code: '26 24 16', nameTh: 'แผงตู้ไฟฟ้าย่อย', nameEn: 'Panel Boards' },
  { code: '26 25 00', nameTh: 'บัสเวย์', nameEn: 'Busway' },
  { code: '26 17 13', nameTh: 'อุปกรณ์วัดทางระบบไฟฟ้า', nameEn: 'Electric Metering' },
  { code: '26 28 16.13', nameTh: 'เซอร์กิจเบรคเกอร์', nameEn: 'Enclosed Circuit Breakers' },
  { code: '26 28 16.16', nameTh: 'สวิทซ์ตัดวงจรไฟฟ้า', nameEn: 'Enclosed Switches' },
  {
    code: '26 32 13.13',
    nameTh: 'เครื่องกำเนิดไฟฟ้าชนิดเครื่องยนต์ดีเซล',
    nameEn: 'Diesel Engine Driven Generator Sets',
  },
  {
    code: '26 32 33',
    nameTh: 'เครื่องกำเนิดไฟฟ้าชนิดต่อเนื่องแบบหมุนรอบ',
    nameEn: 'Rotary Uninptible Power Unit',
  },
  { code: '26 33 13', nameTh: 'แบตเตอรี่', nameEn: 'Batteries' },
  {
    code: '26 33 53',
    nameTh: 'แหล่งจ่ายไฟแบบต่อเนื่อง',
    nameEn: 'Static Uninterruptible Power Supply',
  },
  {
    code: '26 35 13',
    nameTh: 'คาปาซิเตอร์ และระบบควบคุมอัตโนมัติ',
    nameEn: 'Capacitor And Power Factor Controller',
  },
  {
    code: '26 36 23',
    nameTh: 'สวิตซ์ถ่ายโอนชนิดทำงานอัตโนมัติ',
    nameEn: 'Automatic Transfer Switches',
  },
  {
    code: '26 41 13.13',
    nameTh: 'ระบบการต่อลงดินและป้องกันฟ้าผ่า',
    nameEn: 'Grounding and Lightning Protection',
  },
  {
    code: '26 41 13.14',
    nameTh: 'จุดต่อกราวด์สำหรับอากาศยาน',
    nameEn: 'Aircraft Ground Receptacle',
  },
  {
    code: '26 43 13',
    nameTh: 'อุปกรณ์ป้องกันเสิร์จสำหรับระบบไฟฟ้าแรงต่ำ',
    nameEn: 'Surge Protection Devices for Low Voltage Electrical Power',
  },
  {
    code: '26 51 13',
    nameTh: 'โคมไฟฟ้าแสงสว่างและอุปกรณ์ประกอบ สวิตช์ และเต้ารับ',
    nameEn: 'Lighting Fixtures Switch and Receptacle',
  },
  { code: '26 52 00', nameTh: 'ระบบไฟฟ้าแสงสว่างฉุกเฉิน', nameEn: 'Emergency Light' },
  { code: '26 53 00', nameTh: 'ระบบป้ายทางออกฉุกเฉิน', nameEn: 'Exit Sign' },
  { code: '26 56 23', nameTh: 'ระบบไฟฟ้าส่องสว่างพื้นที่', nameEn: 'Area Lighting' },
  { code: '26 60 00', nameTh: 'ระบบจัดเก็บค่าการใช้พลังงานไฟฟ้า', nameEn: 'Energy Billing System' },
  {
    code: '26 70 00',
    nameTh: 'ระบบบริหารจัดการอาคาร',
    nameEn: 'Building Management System (BMS)',
  },
  { code: '26 80 00', nameTh: 'ระบบตรวจสอบและวิเคราะห์ข้อมูล', nameEn: 'SCADA' },

  // Division 27 — Communications
  { code: '27 00 00', nameTh: 'ระบบสื่อสาร', nameEn: 'Communications' },
  { code: '27 10 00', nameTh: 'ระบบข่ายสายสัญญาณ', nameEn: 'Structure Cabling System' },
  { code: '27 21 00', nameTh: 'ระบบเครือข่ายสื่อสาร', nameEn: 'Gigabit Ethernet Network' },
  { code: '27 32 13', nameTh: 'ระบบโทรศัพท์แบบไอพี', nameEn: 'IP Telephone System' },
  { code: '27 32 43', nameTh: 'ระบบวิทยุสื่อสาร', nameEn: 'Trunk Radio System' },
  {
    code: '27 42 10',
    nameTh: 'ระบบแสดงข้อมูลตารางการบิน',
    nameEn: 'Flight Information Display System: FIDS',
  },
  { code: '21 51 16', nameTh: 'ระบบเสียงประกาศ', nameEn: 'Public Address System (PAS)' },
  { code: '27 53 13', nameTh: 'ระบบมาตรฐานสัญญาณนาฬิกา', nameEn: 'Master Clock System' },
  {
    code: '27 54 00',
    nameTh: 'ระบบกระจายสัญญาณโทรทัศน์แบบโครงข่าย',
    nameEn: 'Internet Protocol Television System (IPTV)',
  },

  // Division 28 — Electronic Safety and Security
  {
    code: '28 00 00',
    nameTh: 'ระบบความมั่นคงและความปลอดภัยอิเล็กทรอนิกส์',
    nameEn: 'Electronic Safety and Security',
  },
  {
    code: '28 13 00',
    nameTh: 'ระบบควบคุมการเข้าออก',
    nameEn: 'Controlled Access Security System (CASS)',
  },
  {
    code: '28 13 10',
    nameTh: 'ระบบควบคุมการเข้าออกสำหรับอุโมงค์',
    nameEn: 'Controlled Access Security System for Tunnel (CASS)',
  },
  {
    code: '28 20 00',
    nameTh: 'ระบบกล้องโทรทัศน์วงจรปิด',
    nameEn: 'Closed Circuit Television System (CCTV)',
  },
  {
    code: '28 20 10',
    nameTh: 'ระบบกล้องโทรทัศน์วงจรปิดในอุโมงค์',
    nameEn: 'Closed Circuit Television System for Tunnel (CCTV)',
  },
  {
    code: '28 31 00',
    nameTh: 'ระบบแจ้งเหตุเพลิงไหม้',
    nameEn: 'Fire Detection and Alarm System, FDAS',
  },
  {
    code: '28 50 00',
    nameTh: 'ระบบบริหารการรักษาความปลอดภัย',
    nameEn: 'Security Management System (SMS)',
  },

  // Division 31 — Earth Work
  { code: '31 00 00', nameTh: 'งานดิน', nameEn: 'Earth Work' },
  { code: '31 01 20', nameTh: 'งานขุดดินและถมดิน', nameEn: '' },
  { code: '31 11 00', nameTh: 'งานรื้อถอนและเตรียมพื้นที่', nameEn: '' },
  { code: '31 31 00', nameTh: 'ระบบป้องกันการพังทลายของดิน', nameEn: '' },
  { code: '31 62 13', nameTh: 'งานเสาเข็มตอก', nameEn: '' },
  { code: '31 63 00', nameTh: 'งานเสาเข็มเจาะ', nameEn: '' },
  { code: '31 63 23.13', nameTh: 'งานกําแพงกันดินชนิดขุดหล่อในที่', nameEn: '' },

  // Division 32 — Exterior Improvements
  { code: '32 00 00', nameTh: 'งานปรับปรุงพื้นที่ภายนอก', nameEn: 'Exterior Improvements' },
  { code: '32 84 00', nameTh: 'ระบบชลประทานเพื่อการเพาะปลูก', nameEn: 'Planting Irrigation' },
  { code: '32 90 00', nameTh: 'การเพาะปลูก', nameEn: 'Planting' },
  { code: '32 91 00', nameTh: 'งานเตรียมการเพาะปลูก', nameEn: 'Planting Preparation' },
  { code: '32 91 13', nameTh: 'งานเตรียมดิน', nameEn: 'Soil Preparation' },

  // Division 34 — Transportation
  { code: '34 00 00', nameTh: 'การขนส่ง', nameEn: 'Transportation' },
  { code: '34 77 13', nameTh: 'สะพานเทียบอากาศยาน PBB', nameEn: '' },
  { code: '34 77 33', nameTh: 'กระบวนการตรวจค้นอาวุธและวัตถุระเบิดสำหรับสัมภาระ HBSS', nameEn: '' },
  { code: '34 77 39', nameTh: '', nameEn: 'Baggage Handling System' },
  { code: '34 77 43', nameTh: 'งานระบบปรับอากาศสำหรับอากาศยาน PCA', nameEn: '' },
  { code: '34 77 53', nameTh: 'งานระบบกำลังไฟฟ้าภาคพื้น 400 Hz GPU', nameEn: '' },
  { code: '34 77 63', nameTh: 'งานระบบนำร่องอากาศยานเข้าจอด VDGS', nameEn: '' },
]

/** Human-readable label for a CSI entry: "CODE — Thai (English)", degrading gracefully when either name is blank. */
export function formatCsiEntry(entry: CsiMasterFormatEntry): string {
  if (entry.nameTh && entry.nameEn) return `${entry.code} — ${entry.nameTh} (${entry.nameEn})`
  if (entry.nameTh) return `${entry.code} — ${entry.nameTh}`
  if (entry.nameEn) return `${entry.code} — ${entry.nameEn}`
  return entry.code
}

export function findCsiEntry(code: string | undefined): CsiMasterFormatEntry | undefined {
  if (!code) return undefined
  return CSI_MASTER_FORMAT.find((e) => e.code === code)
}

export interface CsiDivisionGroup {
  division: string
  label: string
  entries: CsiMasterFormatEntry[]
}

/** Groups entries by their 2-digit division prefix for use in a grouped <Select>. */
export function groupCsiByDivision(entries: CsiMasterFormatEntry[]): CsiDivisionGroup[] {
  const groups = new Map<string, CsiMasterFormatEntry[]>()
  for (const entry of entries) {
    const division = entry.code.slice(0, 2)
    const list = groups.get(division)
    if (list) list.push(entry)
    else groups.set(division, [entry])
  }
  return Array.from(groups.entries()).map(([division, groupEntries]) => {
    const root = groupEntries.find((e) => e.code === `${division} 00 00`)
    const label = root ? `${division} — ${root.nameEn || root.nameTh}` : `Division ${division}`
    return { division, label, entries: groupEntries }
  })
}
