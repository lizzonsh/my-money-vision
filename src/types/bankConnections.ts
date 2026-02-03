// Israeli Bank Scrapers - Company Types
// Based on https://github.com/eshaham/israeli-bank-scrapers

export type BankCompanyType = 
  | 'hapoalim'
  | 'hapoalimBeOnline'
  | 'leumi'
  | 'discount'
  | 'mercantile'
  | 'mizrahi'
  | 'otsarHahayal'
  | 'visaCal'
  | 'max'
  | 'isracard'
  | 'amex'
  | 'union'
  | 'beinleumi'
  | 'massad'
  | 'yahav'
  | 'beyhad'
  | 'oneZero'
  | 'behatsdaa';

export interface BankCompanyInfo {
  id: BankCompanyType;
  name: string;
  nameHe: string;
  type: 'bank' | 'creditCard';
  loginFields: BankLoginField[];
  supportsTwoFactor?: boolean;
  logo?: string;
}

export type BankLoginField = 
  | 'username'
  | 'password'
  | 'userCode'
  | 'id'
  | 'card6Digits'
  | 'nationalID'
  | 'email'
  | 'phoneNumber';

export interface BankLoginFieldConfig {
  name: BankLoginField;
  label: string;
  labelHe: string;
  type: 'text' | 'password' | 'tel' | 'email';
  placeholder?: string;
}

export const LOGIN_FIELD_CONFIGS: Record<BankLoginField, BankLoginFieldConfig> = {
  username: { name: 'username', label: 'Username', labelHe: 'שם משתמש', type: 'text' },
  password: { name: 'password', label: 'Password', labelHe: 'סיסמה', type: 'password' },
  userCode: { name: 'userCode', label: 'User Code', labelHe: 'קוד משתמש', type: 'text' },
  id: { name: 'id', label: 'ID Number', labelHe: 'תעודת זהות', type: 'text' },
  card6Digits: { name: 'card6Digits', label: 'Last 6 Digits of Card', labelHe: '6 ספרות אחרונות של הכרטיס', type: 'text' },
  nationalID: { name: 'nationalID', label: 'National ID', labelHe: 'תעודת זהות', type: 'text' },
  email: { name: 'email', label: 'Email', labelHe: 'אימייל', type: 'email' },
  phoneNumber: { name: 'phoneNumber', label: 'Phone Number', labelHe: 'מספר טלפון', type: 'tel' },
};

export const BANK_COMPANIES: BankCompanyInfo[] = [
  // Banks
  {
    id: 'hapoalim',
    name: 'Bank Hapoalim',
    nameHe: 'בנק הפועלים',
    type: 'bank',
    loginFields: ['userCode', 'password'],
  },
  {
    id: 'hapoalimBeOnline',
    name: 'Bank Hapoalim Be Online',
    nameHe: 'בנק הפועלים ביונליין',
    type: 'bank',
    loginFields: ['userCode', 'password'],
  },
  {
    id: 'leumi',
    name: 'Bank Leumi',
    nameHe: 'בנק לאומי',
    type: 'bank',
    loginFields: ['username', 'password'],
  },
  {
    id: 'discount',
    name: 'Discount Bank',
    nameHe: 'בנק דיסקונט',
    type: 'bank',
    loginFields: ['id', 'password', 'card6Digits'],
  },
  {
    id: 'mercantile',
    name: 'Mercantile Bank',
    nameHe: 'בנק מרכנתיל',
    type: 'bank',
    loginFields: ['id', 'password', 'card6Digits'],
  },
  {
    id: 'mizrahi',
    name: 'Mizrahi Tefahot Bank',
    nameHe: 'בנק מזרחי טפחות',
    type: 'bank',
    loginFields: ['username', 'password'],
  },
  {
    id: 'otsarHahayal',
    name: 'Otsar Hahayal Bank',
    nameHe: 'בנק אוצר החייל',
    type: 'bank',
    loginFields: ['username', 'password'],
  },
  {
    id: 'union',
    name: 'Union Bank',
    nameHe: 'בנק איגוד',
    type: 'bank',
    loginFields: ['username', 'password'],
  },
  {
    id: 'beinleumi',
    name: 'First International Bank',
    nameHe: 'הבנק הבינלאומי הראשון',
    type: 'bank',
    loginFields: ['username', 'password'],
  },
  {
    id: 'massad',
    name: 'Bank Massad',
    nameHe: 'בנק מסד',
    type: 'bank',
    loginFields: ['username', 'password'],
  },
  {
    id: 'yahav',
    name: 'Bank Yahav',
    nameHe: 'בנק יהב',
    type: 'bank',
    loginFields: ['username', 'nationalID', 'password'],
  },
  {
    id: 'oneZero',
    name: 'One Zero Bank',
    nameHe: 'בנק וואן זירו',
    type: 'bank',
    loginFields: ['email', 'password', 'phoneNumber'],
    supportsTwoFactor: true,
  },
  // Credit Cards
  {
    id: 'visaCal',
    name: 'Visa Cal',
    nameHe: 'ויזה כאל',
    type: 'creditCard',
    loginFields: ['username', 'password'],
  },
  {
    id: 'max',
    name: 'Max (Leumi Card)',
    nameHe: 'מקס (לאומי קארד)',
    type: 'creditCard',
    loginFields: ['username', 'password'],
  },
  {
    id: 'isracard',
    name: 'Isracard',
    nameHe: 'ישראכרט',
    type: 'creditCard',
    loginFields: ['id', 'card6Digits', 'password'],
  },
  {
    id: 'amex',
    name: 'American Express',
    nameHe: 'אמריקן אקספרס',
    type: 'creditCard',
    loginFields: ['id', 'card6Digits', 'password'],
  },
  {
    id: 'beyhad',
    name: 'Beyhad Bishvilha',
    nameHe: 'ביחד בשבילך',
    type: 'creditCard',
    loginFields: ['id', 'password'],
  },
  {
    id: 'behatsdaa',
    name: 'Behatsdaa',
    nameHe: 'בהצדעה',
    type: 'creditCard',
    loginFields: ['id', 'password'],
  },
];

export interface BankConnection {
  _id: string;
  companyId: BankCompanyType;
  credentials: Record<BankLoginField, string>;
  isActive: boolean;
  lastSync?: string;
  lastSyncStatus?: 'success' | 'error' | 'pending';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// For UI display only - never store actual credentials in state
export interface BankConnectionDisplay {
  _id: string;
  companyId: BankCompanyType;
  companyName: string;
  companyNameHe: string;
  isActive: boolean;
  lastSync?: string;
  lastSyncStatus?: 'success' | 'error' | 'pending';
  errorMessage?: string;
}
