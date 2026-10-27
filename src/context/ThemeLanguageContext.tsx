/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ta' | 'hi';
export type Theme = 'light' | 'dark';

export interface Translations {
  [key: string]: {
    en: string;
    ta: string;
    hi: string;
  };
}

export const TRANSLATIONS: Translations = {
  tagline: {
    en: 'Smarter Admissions. Trusted Verification.',
    ta: 'புத்திசாலித்தனமான சேர்க்கை. நம்பகமான சரிபார்ப்பு.',
    hi: 'स्मार्ट प्रवेश। विश्वसनीय सत्यापन।',
  },
  selectCollege: {
    en: 'Select College',
    ta: 'கல்லூரி தேர்வு',
    hi: 'कॉलेज चुनें',
  },
  trackApplication: {
    en: 'Track Application',
    ta: 'விண்ணப்ப நிலை',
    hi: 'आवेदन स्थिति',
  },
  adminConsole: {
    en: 'Admin Console',
    ta: 'நிர்வாகி கன்சோல்',
    hi: 'एडमिन कंसोल',
  },
  collegeSelectionHeading: {
    en: 'College Selection',
    ta: 'கல்லூரி தேர்வு',
    hi: 'कॉलेज चयन',
  },
  collegeSelectionSub: {
    en: 'Enter your official institution code to launch preliminary admission scrutiny.',
    ta: 'சேர்க்கை சரிபார்ப்பைத் தொடங்க உங்கள் அதிகாரப்பூர்வ கல்லூரி குறியீட்டை உள்ளிடவும்.',
    hi: 'प्रवेश सत्यापन शुरू करने के लिए अपना आधिकारिक संस्थान कोड दर्ज करें।',
  },
  enterInstitutionCode: {
    en: 'Enter Institution Code',
    ta: 'நிறுவனக் குறியீட்டை உள்ளிடவும்',
    hi: 'संस्थान कोड दर्ज करें',
  },
  enterCodePlaceholder: {
    en: 'Enter 4-digit institution code...',
    ta: '4-இலக்க கல்லூரி குறியீட்டை உள்ளிடவும்...',
    hi: '4-अंकीय संस्थान कोड दर्ज करें...',
  },
  verifyCode: {
    en: 'Verify Code',
    ta: 'சரிபார்க்கவும்',
    hi: 'सत्यापित करें',
  },
  recognizedInstitution: {
    en: 'Recognized Institution',
    ta: 'அங்கீகரிக்கப்பட்ட நிறுவனம்',
    hi: 'मान्यता प्राप्त संस्थान',
  },
  proceedToApplication: {
    en: 'Proceed to Application',
    ta: 'விண்ணப்பிக்க தொடரவும்',
    hi: 'आवेदन के लिए आगे बढ़ें',
  },
  institutionalProfile: {
    en: 'Institutional Profile / Admin',
    ta: 'கல்லூரி சுயவிவரம் / நிர்வாகி',
    hi: 'संस्थान प्रोफ़ाइल / एडमिन',
  },
  onlineAdmissionTitle: {
    en: 'Online Admission Application Form',
    ta: 'இணைய சேர்க்கை விண்ணப்பப் படிவம்',
    hi: 'ऑनलाइन प्रवेश आवेदन प्रपत्र',
  },
  academicSession: {
    en: 'Academic Session 2026–2027 · Autonomous AI Verification Scrutiny',
    ta: 'கல்வி ஆண்டு 2026–2027 · தானியங்கி AI சரிபார்ப்பு ஆய்வு',
    hi: 'शैक्षणिक सत्र 2026-2027 · स्वायत्त एआई सत्यापन संवीक्षा',
  },
  saveDraft: {
    en: 'Save Draft',
    ta: 'வரைவைச் சேமி',
    hi: 'ड्राफ्ट सहेजें',
  },
  clearForm: {
    en: 'Reset to Blank',
    ta: 'வெற்றுப் படிவம்',
    hi: 'रिक्त फ़ॉर्म',
  },
  formClearedSuccess: {
    en: 'Application form has been reset to blank. You can enter your details now.',
    ta: 'விண்ணப்பப் படிவம் மீட்டமைக்கப்பட்டது. உங்கள் விவரங்களை உள்ளிடலாம்.',
    hi: 'आवेदन फ़ॉर्म रिक्त कर दिया गया है। अब आप विवरण दर्ज कर सकते हैं।',
  },
  secA: {
    en: 'A. Personal Bio-Data',
    ta: 'A. தனிநபர் விவரங்கள்',
    hi: 'A. व्यक्तिगत विवरण',
  },
  secB: {
    en: 'B. 10th Standard',
    ta: 'B. 10ஆம் வகுப்பு (SSLC)',
    hi: 'B. 10वीं कक्षा',
  },
  secC: {
    en: 'C. 12th HSC & Cutoff',
    ta: 'C. 12ஆம் வகுப்பு & கட்-ஆஃப்',
    hi: 'C. 12वीं एवं कटऑफ',
  },
  secD: {
    en: 'D. Certificate IDs',
    ta: 'D. சான்றிதழ் எண்கள்',
    hi: 'D. प्रमाण पत्र संख्या',
  },
  secE: {
    en: 'E. Department Choices',
    ta: 'E. துறை விருப்பங்கள்',
    hi: 'E. विभाग प्राथमिकताएं',
  },
  secF: {
    en: 'F. Quota & Category',
    ta: 'F. இடஒதுக்கீடு & பிரிவு',
    hi: 'F. आरक्षण एवं श्रेणी',
  },
  nextDocumentUpload: {
    en: 'Next: Document Upload',
    ta: 'அடுத்து: ஆவணப் பதிவேற்றம்',
    hi: 'अगला: दस्तावेज़ अपलोड',
  },
  backToCollegeProfile: {
    en: 'Back to College Profile',
    ta: 'கல்லூரி விவரத்திற்கு திரும்பு',
    hi: 'कॉलेज प्रोफ़ाइल पर वापस',
  },
  uploadVerificationDocs: {
    en: 'Upload Verification Documents',
    ta: 'சரிபார்ப்பு ஆவணங்களைப் பதிவேற்றவும்',
    hi: 'सत्यापन दस्तावेज़ अपलोड करें',
  },
  uploadDocsSub: {
    en: 'Formats: PDF, JPG, JPEG, PNG (Max 10 MB per document). Optical Character Recognition will extract text automatically.',
    ta: 'வடிவங்கள்: PDF, JPG, JPEG, PNG (அதிகபட்சம் 10 MB). கணினி தானாகவே உரையை பிரித்தெடுக்கும்.',
    hi: 'प्रारूप: PDF, JPG, JPEG, PNG (अधिकतम 10 MB)। ओसीआर स्वचालित रूप से टेक्स्ट निकालेगा।',
  },
  loadDemoSamples: {
    en: 'Load Demo Sample Documents',
    ta: 'மாதிரி ஆவணங்களை ஏற்றவும்',
    hi: 'डेमो नमूना दस्तावेज़ लोड करें',
  },
  demoFillButton: {
    en: 'Auto-Fill Demo & Attach Docs',
    ta: 'டெமோ நிரப்புதல் & ஆவணங்கள்',
    hi: 'डेमो भरें और दस्तावेज़ जोड़ें',
  },
  demoFillBadge: {
    en: 'Instant Demo Mode',
    ta: 'உடனடி டெமோ முறை',
    hi: 'त्वरित डेमो मोड',
  },
  demoFillHeading: {
    en: 'Fast Demo: Populate Application & Verification Documents',
    ta: 'வேகமான டெமோ: விண்ணப்பம் மற்றும் சரிபார்ப்பு ஆவணங்களை நிரப்பவும்',
    hi: 'फास्ट डेमो: आवेदन एवं सत्यापन दस्तावेज़ भरें',
  },
  demoFillSubtitle: {
    en: 'One-click fill for personal bio-data, 10th SSLC & 12th HSC marks, engineering cutoff (189.00), department preferences, and 9 verified sample documents.',
    ta: 'தனிநபர் விவரங்கள், 10th மற்றும் 12th மதிப்பெண்கள், கட்-ஆஃப் (189.00), துறை விருப்பங்கள் மற்றும் 9 மாதிரி ஆவணங்களை ஒரே கிளிக்கில் நிரப்புகிறது.',
    hi: 'व्यक्तिगत विवरण, 10वीं व 12वीं अंक, इंजीनियरिंग कटऑफ (189.00), विभाग वरीयताएं और 9 सत्यापित नमूना दस्तावेज़ों को एक क्लिक में भरें।',
  },
  demoFillQuick: {
    en: 'Fill Demo Data & Docs',
    ta: 'டெமோ விவரங்கள் & ஆவணங்களை நிரப்பவும்',
    hi: 'डेमो डेटा और दस्तावेज़ भरें',
  },
  demoFillAndProceed: {
    en: 'Fill & Go to Documents',
    ta: 'நிரப்பி ஆவணங்களுக்குச் செல்லவும்',
    hi: 'भरें और दस्तावेज़ पर जाएं',
  },
  demoFillSuccess: {
    en: 'Demo application data & 9 verification documents loaded successfully!',
    ta: 'டெமோ விண்ணப்ப விவரங்கள் மற்றும் 9 சரிபார்ப்பு ஆவணங்கள் வெற்றிகரமாக ஏற்றப்பட்டன!',
    hi: 'डेमो आवेदन डेटा और 9 सत्यापन दस्तावेज़ सफलतापूर्वक लोड किए गए!',
  },
  verifyDocumentsCTA: {
    en: 'VERIFY DOCUMENTS',
    ta: 'ஆவணங்களை சரிபார்க்கவும்',
    hi: 'दस्तावेज़ सत्यापित करें',
  },
  backToAppForm: {
    en: 'Back to Application Form',
    ta: 'விண்ணப்பப் படிவத்திற்கு திரும்பு',
    hi: 'आवेदन पत्र पर वापस',
  },
  dossierReview: {
    en: 'Application Dossier Review',
    ta: 'விண்ணப்ப ஆவணங்களின் மதிப்பாய்வு',
    hi: 'आवेदन डोज़ियर समीक्षा',
  },
  cutoffScore: {
    en: 'Engineering Cutoff',
    ta: 'பொறியியல் கட்-ஆஃப்',
    hi: 'इंजीनियरिंग कटऑफ',
  },
  submitApplicationCTA: {
    en: 'SUBMIT APPLICATION',
    ta: 'விண்ணப்பத்தை சமர்ப்பிக்கவும்',
    hi: 'आवेदन जमा करें',
  },
  appSuccessTitle: {
    en: 'APPLICATION SUCCESSFULLY SUBMITTED!',
    ta: 'விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!',
    hi: 'आवेदन सफलतापूर्वक जमा किया गया!',
  },
  downloadPdfReceipt: {
    en: 'Download as PDF',
    ta: 'PDF வடிவில் பதிவிறக்கவும்',
    hi: 'पीडीएफ के रूप में डाउनलोड करें',
  },
  downloadAsPdf: {
    en: 'Download as PDF',
    ta: 'PDF வடிவில் பதிவிறக்கவும்',
    hi: 'पीडीएफ के रूप में डाउनलोड करें',
  },
  formalApplicationDoc: {
    en: 'Formal Application Document',
    ta: 'அதிகாரப்பூர்வ விண்ணப்ப ஆவணம்',
    hi: 'औपचारिक आवेदन दस्तावेज़',
  },
  trackingPortalTitle: {
    en: 'Track Admission Verification Progress',
    ta: 'சேர்க்கை சரிபார்ப்பு முன்னேற்றத்தைக் கண்காணிக்கவும்',
    hi: 'प्रवेश सत्यापन प्रगति ट्रैक करें',
  },
  trackingPortalSub: {
    en: 'Check real-time scrutiny status, inspect officer review remarks, and address correction requests.',
    ta: 'நேரலை சரிபார்ப்பு நிலை, அதிகாரிகள் கருத்துக்கள் மற்றும் திருத்தக் கோரிக்கைகளை சரிபார்க்கவும்.',
    hi: 'वास्तविक समय संवीक्षा स्थिति, अधिकारी टिप्पणियां और सुधार अनुरोध देखें।',
  },
  enterAppIdPlaceholder: {
    en: 'Enter Application ID (e.g. EVA-2026-0003, EVA-2026-0001)...',
    ta: 'விண்ணப்ப எண்ணை உள்ளிடவும் (எ.கா. EVA-2026-0003)...',
    hi: 'आवेदन आईडी दर्ज करें (उदा. EVA-2026-0003)...',
  },
  trackBtn: {
    en: 'Track Application',
    ta: 'கண்காணிக்கவும்',
    hi: 'ट्रैक करें',
  },
  adminDashboardTitle: {
    en: 'AI Admission Verification Command Center',
    ta: 'AI சேர்க்கை சரிபார்ப்பு கட்டளை மையம்',
    hi: 'एआई प्रवेश सत्यापन कमांड सेंटर',
  },
  totalApps: {
    en: 'Total Applications',
    ta: 'மொத்த விண்ணப்பங்கள்',
    hi: 'कुल आवेदन',
  },
  preliminaryPassed: {
    en: 'Preliminary Passed',
    ta: 'முதற்கட்ட ஒப்புதல்',
    hi: 'प्रारंभिक उत्तीर्ण',
  },
  manualReviewReq: {
    en: 'Manual Review Required',
    ta: 'நேரடி ஆய்வு தேவை',
    hi: 'मैनुअल समीक्षा आवश्यक',
  },
  incompleteApps: {
    en: 'Incomplete Applications',
    ta: 'முழுமையடையாத விண்ணப்பங்கள்',
    hi: 'अधूरे आवेदन',
  },
  eligibilityIssues: {
    en: 'Eligibility Issues',
    ta: 'தகுதிச் சிக்கல்கள்',
    hi: 'पात्रता समस्याएं',
  },
  liveSeatsMatrix: {
    en: 'Live Department-Wise Seat Availability Matrix',
    ta: 'துறைவாரியான நேரலை இடங்கள் இருப்பு அட்டவணை',
    hi: 'विभागवार उपलब्ध सीटों का लाइव मैट्रिक्स',
  },
  exportCsv: {
    en: 'Export CSV',
    ta: 'CSV ஏற்றுமதி',
    hi: 'CSV निर्यात',
  },
  auditPdf: {
    en: 'Audit PDF',
    ta: 'தணிக்கை PDF',
    hi: 'ऑडिट पीडीएफ',
  },
  signOut: {
    en: 'Sign Out',
    ta: 'வெளியேறு',
    hi: 'साइन आउट',
  },
  adminSignIn: {
    en: 'Admin Sign-In',
    ta: 'நிர்வாகி உள்நுழைவு',
    hi: 'एडमिन लॉगिन',
  },
  lightMode: {
    en: 'Light Mode',
    ta: 'வெளிச்சப் பயன்முறை',
    hi: 'लाइट मोड',
  },
  darkMode: {
    en: 'Dark Mode',
    ta: 'இருள் பயன்முறை',
    hi: 'डार्क मोड',
  },
  language: {
    en: 'Language',
    ta: 'மொழி',
    hi: 'भाषा',
  },
  applyForBatch: {
    en: 'Apply for 2026 Batch',
    ta: '2026 சேர்க்கைக்கு விண்ணப்பிக்கவும்',
    hi: '2026 बैच के लिए आवेदन करें',
  },
  campusFacilities: {
    en: 'Campus Facilities',
    ta: 'வளாக வசதிகள்',
    hi: 'परिसर सुविधाएं',
  },
  academicPrograms: {
    en: 'Available Engineering Departments',
    ta: 'பொறியியல் துறைகள்',
    hi: 'उपलब्ध इंजीनियरिंग विभाग',
  },
  admissionPathways: {
    en: 'Admission Pathways',
    ta: 'சேர்க்கை வழிகள்',
    hi: 'प्रवेश मार्ग',
  },
  statutoryCompliance: {
    en: 'Statutory Compliance & Reservations',
    ta: 'சட்டரீதியான இடஒதுக்கீட்டு விதிமுறைகள்',
    hi: 'वैधानिक अनुपालन एवं आरक्षण',
  },
};

interface ThemeLanguageContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('authentix_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('authentix_lang');
      if (saved === 'ta' || saved === 'hi' || saved === 'en') return saved;
      return 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('authentix_theme', theme);
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Error saving theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('authentix_lang', lang);
    } catch (e) {
      console.warn('Error saving language:', e);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const entry = TRANSLATIONS[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    if (entry && entry.en) {
      return entry.en;
    }
    return fallback || key;
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = (): ThemeLanguageContextType => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
};
