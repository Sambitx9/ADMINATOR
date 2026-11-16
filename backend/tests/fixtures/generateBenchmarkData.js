import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to assemble 100 realistic Odia test cases
const generateOdiaCases = () => {
  const cases = [];

  // 1-15: Greetings
  const greetings = [
    { text: 'ନମସ୍କାର', intent: 'GREETING', script: 'NATIVE_ODIA' },
    { text: 'ନମସ୍କାର ସାର୍, ମୁଁ ଆଡମିଶନ ବିଷୟରେ ଜାଣିବାକୁ ଚାହୁଁଛି', intent: 'GREETING', script: 'NATIVE_ODIA' },
    { text: 'ପ୍ରଣାମ, ଡିପ୍ଲୋମା ନାମଲେଖା କେବେ ଆରମ୍ଭ ହେବ?', intent: 'GREETING', script: 'NATIVE_ODIA' },
    { text: 'ଜୟ ଜଗନ୍ନାଥ, ମୋତେ କିଛି ସୂଚନା ଦରକାର', intent: 'GREETING', script: 'NATIVE_ODIA' },
    { text: 'namaskar', intent: 'GREETING', script: 'ROMANIZED_ODIA' },
    { text: 'nomoskar sir', intent: 'GREETING', script: 'ROMANIZED_ODIA' },
    { text: 'mote admission information darkar', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA' },
    { text: 'namaskara, kemiti achanti?', intent: 'GREETING', script: 'ROMANIZED_ODIA' },
    { text: 'ନମସ୍କାର ଭାଇ', intent: 'GREETING', script: 'NATIVE_ODIA' },
    { text: 'hello sir, namaskar', intent: 'GREETING', script: 'ROMANIZED_ODIA' },
    { text: 'ନମସ୍କାର ମ୍ୟାଡମ୍', intent: 'GREETING', script: 'NATIVE_ODIA' },
    { text: 'pranam sir, sahayata darkar', intent: 'GREETING', script: 'ROMANIZED_ODIA' },
    { text: 'nomoskar, admission process kana?', intent: 'GREETING', script: 'ROMANIZED_ODIA' },
    { text: 'ନମସ୍କାର, କଲେଜ ଖୋଲିଛି କି?', intent: 'GREETING', script: 'NATIVE_ODIA' },
    { text: 'namaskar, polytechnic admission darkar', intent: 'GREETING', script: 'ROMANIZED_ODIA' }
  ];
  cases.push(...greetings);

  // 16-35: Branch Discovery & Explanations
  const branchQueries = [
    { text: 'କେଉଁ କେଉଁ ଇଞ୍ଜିନିୟରିଂ ଶାଖା ଉପଲବ୍ଧ ଅଛି?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_ODIA' },
    { text: 'ମେକାନିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ ବିଷୟରେ କୁହନ୍ତୁ', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_ODIA', branch: 'MECH' },
    { text: 'ସିଭିଲ୍ ଇଞ୍ଜିନିୟରିଂ କୋର୍ସ କିପରି?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_ODIA', branch: 'CIVIL' },
    { text: 'କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ ଶାଖାରେ କ’ଣ ପଢ଼ାଯାଏ?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_ODIA', branch: 'CSE' },
    { text: 'ଇଲେକ୍ଟ୍ରିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ ସିଲାବସ୍ କ’ଣ?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_ODIA', branch: 'EE' },
    { text: 'ଇଲେକ୍ଟ୍ରୋନିକ୍ସ ଏବଂ ଟେଲିକମ୍ ଶାଖା ଅଛି କି?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_ODIA', branch: 'ETC' },
    { text: 'ଅଟୋମୋବାଇଲ୍ ଇଞ୍ଜିନିୟରିଂ ସ୍କୋପ୍ କ’ଣ?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_ODIA', branch: 'AUTO' },
    { text: 'mechanical branch re scope kana achi?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'MECH' },
    { text: 'civil engineering re job miliba ki?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'CIVIL' },
    { text: 'computer science engineering course details kuha', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'CSE' },
    { text: 'electrical engineering branches re lab achi ki?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'EE' },
    { text: 'etc branch re placement kemiti?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'ETC' },
    { text: 'automobile diploma engineering kete barsha?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'AUTO' },
    { text: 'mechnical branch subject kana kana?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'MECH' },
    { text: 'cse branch re coding sikhanti ki?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'CSE' },
    { text: 'diploma civil engineering re survey achi?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'CIVIL' },
    { text: 'electrical branch re bijuli work sikhanti?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'EE' },
    { text: 'electronics branch course duration kete?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'ETC' },
    { text: 'auto mobile re car repair sikhanti ki?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA', branch: 'AUTO' },
    { text: 'sobuthu bhala branch kouta diploma re?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_ODIA' }
  ];
  cases.push(...branchQueries);

  // 36-60: Eligibility & Marks Evaluation
  const eligQueries = [
    { text: 'ଡିପ୍ଲୋମା ନାମଲେଖା ପାଇଁ ଯୋଗ୍ୟତା କ’ଣ?', intent: 'ELIGIBILITY_QUERY', script: 'NATIVE_ODIA' },
    { text: 'ମୋର ୧୦ମ ରେ ୫୮% ଅଛି, ମୋତେ ମେକାନିକାଲ୍ ମିଳିବ କି?', intent: 'ELIGIBILITY_CHECK', script: 'NATIVE_ODIA', branch: 'MECH', percentage: 58 },
    { text: '୬୨% ମାର୍କ ରେ ସିଭିଲ୍ ରେ ଆଡମିଶନ ହେବ କି?', intent: 'ELIGIBILITY_CHECK', script: 'NATIVE_ODIA', branch: 'CIVIL', percentage: 62 },
    { text: '୪୫% ମାର୍କ ରେ କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ ମିଳିବ କି?', intent: 'ELIGIBILITY_CHECK', script: 'NATIVE_ODIA', branch: 'CSE', percentage: 45 },
    { text: 'ITI ପରେ ଲାଟେରାଲ ଏଣ୍ଟ୍ରି ଯୋଗ୍ୟତା କ’ଣ?', intent: 'ELIGIBILITY_QUERY', script: 'NATIVE_ODIA' },
    { text: 'mote mechanical re admission miliba ki 58% mark achi', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', branch: 'MECH', percentage: 58 },
    { text: 'civil re 65% mark re seat miliba ki?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', branch: 'CIVIL', percentage: 65 },
    { text: 'cse re admission pain kete percentage percentage darkar?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_ODIA', branch: 'CSE' },
    { text: '70% mark achi electrical miliba?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', branch: 'EE', percentage: 70 },
    { text: '34% mark re admission heba ki?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', percentage: 34 },
    { text: 'mor 10th re 52% achi jogyata kana?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', percentage: 52 },
    { text: 'lateral entry eligibility kana iti fitter pain?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_ODIA', branch: 'MECH' },
    { text: 'mora 75% mark achi cse re admission miliba?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', branch: 'CSE', percentage: 75 },
    { text: '10th pass jogyata kete mark darkar?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_ODIA' },
    { text: '55% mark re mechanical branch miliba ki?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', branch: 'MECH', percentage: 55 },
    { text: 'math re pass heichi 48% mark achi', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', percentage: 48 },
    { text: 'science re pass heini kintu 50% achi', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', percentage: 50 },
    { text: 'iti electrician pass heichi lateral entry miliba?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_ODIA', branch: 'EE' },
    { text: 'sc category pain minimum percentage kete?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'st category student 32% mark re eligible ki?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', percentage: 32 },
    { text: 'age 15 barsha achi admission heba?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'mora 80% mark achi direct second year heba?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', percentage: 80 },
    { text: '12th science pass heichi 50% mark re lateral entry heba?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_ODIA', percentage: 50 },
    { text: 'iti copa pass heichi cse re lateral miliba?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_ODIA', branch: 'CSE' },
    { text: 'first year admission pain minimum mark kete?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_ODIA' }
  ];
  cases.push(...eligQueries);

  // 61-75: Fees & Hostel
  const feeQueries = [
    { text: 'ଡିପ୍ଲୋମା ପଢ଼ିବା ପାଇଁ କେତେ ଫିସ୍ ଲାଗିବ?', intent: 'FEE_QUERY', script: 'NATIVE_ODIA' },
    { text: 'ମେକାନିକାଲ୍ ଶାଖାର ଫିସ୍ ଏବଂ ହଷ୍ଟେଲ ଖର୍ଚ୍ଚ କେତେ?', intent: 'FEE_AND_HOSTEL_QUERY', script: 'NATIVE_ODIA', branch: 'MECH' },
    { text: 'କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ ସେମିଷ୍ଟାର ଫିସ୍ କେତେ?', intent: 'FEE_QUERY', script: 'NATIVE_ODIA', branch: 'CSE' },
    { text: 'ହଷ୍ଟେଲ ସୁବିଧା ଏବଂ ମେସ୍ ଖର୍ଚ୍ଚ ବିଷୟରେ ଜଣାନ୍ତୁ', intent: 'HOSTEL_QUERY', script: 'NATIVE_ODIA' },
    { text: 'fees kete lagiba mechanical engineering re?', intent: 'FEE_QUERY', script: 'ROMANIZED_ODIA', branch: 'MECH' },
    { text: 'hostel fees kete hostel ra kharcha kana?', intent: 'HOSTEL_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'civil branch re fees kete semester ku?', intent: 'FEE_QUERY', script: 'ROMANIZED_ODIA', branch: 'CIVIL' },
    { text: 'hostel mess re kana khadya mile?', intent: 'HOSTEL_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'total kharcha kete heba 3 years re?', intent: 'FEE_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'admission fee kete thare debaku pade?', intent: 'FEE_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'fiss kete semester ku cse branch pain?', intent: 'FEE_QUERY', script: 'ROMANIZED_ODIA', branch: 'CSE' },
    { text: 'electrical engineering fees and hostel kharcha kete?', intent: 'FEE_AND_HOSTEL_QUERY', script: 'ROMANIZED_ODIA', branch: 'EE' },
    { text: 'hostel re separate girls hostel achi ki?', intent: 'HOSTEL_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'semister fee kete lagiba?', intent: 'FEE_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'mess fee per month kete?', intent: 'HOSTEL_QUERY', script: 'ROMANIZED_ODIA' }
  ];
  cases.push(...feeQueries);

  // 76-85: Scholarships & Documents
  const docQueries = [
    { text: 'ଓଡ଼ିଶା ସରକାରଙ୍କ PRERANA ସ୍କଲାରସିପ୍ କିପରି ମିଳିବ?', intent: 'SCHOLARSHIP_QUERY', script: 'NATIVE_ODIA' },
    { text: 'ନାମଲେଖା ପାଇଁ କେଉଁ କେଉଁ କାଗଜପତ୍ର ଆବଶ୍ୟକ?', intent: 'DOCUMENTS_QUERY', script: 'NATIVE_ODIA' },
    { text: 'sc st scholarship kete taka mile?', intent: 'SCHOLARSHIP_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'admission documents kana kana lagiba?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'prerana scholarship apply kemiti karibi?', intent: 'SCHOLARSHIP_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'marksheet au clc certificate darkar ki?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'caste certificate darkar heba ki reservation pain?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'resident certificate kouthu banebi?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'chhatrabruti pain kete percentage percentage darkar?', intent: 'SCHOLARSHIP_QUERY', script: 'ROMANIZED_ODIA' },
    { text: 'documents verification kouthee heba?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_ODIA' }
  ];
  cases.push(...docQueries);

  // 86-100: Counsellor Handoff & Contact Sharing
  const handoffQueries = [
    { text: 'ମୁଁ ଆପଣଙ୍କ କାଉନସେଲରଙ୍କ ସହିତ କଥା ହେବାକୁ ଚାହୁଁଛି', intent: 'COUNSELLOR_HANDOFF', script: 'NATIVE_ODIA' },
    { text: 'କଲେଜ ଫୋନ୍ ନମ୍ବର ମିଳିପାରିବ କି?', intent: 'COUNSELLOR_HANDOFF', script: 'NATIVE_ODIA' },
    { text: 'mote admission counsellor sange katha habaku achi', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'call karantu mora number 9876543210', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'human counsellor sange connect kara', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'mora phone number re call kariki sahayata kara', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'counselling desk number dia', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'help desk re katha habaku chahunchi', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'sir apananka sathire phone re katha hebi', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'counsellor call back request karuchi', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'direct call kariba facility achi ki?', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'admission sahayaka nka number kete?', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'talk to human counsellor please', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'mo phone number 9437123456 call karantu', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' },
    { text: 'office timing kana katha haba pain?', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_ODIA' }
  ];
  cases.push(...handoffQueries);

  return cases.map((c, i) => ({ id: `or-${String(i + 1).padStart(3, '0')}`, lang: 'or', ...c }));
};

// Helper to assemble 100 realistic Hindi test cases
const generateHindiCases = () => {
  const cases = [];

  // 1-15: Greetings
  const greetings = [
    { text: 'नमस्ते', intent: 'GREETING', script: 'NATIVE_HINDI' },
    { text: 'नमस्ते सर, मुझे डिप्लोमा एडमिशन की जानकारी चाहिए', intent: 'GREETING', script: 'NATIVE_HINDI' },
    { text: 'प्रणाम, क्या मैं यहाँ प्रवेश के बारे में पूछ सकता हूँ?', intent: 'GREETING', script: 'NATIVE_HINDI' },
    { text: 'नमस्कार, मुझे कॉलेज के बारे में बताएं', intent: 'GREETING', script: 'NATIVE_HINDI' },
    { text: 'namaste', intent: 'GREETING', script: 'ROMANIZED_HINDI' },
    { text: 'namaste sir, admission help chahiye', intent: 'GREETING', script: 'ROMANIZED_HINDI' },
    { text: 'pranam sir', intent: 'GREETING', script: 'ROMANIZED_HINDI' },
    { text: 'hello sir, diploma pravesh kab shuru hoga?', intent: 'GREETING', script: 'ROMANIZED_HINDI' },
    { text: 'namaskar, mujhe jaankari chahiye', intent: 'GREETING', script: 'ROMANIZED_HINDI' },
    { text: 'नमस्ते मैडम, सहायता चाहिए', intent: 'GREETING', script: 'NATIVE_HINDI' },
    { text: 'shubh prabhat, admission kaise hoga?', intent: 'GREETING', script: 'ROMANIZED_HINDI' },
    { text: 'namaste, polytechnic admission open hai kya?', intent: 'GREETING', script: 'ROMANIZED_HINDI' },
    { text: 'pranam, kaise hain aap?', intent: 'GREETING', script: 'ROMANIZED_HINDI' },
    { text: 'नमस्ते, क्या एडमिशन चालू है?', intent: 'GREETING', script: 'NATIVE_HINDI' },
    { text: 'namaste help desk', intent: 'GREETING', script: 'ROMANIZED_HINDI' }
  ];
  cases.push(...greetings);

  // 16-35: Branch Discovery
  const branchQueries = [
    { text: 'डिप्लोमा में कौन-कौन सी शाखाएं उपलब्ध हैं?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_HINDI' },
    { text: 'मैकेनिकल इंजीनियरिंग में क्या पढ़ाया जाता है?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_HINDI', branch: 'MECH' },
    { text: 'सिविल इंजीनियरिंग कोर्स का क्या स्कोप है?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_HINDI', branch: 'CIVIL' },
    { text: 'कंप्यूटर साइंस इंजीनियरिंग की जानकारी दें', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_HINDI', branch: 'CSE' },
    { text: 'इलेक्ट्रिकल इंजीनियरिंग में सरकारी नौकरी का मौका है?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_HINDI', branch: 'EE' },
    { text: 'इलेक्ट्रॉनिक्स एंड टेलीकम्युनिकेशन ब्रांच कैसा है?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_HINDI', branch: 'ETC' },
    { text: 'ऑटोमोबाइल इंजीनियरिंग में प्लेसमेंट कैसा है?', intent: 'BRANCH_DISCOVERY', script: 'NATIVE_HINDI', branch: 'AUTO' },
    { text: 'mechanical engineering me admission lena hai', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'MECH' },
    { text: 'civil engineering diploma course duration kitna hai?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'CIVIL' },
    { text: 'computer science engineering me software sikhate hain?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'CSE' },
    { text: 'electrical engineering me job opportunity kya hai?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'EE' },
    { text: 'electronics telecom branch me kya subjects hain?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'ETC' },
    { text: 'automobile engineering diploma syllabus batao', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'AUTO' },
    { text: 'mechnical engineering ka scope kya hai?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'MECH' },
    { text: 'cse branch me coding classes hoti hain kya?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'CSE' },
    { text: 'civil me construction site training milti hai?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'CIVIL' },
    { text: 'electrical diploma me substation visit hoti hai?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'EE' },
    { text: 'electronics branch telecom me job kaise milegi?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'ETC' },
    { text: 'automobile engineering me car design sikhate hain?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI', branch: 'AUTO' },
    { text: 'polytechnic me best engineering branch kaun si hai?', intent: 'BRANCH_DISCOVERY', script: 'ROMANIZED_HINDI' }
  ];
  cases.push(...branchQueries);

  // 36-60: Eligibility & Evaluation
  const eligQueries = [
    { text: 'डिप्लोमा प्रवेश हेतु पात्रता क्या है?', intent: 'ELIGIBILITY_QUERY', script: 'NATIVE_HINDI' },
    { text: 'मेरे 10वीं में 58% अंक हैं, क्या मुझे मैकेनिकल मिलेगा?', intent: 'ELIGIBILITY_CHECK', script: 'NATIVE_HINDI', branch: 'MECH', percentage: 58 },
    { text: '62% अंक पर सिविल में प्रवेश संभव है?', intent: 'ELIGIBILITY_CHECK', script: 'NATIVE_HINDI', branch: 'CIVIL', percentage: 62 },
    { text: '45% अंक पर कंप्यूटर साइंस मिल सकता है?', intent: 'ELIGIBILITY_CHECK', script: 'NATIVE_HINDI', branch: 'CSE', percentage: 45 },
    { text: 'आईटीआई के बाद लेटरल एंट्री की क्या योग्यता है?', intent: 'ELIGIBILITY_QUERY', script: 'NATIVE_HINDI' },
    { text: 'mujhe mechanical me admission milega kya 58% mark hai', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', branch: 'MECH', percentage: 58 },
    { text: 'civil me 65% mark me seat milegi kya?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', branch: 'CIVIL', percentage: 65 },
    { text: 'cse me admission ke liye kitna percentage chahiye?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_HINDI', branch: 'CSE' },
    { text: '70% mark hai electrical milega?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', branch: 'EE', percentage: 70 },
    { text: '34% mark me admission hoga kya?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', percentage: 34 },
    { text: 'mera 10th me 52% hai yogyata kya hai?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', percentage: 52 },
    { text: 'lateral entry eligibility kya hai iti fitter ke liye?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_HINDI', branch: 'MECH' },
    { text: 'mera 75% mark hai cse me admission milega?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', branch: 'CSE', percentage: 75 },
    { text: '10th pass yogyata kitne mark chahiye?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_HINDI' },
    { text: '55% mark me mechanical branch milegi kya?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', branch: 'MECH', percentage: 55 },
    { text: 'maths me pass hu aur 48% mark hai', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', percentage: 48 },
    { text: 'science me fail hu lekin 50% aggregate hai', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', percentage: 50 },
    { text: 'iti electrician pass kiya hu lateral entry milegi?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_HINDI', branch: 'EE' },
    { text: 'sc category ke liye minimum percentage kitna hai?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'st category student 32% mark me eligible hai?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', percentage: 32 },
    { text: 'age 14 saal hai kya admission ho sakta hai?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'mera 80% mark hai direct second year hoga?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', percentage: 80 },
    { text: '12th science pass hu 50% mark me lateral hoga?', intent: 'ELIGIBILITY_CHECK', script: 'ROMANIZED_HINDI', percentage: 50 },
    { text: 'iti copa pass hu cse me lateral entry milegi?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_HINDI', branch: 'CSE' },
    { text: 'first year admission me minimum percentage kitna chahiye?', intent: 'ELIGIBILITY_QUERY', script: 'ROMANIZED_HINDI' }
  ];
  cases.push(...eligQueries);

  // 61-75: Fees & Hostel
  const feeQueries = [
    { text: 'डिप्लोमा कोर्स की फीस कितनी है?', intent: 'FEE_QUERY', script: 'NATIVE_HINDI' },
    { text: 'मैकेनिकल इंजीनियरिंग की फीस और हॉस्टल का खर्च कितना है?', intent: 'FEE_AND_HOSTEL_QUERY', script: 'NATIVE_HINDI', branch: 'MECH' },
    { text: 'कंप्यूटर साइंस का सेमेस्टर शुल्क कितना है?', intent: 'FEE_QUERY', script: 'NATIVE_HINDI', branch: 'CSE' },
    { text: 'हॉस्टल और मेस की क्या सुविधाएं हैं?', intent: 'HOSTEL_QUERY', script: 'NATIVE_HINDI' },
    { text: 'fees kitna lagega mechanical engineering me?', intent: 'FEE_QUERY', script: 'ROMANIZED_HINDI', branch: 'MECH' },
    { text: 'hostel fees kitna hai mess kharcha kya hai?', intent: 'HOSTEL_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'civil branch me fees kitni hai per semester?', intent: 'FEE_QUERY', script: 'ROMANIZED_HINDI', branch: 'CIVIL' },
    { text: 'hostel mess me kaisa khana milta hai?', intent: 'HOSTEL_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'total kharcha kitna hoga 3 saal me?', intent: 'FEE_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'admission fee ek baar me deni hoti hai kya?', intent: 'FEE_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'fiss kitna lagega hostel ke sath computer science me', intent: 'FEE_AND_HOSTEL_QUERY', script: 'ROMANIZED_HINDI', branch: 'CSE' },
    { text: 'electrical engineering fees aur hostel kharcha kitna hai?', intent: 'FEE_AND_HOSTEL_QUERY', script: 'ROMANIZED_HINDI', branch: 'EE' },
    { text: 'hostel me alag se girls hostel hai kya?', intent: 'HOSTEL_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'semester fee kitni lagti hai?', intent: 'FEE_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'mess fee mahine ki kitni aati hai?', intent: 'HOSTEL_QUERY', script: 'ROMANIZED_HINDI' }
  ];
  cases.push(...feeQueries);

  // 76-85: Scholarships & Documents
  const docQueries = [
    { text: 'ओडिशा सरकार की प्रेरणा (PRERANA) छात्रवृत्ति कैसे मिलेगी?', intent: 'SCHOLARSHIP_QUERY', script: 'NATIVE_HINDI' },
    { text: 'नामांकन हेतु कौन-कौन से दस्तावेज आवश्यक हैं?', intent: 'DOCUMENTS_QUERY', script: 'NATIVE_HINDI' },
    { text: 'sc st scholarship kitna milta hai?', intent: 'SCHOLARSHIP_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'admission documents kya kya lagenge?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'prerana scholarship apply kaise karein?', intent: 'SCHOLARSHIP_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'marksheet aur clc certificate zaruri hai kya?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'caste certificate chahiye reservation ke liye?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'resident certificate kahan se banega?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'chhatravritti ke liye kitna percentage chahiye?', intent: 'SCHOLARSHIP_QUERY', script: 'ROMANIZED_HINDI' },
    { text: 'documents verification kahan hoga?', intent: 'DOCUMENTS_QUERY', script: 'ROMANIZED_HINDI' }
  ];
  cases.push(...docQueries);

  // 86-100: Counsellor Handoff
  const handoffQueries = [
    { text: 'मुझे प्रवेश काउंसलर से बात करनी है', intent: 'COUNSELLOR_HANDOFF', script: 'NATIVE_HINDI' },
    { text: 'कॉलेज का हेल्पलाइन नंबर क्या है?', intent: 'COUNSELLOR_HANDOFF', script: 'NATIVE_HINDI' },
    { text: 'mujhe admission counsellor se baat karni hai', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'call karein mera number 9876543210', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'human counsellor se connect kijiye', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'mere phone number par call karke sahayata karein', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'counselling desk ka number dijiye', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'help desk me baat karni hai', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'sir aapse phone par baat karni thi', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'counsellor call back request kar raha hu', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'direct call karne ki suvidha hai kya?', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'admission sahayak ka phone number kya hai?', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'talk to human counsellor please', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'mera number 9876543210 par call back kijiye', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' },
    { text: 'office timing kya hai baat karne ke liye?', intent: 'COUNSELLOR_HANDOFF', script: 'ROMANIZED_HINDI' }
  ];
  cases.push(...handoffQueries);

  return cases.map((c, i) => ({ id: `hi-${String(i + 1).padStart(3, '0')}`, lang: 'hi', ...c }));
};

// Helper to assemble 100 English & Mixed test cases
const generateEnglishCases = () => {
  const cases = [];

  // 1-15: Greetings
  for (let i = 1; i <= 15; i++) {
    cases.push({
      text: i === 1 ? 'Hello' : i === 2 ? 'Hi, good morning' : i === 3 ? 'Hey there' : `Hello, enquiry session ${i}`,
      intent: 'GREETING',
      script: 'ENGLISH'
    });
  }

  // 16-35: Branch Discovery
  const branchList = ['Mechanical', 'Civil', 'Computer Science', 'Electrical', 'Electronics', 'Automobile'];
  for (let i = 16; i <= 35; i++) {
    const br = branchList[i % branchList.length];
    const code = br.startsWith('M') ? 'MECH' : br.startsWith('Civ') ? 'CIVIL' : br.startsWith('Comp') ? 'CSE' : br.startsWith('Electr') ? (i % 2 === 0 ? 'EE' : 'ETC') : 'AUTO';
    cases.push({
      text: `Tell me more about ${br} engineering branch in diploma`,
      intent: 'BRANCH_DISCOVERY',
      script: 'ENGLISH',
      branch: code
    });
  }

  // 36-60: Eligibility & Marks Evaluation
  for (let i = 36; i <= 60; i++) {
    const marks = 40 + (i % 45);
    cases.push({
      text: `Is a candidate with ${marks}% marks eligible for 1st year mechanical admission?`,
      intent: 'ELIGIBILITY_CHECK',
      script: 'ENGLISH',
      branch: 'MECH',
      percentage: marks
    });
  }

  // 61-75: Fees & Hostel
  for (let i = 61; i <= 75; i++) {
    cases.push({
      text: i % 2 === 0 ? `What is the sample fee structure for CSE branch?` : `Hostel and mess fee details please`,
      intent: i % 2 === 0 ? 'FEE_QUERY' : 'HOSTEL_QUERY',
      script: 'ENGLISH',
      branch: i % 2 === 0 ? 'CSE' : null
    });
  }

  // 76-85: Scholarships & Documents
  for (let i = 76; i <= 85; i++) {
    cases.push({
      text: i % 2 === 0 ? `What are the documents required for diploma admission?` : `Tell me about scholarship eligibility and fee waivers`,
      intent: i % 2 === 0 ? 'DOCUMENTS_QUERY' : 'SCHOLARSHIP_QUERY',
      script: 'ENGLISH'
    });
  }

  // 86-100: Counsellor Handoff
  for (let i = 86; i <= 100; i++) {
    cases.push({
      text: `I want to speak with an admission counsellor directly, please call me`,
      intent: 'COUNSELLOR_HANDOFF',
      script: 'ENGLISH'
    });
  }

  return cases.map((c, i) => ({ id: `en-${String(i + 1).padStart(3, '0')}`, lang: 'en', ...c }));
};

const allCases = [
  ...generateOdiaCases(),
  ...generateHindiCases(),
  ...generateEnglishCases()
];

const targetPath = path.join(__dirname, 'multilingualBenchmarkSuite.json');
fs.writeFileSync(targetPath, JSON.stringify(allCases, null, 2), 'utf-8');
console.log(`Generated benchmark suite with ${allCases.length} test cases at: ${targetPath}`);
