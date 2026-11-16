import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  College,
  Branch,
  Course,
  EligibilityRule,
  FeeStructure,
  KnowledgeNode,
  User,
  Student
} from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adminator_demo';

export const seedDatabase = async () => {
  console.log(`[Seed] Connecting to database: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  console.log('[Seed] Ensuring idempotent demo catalog...');

  // 1. Seed Colleges
  const collegesData = [
    {
      code: 'DRIEMS',
      name: 'DRIEMS Polytechnic (Autonomous)',
      district: 'Cuttack',
      state: 'Odisha',
      address: { street: 'DRIEMS Enclave, Kairapari, Kotsahi, Tangi', city: 'Cuttack', pinCode: '754022' },
      contactEmail: 'admissions@driems.ac.in',
      contactPhone: '0671-2595061',
      facilities: ['Autonomous Polytechnic Campus', 'Modern Engineering Workshops', 'Digital Library & Seminar Halls', 'Hostel Facilities (Boys & Girls)', 'Dedicated Placement Cell', 'Wi-Fi & Sports Complex'],
      isDemo: true,
      isDefault: true,
      demoNotice: '[CONFIGURABLE DEMO PORTAL FOR DRIEMS POLYTECHNIC (AUTONOMOUS) - NOT OFFICIAL ADMISSION SITE]',
      isActive: true
    },
    {
      code: 'KIPT',
      name: 'Kalinga Institute of Polytechnic & Technology (Demo)',
      district: 'Khordha',
      state: 'Odisha',
      address: { street: 'Plot 104, Infocity Avenue, Patia', city: 'Bhubaneswar', pinCode: '751024' },
      contactEmail: 'admissions-demo@kipt.ac.in',
      contactPhone: '9876500001',
      facilities: ['Boys Hostel (300 beds)', 'Girls Hostel (200 beds)', 'CAD/CAM Lab', 'Wi-Fi Campus', 'Bus Service (12 Routes)'],
      isDemo: true,
      isDefault: false,
      demoNotice: '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
      isActive: true
    },
    {
      code: 'UPP',
      name: 'Utkal Premier Polytechnic (Demo)',
      district: 'Cuttack',
      state: 'Odisha',
      address: { street: 'Sector 9, CDA', city: 'Cuttack', pinCode: '753014' },
      contactEmail: 'admissions-demo@upp.ac.in',
      contactPhone: '9876500002',
      facilities: ['Boys Hostel (250 beds)', 'Central CNC Workshop', 'Digital Library', 'Playground'],
      isDemo: true,
      isDefault: false,
      demoNotice: '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
      isActive: true
    },
    {
      code: 'MIET',
      name: 'Mayurbhanj Institute of Engineering & Technology (Demo)',
      district: 'Mayurbhanj',
      state: 'Odisha',
      address: { street: 'Baripada Bypass Road', city: 'Baripada', pinCode: '757001' },
      contactEmail: 'admissions-demo@miet.ac.in',
      contactPhone: '9876500003',
      facilities: ['Boys & Girls Hostels', 'Solar Energy Lab', 'Tribal Student Mentorship Cell', 'Bus Facility'],
      isDemo: true,
      isDefault: false,
      demoNotice: '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]',
      isActive: true
    }
  ];

  const collegeMap = {};
  for (const cData of collegesData) {
    const col = await College.findOneAndUpdate(
      { code: cData.code },
      { $set: cData },
      { upsert: true, new: true }
    );
    collegeMap[cData.code] = col;
  }
  console.log(`[Seed] Seeded ${Object.keys(collegeMap).length} Colleges.`);

  // 2. Seed Branches
  const branchesData = [
    {
      code: 'MECH',
      name: { en: 'Mechanical Engineering', or: 'ମେକାନିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ', hi: 'मैकेनिकल इंजीनियरिंग' },
      description: {
        en: 'Design, manufacturing, and maintenance of mechanical systems and thermal machinery.',
        or: 'ଯନ୍ତ୍ରପାତି ନିର୍ମାଣ, ଡିଜାଇନ୍ ଏବଂ ରକ୍ଷଣାବେକ୍ଷଣ ସମ୍ବନ୍ଧୀୟ ଇଞ୍ଜିନିୟରିଂ।',
        hi: 'यांत्रिक प्रणालियों, विनिर्माण और थर्मल मशीनरी का डिजाइन और रखरखाव।'
      },
      careerProspects: ['Junior Engineer', 'CAD Drafter', 'Production Supervisor', 'Quality Inspector']
    },
    {
      code: 'CIVIL',
      name: { en: 'Civil Engineering', or: 'ସିଭିଲ୍ ଇଞ୍ଜିନିୟରିଂ', hi: 'सिविल इंजीनियरिंग' },
      description: {
        en: 'Planning, structural design, and construction of buildings, roads, and bridges.',
        or: 'ରାସ୍ତା, ପୋଲ, କୋଠାବାଡ଼ି ଏବଂ ଭିତ୍ତିଭୂମି ନିର୍ମାଣ ସମ୍ବନ୍ଧୀୟ ଇଞ୍ଜିନିୟରିଂ।',
        hi: 'भवनों, सड़कों और पुलों का नियोजन, संरचनात्मक डिजाइन और निर्माण।'
      },
      careerProspects: ['Site Engineer', 'Survey Assistant', 'Structural Drafter', 'Cost Estimator']
    },
    {
      code: 'CSE',
      name: { en: 'Computer Science & Engineering', or: 'କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ ଏବଂ ଇଞ୍ଜିନିୟରିଂ', hi: 'कंप्यूटर साइंस एंड इंजीनियरिंग' },
      description: {
        en: 'Software development, networking, web systems, and computational algorithms.',
        or: 'ସଫ୍ଟୱେୟାର୍ ବିକାଶ, ନେଟୱାର୍କିଂ ଏବଂ ୱେବ୍ ସିଷ୍ଟମ୍ ସମ୍ବନ୍ଧୀୟ ଶିକ୍ଷା।',
        hi: 'सॉफ्टवेयर विकास, नेटवर्किंग, वेब सिस्टम और कंप्यूटेशनल एल्गोरिदम।'
      },
      careerProspects: ['Junior Software Developer', 'Network Support Engineer', 'Web Designer', 'Database Operator']
    },
    {
      code: 'EE',
      name: { en: 'Electrical Engineering', or: 'ଇଲେକ୍ଟ୍ରିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ', hi: 'इलेक्ट्रिकल इंजीनियरिंग' },
      description: {
        en: 'Power generation, electrical distribution, substation grids, and motor drives.',
        or: 'ବିଦ୍ୟୁତ୍ ଉତ୍ପାଦନ, ବିତରଣ ଏବଂ ସବଷ୍ଟେସନ୍ ସମ୍ବନ୍ଧୀୟ ଇଞ୍ଜିନିୟରିଂ।',
        hi: 'विद्युत उत्पादन, वितरण ग्रिड, सबस्टेशन और विद्युत मोटरों का अध्ययन।'
      },
      careerProspects: ['Substation Operator', 'Power Grid Technician', 'Electrical Maintenance Supervisor']
    },
    {
      code: 'ETC',
      name: { en: 'Electronics & Telecommunication', or: 'ଇଲେକ୍ଟ୍ରୋନିକ୍ସ ଏବଂ ଟେଲିକମ୍ୟୁନିକେସନ୍', hi: 'इलेक्ट्रॉनिक्स एंड टेलीकम्युनिकेशन' },
      description: {
        en: 'Communication circuits, wireless telecom towers, IoT hardware, and digital chips.',
        or: 'ସଞ୍ଚାର ସର୍କିଟ୍, ବେତାର ଟେଲିକମ୍ ଏବଂ ଡିଜିଟାଲ୍ ଚିପ୍ ସମ୍ବନ୍ଧୀୟ ଶିକ୍ଷା।',
        hi: 'संचार सर्किट, वायरलेस दूरसंचार, आईओटी हार्डवेयर और डिजिटल इलेक्ट्रॉनिक्स।'
      },
      careerProspects: ['Telecom Technician', 'IoT Hardware Assistant', 'PCB Assembly Inspector']
    },
    {
      code: 'AUTO',
      name: { en: 'Automobile Engineering', or: 'ଅଟୋମୋବାଇଲ୍ ଇଞ୍ଜିନିୟରିଂ', hi: 'ऑटोमोबाइल इंजीनियरिंग' },
      description: {
        en: 'Vehicle chassis dynamics, IC & EV powertrain maintenance, and automotive diagnostics.',
        or: 'ଗାଡ଼ି ମୋଟର, ଇଞ୍ଜିନ୍ ଏବଂ ଇଭି (EV) ରକ୍ଷଣାବେକ୍ଷଣ ସମ୍ବନ୍ଧୀୟ ଇଞ୍ଜିନିୟରିଂ।',
        hi: 'वाहन गतिशीलता, पेट्रोल/डीजल और ईवी पावरट्रेन रखरखाव।'
      },
      careerProspects: ['Automotive Service Advisor', 'EV Technician', 'Fleet Maintenance Supervisor']
    }
  ];

  const branchMap = {};
  for (const bData of branchesData) {
    const br = await Branch.findOneAndUpdate(
      { code: bData.code },
      { $set: bData },
      { upsert: true, new: true }
    );
    branchMap[bData.code] = br;
  }
  console.log(`[Seed] Seeded ${Object.keys(branchMap).length} Branches.`);

  // 3. Seed Courses, Rules, and Fees
  const courseSpecs = [
    // DRIEMS Polytechnic (Autonomous) - Primary Default College
    { collegeCode: 'DRIEMS', branchCode: 'MECH', pathway: 'FIRST_YEAR', duration: 3, seats: 120, avail: 48, tuition: 19500, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'MECH', pathway: 'LATERAL_ENTRY', duration: 2, seats: 24, avail: 10, tuition: 19500, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'CSE', pathway: 'FIRST_YEAR', duration: 3, seats: 120, avail: 22, tuition: 21500, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'CSE', pathway: 'LATERAL_ENTRY', duration: 2, seats: 24, avail: 6, tuition: 21500, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'EE', pathway: 'FIRST_YEAR', duration: 3, seats: 90, avail: 34, tuition: 19500, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'EE', pathway: 'LATERAL_ENTRY', duration: 2, seats: 18, avail: 8, tuition: 19500, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'CIVIL', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 28, tuition: 18500, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'CIVIL', pathway: 'LATERAL_ENTRY', duration: 2, seats: 12, avail: 5, tuition: 18500, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'ETC', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 30, tuition: 19000, hostel: 15000 },
    { collegeCode: 'DRIEMS', branchCode: 'AUTO', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 26, tuition: 19000, hostel: 15000 },

    // KIPT
    { collegeCode: 'KIPT', branchCode: 'MECH', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 24, tuition: 19000, hostel: 16000 },
    { collegeCode: 'KIPT', branchCode: 'MECH', pathway: 'LATERAL_ENTRY', duration: 2, seats: 12, avail: 4, tuition: 19000, hostel: 16000 },
    { collegeCode: 'KIPT', branchCode: 'CSE', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 8, tuition: 21000, hostel: 16000 },
    { collegeCode: 'KIPT', branchCode: 'EE', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 18, tuition: 19000, hostel: 16000 },
    { collegeCode: 'KIPT', branchCode: 'CIVIL', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 32, tuition: 18000, hostel: 16000 },
    // UPP
    { collegeCode: 'UPP', branchCode: 'CIVIL', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 30, tuition: 17500, hostel: 14000 },
    { collegeCode: 'UPP', branchCode: 'MECH', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 15, tuition: 17500, hostel: 14000 },
    { collegeCode: 'UPP', branchCode: 'ETC', pathway: 'FIRST_YEAR', duration: 3, seats: 45, avail: 22, tuition: 18500, hostel: 14000 },
    { collegeCode: 'UPP', branchCode: 'EE', pathway: 'LATERAL_ENTRY', duration: 2, seats: 12, avail: 6, tuition: 17500, hostel: 14000 },
    // MIET
    { collegeCode: 'MIET', branchCode: 'MECH', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 35, tuition: 14000, hostel: 12000 },
    { collegeCode: 'MIET', branchCode: 'AUTO', pathway: 'FIRST_YEAR', duration: 3, seats: 45, avail: 28, tuition: 14000, hostel: 12000 },
    { collegeCode: 'MIET', branchCode: 'CIVIL', pathway: 'FIRST_YEAR', duration: 3, seats: 60, avail: 20, tuition: 14000, hostel: 12000 }
  ];

  let coursesCount = 0;
  for (const cs of courseSpecs) {
    const col = collegeMap[cs.collegeCode];
    const br = branchMap[cs.branchCode];

    const course = await Course.findOneAndUpdate(
      { collegeId: col._id, branchCode: cs.branchCode, pathway: cs.pathway },
      {
        $set: {
          collegeId: col._id,
          branchId: br._id,
          branchCode: cs.branchCode,
          pathway: cs.pathway,
          durationYears: cs.duration,
          totalSeats: cs.seats,
          availableSeats: cs.avail,
          isDemo: true
        }
      },
      { upsert: true, new: true }
    );
    coursesCount++;

    // Eligibility Rule
    const itiTradesMap = {
      MECH: ['FITTER', 'TURNER', 'MACHINIST', 'WELDER', 'MECHANIC_MOTOR_VEHICLE'],
      CIVIL: ['DRAUGHTSMAN_CIVIL', 'SURVEYOR'],
      CSE: ['COPA', 'INFORMATION_TECHNOLOGY'],
      EE: ['ELECTRICIAN', 'WIREMAN'],
      ETC: ['ELECTRONIC_MECHANIC', 'INSTRUMENT_MECHANIC'],
      AUTO: ['MECHANIC_MOTOR_VEHICLE', 'DIESEL_MECHANIC', 'FITTER']
    };

    await EligibilityRule.findOneAndUpdate(
      { collegeId: col._id, courseId: course._id, pathway: cs.pathway },
      {
        $set: {
          collegeId: col._id,
          courseId: course._id,
          branchCode: cs.branchCode,
          pathway: cs.pathway,
          minPercentageGeneral: cs.pathway === 'FIRST_YEAR' ? 35.0 : 35.0,
          minPercentageReserved: cs.pathway === 'FIRST_YEAR' ? 30.0 : 30.0,
          mandatorySubjects: cs.pathway === 'FIRST_YEAR' ? ['MATHEMATICS', 'SCIENCE'] : ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'],
          eligibleItiTrades: cs.pathway === 'LATERAL_ENTRY' ? (itiTradesMap[cs.branchCode] || []) : [],
          minAgeYears: 14,
          maxAgeYears: null,
          ruleVersion: '2025.1',
          isDemo: true
        }
      },
      { upsert: true, new: true }
    );

    // Fee Structure
    await FeeStructure.findOneAndUpdate(
      { collegeId: col._id, courseId: course._id, academicYear: '2025-26' },
      {
        $set: {
          collegeId: col._id,
          courseId: course._id,
          branchCode: cs.branchCode,
          academicYear: '2025-26',
          tuitionFeePerSemester: cs.tuition,
          admissionFeeOneTime: 3000,
          labWorkshopFeePerYear: 4000,
          hostelFeePerSemester: cs.hostel,
          scholarshipsAvailable: [
            {
              name: 'Merit Waiver Demo',
              waiverAmount: '25% Tuition Fee Waiver',
              criteria: 'Secured >80% in qualifying 10th/12th exam'
            },
            {
              name: 'Prerana Post-Matric SC/ST Waiver Demo',
              waiverAmount: 'Up to 100% Tuition Waiver as per state guidelines',
              criteria: 'Valid SC/ST caste & resident certificate in Odisha'
            },
            {
              name: 'Girl Child Technical Education Incentive Demo',
              waiverAmount: '₹5,000 Annual Fee Waiver',
              criteria: 'Female candidates enrolled in polytechnic diploma'
            }
          ],
          sampleFeeDisclaimer: '[SAMPLE FEE STRUCTURE - FOR DEMO ONLY - NOT AN OFFICIAL INVOICE]',
          isDemo: true
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log(`[Seed] Seeded ${coursesCount} Courses with matching Eligibility Rules and Fee Structures.`);

  // 4. Seed Multilingual Knowledge Nodes (FAQs)
  const faqsData = [
    {
      category: 'HOSTEL',
      question: {
        en: 'Are hostel facilities available for polytechnic diploma students?',
        or: 'ଡିପ୍ଲୋମା ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ହଷ୍ଟେଲ ସୁବିଧା ଅଛି କି?',
        hi: 'क्या डिप्लोमा छात्रों के लिए हॉस्टल की सुविधा उपलब्ध है?'
      },
      answer: {
        en: 'Yes, demo colleges like KIPT and MIET offer separate boys and girls hostels with 24/7 security, Wi-Fi, and mess facilities (approx ₹14,000 to ₹16,000 per semester).',
        or: 'ହଁ, KIPT ଏବଂ MIET ଭଳି ଡେମୋ କଲେଜଗୁଡ଼ିକରେ ଛାତ୍ର ଏବଂ ଛାତ୍ରୀମାନଙ୍କ ପାଇଁ ପୃଥକ ହଷ୍ଟେଲ, ମେସ୍ ଏବଂ ନିରାପତ୍ତା ସୁବିଧା ଉପଲବ୍ଧ ଅଛି (ସେମିଷ୍ଟାର ପିଛା ପ୍ରାୟ ₹୧୪,୦୦୦ ରୁ ₹୧୬,୦୦୦)।',
        hi: 'हाँ, KIPT और MIET जैसे डेमो कॉलेजों में छात्रों और छात्राओं के लिए अलग-अलग हॉस्टल, मेस और 24/7 सुरक्षा उपलब्ध है (लगभग ₹14,000 से ₹16,000 प्रति सेमेस्टर)।'
      },
      tags: ['hostel', 'boarding', 'food', 'mess', 'ହଷ୍ଟେଲ', 'हॉस्टल']
    },
    {
      category: 'LATERAL_ENTRY',
      question: {
        en: 'How does Lateral Entry admission work for ITI and 12th Science students?',
        or: 'ITI ଏବଂ ୧୨ଶ ବିଜ୍ଞାନ ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ ଲାଟେରାଲ ଏଣ୍ଟ୍ରି କିପରି ହୁଏ?',
        hi: 'आईटीआई और 12वीं साइंस के छात्रों के लिए लेटरल एंट्री कैसे काम करती है?'
      },
      answer: {
        en: 'Students passing a 2-year ITI trade or 12th Science (PCM) can directly enter the 2nd Year (3rd Semester) of a 3-year diploma, completing it in 2 years.',
        or: '୨-ବର୍ଷିଆ ITI କିମ୍ବା ୧୨ଶ ବିଜ୍ଞାନ (PCM) ପାସ୍ କରିଥିବା ଛାତ୍ରଛାତ୍ରୀ ସିଧାସଳଖ ଦ୍ୱିତୀୟ ବର୍ଷ (୩ୟ ସେମିଷ୍ଟାର) ରେ ନାମ ଲେଖାଇ ପାରିବେ ଏବଂ ୨ ବର୍ଷରେ ଡିପ୍ଲୋମା ସମ୍ପୂର୍ଣ୍ଣ କରିବେ।',
        hi: '2 वर्षीय आईटीआई या 12वीं साइंस (PCM) उत्तीर्ण छात्र सीधे द्वितीय वर्ष (तीसरे सेमेस्टर) में प्रवेश ले सकते हैं और 2 वर्षों में डिप्लोमा पूरा कर सकते हैं।'
      },
      tags: ['lateral', 'iti', '12th', 'direct', 'ଲାଟେରାଲ', 'लेटरल']
    },
    {
      category: 'DOCUMENTS',
      question: {
        en: 'What documents are required for diploma admission verification?',
        or: 'ଡିପ୍ଲୋମା ନାମଲେଖା ପାଇଁ କେଉଁ କାଗଜପତ୍ର ଆବଶ୍ୟକ?',
        hi: 'डिप्लोमा प्रवेश के लिए कौन से दस्तावेज आवश्यक हैं?'
      },
      answer: {
        en: '10th Marksheet/Pass Certificate, SLC/CLC, Conduct Certificate, Resident/Nativity Certificate, Caste Certificate (if applicable), and Passport Photos.',
        or: '୧୦ମ ମାର୍କସିଟ୍/ପାସ୍ ସାର୍ଟିଫିକେଟ୍, ସ୍କୁଲ ଲିଭିଂ ସାର୍ଟିଫିକେଟ୍ (SLC), ଆଚରଣ ପ୍ରମାଣପତ୍ର, ବାସିନ୍ଦା ପ୍ରମାଣପତ୍ର, ଏବଂ ଜାତି ପ୍ରମାଣପତ୍ର (ଯଦି ଲାଗୁ ହୁଏ)।',
        hi: '10वीं की अंकतालिका, स्कूल लीविंग सर्टिफिकेट (SLC), चरित्र प्रमाण पत्र, निवास प्रमाण पत्र, जाति प्रमाण पत्र (यदि लागू हो) और पासपोर्ट फोटो।'
      },
      tags: ['documents', 'certificates', 'marksheet', 'କାଗଜପତ୍ର', 'दस्तावेज']
    },
    {
      category: 'SCHOLARSHIP',
      question: {
        en: 'What scholarships or fee waivers are available for diploma students?',
        or: 'ଡିପ୍ଲୋମା ଛାତ୍ରଛାତ୍ରୀଙ୍କ ପାଇଁ କେଉଁ ସ୍କଲାରସିପ୍ ଉପଲବ୍ଧ?',
        hi: 'डिप्लोमा छात्रों के लिए कौन सी छात्रवृत्ति या फीस छूट उपलब्ध है?'
      },
      answer: {
        en: 'Eligible students can benefit from demo state scholarships such as Prerana Post-Matric SC/ST/OBC assistance, merit waivers (>80%), and girl-child technical incentives.',
        or: 'ଯୋଗ୍ୟ ଛାତ୍ରଛାତ୍ରୀ ପ୍ରେରଣା ପୋଷ୍ଟ-ମାଟ୍ରିକ୍ ସ୍କଲାରସିପ୍ (SC/ST/OBC), ମେରିଟ୍ ଛାଡ଼ (>୮୦%), ଏବଂ କନ୍ୟା ସନ୍ତାନ ପ୍ରୋତ୍ସାହନ ଯୋଜନାର ଲାଭ ପାଇପାରିବେ।',
        hi: 'पात्र छात्र प्रेरणा पोस्ट-मैट्रिक छात्रवृत्ति (SC/ST/OBC), मेरिट छूट (>80%) और बालिका तकनीकी शिक्षा प्रोत्साहन का लाभ उठा सकते हैं।'
      },
      tags: ['scholarship', 'waiver', 'prerana', 'discount', 'ସ୍କଲାରସିପ୍', 'छात्रवृत्ति']
    }
  ];

  for (const faq of faqsData) {
    await KnowledgeNode.findOneAndUpdate(
      { 'question.en': faq.question.en },
      { $set: faq },
      { upsert: true, new: true }
    );
  }
  console.log(`[Seed] Seeded ${faqsData.length} Multilingual Knowledge Nodes.`);

  // 7. Demo Staff Accounts (Explicitly Opt-in, Strictly Blocked in Production)
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldSeedStaff = process.env.SEED_DEMO_STAFF === 'true' && !isProduction;

  if (isProduction) {
    console.log('[Seed Security Invariant] Production environment detected (NODE_ENV=production). Default demo staff accounts will NOT be seeded.');
  } else if (!shouldSeedStaff) {
    console.log('[Seed Security Invariant] Demo staff account seeding is disabled by default. To seed demo staff in non-production, set SEED_DEMO_STAFF=true and DEMO_STAFF_PASSWORD=<password>.');
  } else {
    const staffPassword = process.env.DEMO_STAFF_PASSWORD;
    if (!staffPassword || staffPassword.length < 8) {
      console.warn('[Seed Security Warning] SEED_DEMO_STAFF=true is set, but DEMO_STAFF_PASSWORD is missing or shorter than 8 characters. Skipping staff account creation.');
    } else {
      console.log('[Seed] Seeding opt-in demo staff accounts with provided DEMO_STAFF_PASSWORD...');
      const driemsCollege = collegeMap['DRIEMS'];
      const kiptCollege = collegeMap['KIPT'];
      const uppCollege = collegeMap['UPP'];

      const hashedPassword = await User.hashPassword(staffPassword);

      const staffUsersData = [
        {
          name: 'Dr. Subhasis Mohapatra (DRIEMS Admin)',
          email: 'admin@driems.ac.in',
          passwordHash: hashedPassword,
          role: 'COLLEGE_ADMIN',
          collegeId: driemsCollege._id,
          phone: '9861000001',
          isActive: true,
          isDemo: true
        },
        {
          name: 'Priyadarshini Mishra (DRIEMS Counsellor)',
          email: 'counsellor@driems.ac.in',
          passwordHash: hashedPassword,
          role: 'COUNSELLOR',
          collegeId: driemsCollege._id,
          phone: '9861000002',
          isActive: true,
          isDemo: true
        },
        {
          name: 'Sunita Mohapatra (Demo Counsellor)',
          email: 'sunita.counsellor@kipt.ac.in',
          passwordHash: hashedPassword,
          role: 'COUNSELLOR',
          collegeId: kiptCollege._id,
          phone: '9861000010',
          isActive: true,
          isDemo: true
        },
        {
          name: 'Pradeep Das (Demo Admin)',
          email: 'admin@kipt.ac.in',
          passwordHash: hashedPassword,
          role: 'COLLEGE_ADMIN',
          collegeId: kiptCollege._id,
          phone: '9861000011',
          isActive: true,
          isDemo: true
        },
        {
          name: 'Bikash Rout (Demo Counsellor)',
          email: 'bikash.counsellor@upp.ac.in',
          passwordHash: hashedPassword,
          role: 'COUNSELLOR',
          collegeId: uppCollege._id,
          phone: '9861000020',
          isActive: true,
          isDemo: true
        },
        {
          name: 'ADMINATOR Platform Super Admin (Demo)',
          email: 'platform.admin@adminator.demo',
          passwordHash: hashedPassword,
          role: 'PLATFORM_ADMIN',
          collegeId: null,
          phone: '9861000099',
          isActive: true,
          isDemo: true
        },
        {
          name: 'Inactive Counsellor (Test Account)',
          email: 'inactive.counsellor@kipt.ac.in',
          passwordHash: hashedPassword,
          role: 'COUNSELLOR',
          collegeId: kiptCollege._id,
          phone: '9861000090',
          isActive: false,
          isDemo: true
        }
      ];

      for (const staff of staffUsersData) {
        await User.findOneAndUpdate(
          { email: staff.email },
          { $set: staff },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
      console.log(`[Seed] Seeded ${staffUsersData.length} Demo Staff User accounts.`);
    }
  }

  console.log('[Seed] Seeding completed successfully!');
  if (process.argv[1]?.includes('demoDataSeeder.js')) {
    await mongoose.disconnect();
  }
};

// Auto-run if executed directly
if (process.argv[1]?.includes('demoDataSeeder.js')) {
  seedDatabase().catch((err) => {
    console.error('[Seed Error] Seeding failed:', err);
    process.exit(1);
  });
}
