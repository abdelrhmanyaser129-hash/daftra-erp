import { Client, Invoice, ProductService } from './types';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    type: 'individual',
    fullName: 'Abdo Yaser',
    firstName: 'Abdo',
    lastName: 'Yaser',
    email: 'abdelrhmanyaser128@gmail.com',
    phone: '01002345678',
    mobile: '01002345678',
    address1: 'شارع التسعين، التجمع الخامس',
    address2: 'برج الياسمين، الدور الثالث',
    city: 'القاهرة',
    region: 'القاهرة الكبرى',
    zipCode: '11835',
    country: 'مصر (EG)',
    commercialRegistry: '',
    taxCard: '',
    nationalId: '29810150102345',
    codeNumber: '000001',
    currency: 'EGP جنيه مصري',
    notes: 'عميل مميز - المالك الأساسي للحساب الممتاز',
    category: 'عملاء مميزون',
    billingMethod: 'طباعة'
  },
  {
    id: 'c2',
    type: 'commercial',
    fullName: 'شركة النيل للحلول الرقمية',
    firstName: 'محمود',
    lastName: 'الرفاعي',
    email: 'info@niletech.eg',
    phone: '0223456789',
    mobile: '01223456789',
    address1: 'قرية التكنولوجيا، المعادي',
    address2: 'مبنى أ1، الدور الأرضي',
    city: 'القاهرة',
    region: 'المعادي',
    zipCode: '11432',
    country: 'مصر (EG)',
    commercialRegistry: '1029384',
    taxCard: '984-231-112',
    nationalId: '',
    codeNumber: '000002',
    currency: 'EGP جنيه مصري',
    notes: 'عقد توريد برمجيات وحلول سحابية سنوي بقيمة متميزة',
    category: 'شركات ومؤسسات',
    billingMethod: 'طباعة'
  },
  {
    id: 'c3',
    type: 'individual',
    fullName: 'أحمد علي حسن',
    firstName: 'أحمد',
    lastName: 'علي',
    email: 'ahmed.ali@gmail.com',
    phone: '01556789012',
    mobile: '01556789012',
    address1: 'حي غرب، شارع الجمهورية',
    address2: 'عمارة الحرية، شقة 5',
    city: 'أسيوط',
    region: 'صعيد مصر',
    zipCode: '71511',
    country: 'مصر (EG)',
    commercialRegistry: '',
    taxCard: '',
    nationalId: '29302140105678',
    codeNumber: '000003',
    currency: 'EGP جنيه مصري',
    notes: 'عميل فردي - معاملات بنظام الدفع الفوري',
    category: 'أفراد طباعة',
    billingMethod: 'طباعة'
  }
];

export const INITIAL_PRODUCTS: ProductService[] = [
  {
    id: 'p1',
    code: 'SRV-001',
    name: 'تطوير تطبيق ويب مخصص',
    description: 'تطوير وتنفيذ تطبيقات الويب والمنصات السحابية باستخدام أحدث التقنيات وبأعلى معايير الأمان الألكتروني.',
    price: 15400.00,
    taxRate: 14 // 14% VAT
  },
  {
    id: 'p2',
    code: 'SRV-002',
    name: 'تصميم واجهة وتجربة مستخدم UI/UX',
    description: 'تصميم واجهات وتجربة المستخدم لصفحات الويب وتطبيقات الموبايل بأدق تفاصيل الجمالية وتناسق الألوان لترقية الهوية البصرية.',
    price: 4500.00,
    taxRate: 14
  },
  {
    id: 'p3',
    code: 'SRV-003',
    name: 'استشارات تقنية وهندسة برمجيات',
    description: 'جلسات استشارية مع مهندس برمجيات متخصص لتنظيم وتثبيت البنية التحتية وتحسين أداء خوادم وقواعد البيانات.',
    price: 1200.00,
    taxRate: 0
  },
  {
    id: 'p4',
    code: 'SRV-004',
    name: 'صيانة ودعم فني سنوي متقدم',
    description: 'باقة دعم فني متكاملة تشمل الصيانة الطارئة والأمنية والمتابعة المستمرة للخوادم والشبكات على مدار العام كامل.',
    price: 6800.00,
    taxRate: 14
  },
  {
    id: 'p5',
    code: 'SRV-005',
    name: 'حملة تسويق رقمي وإعلانات ممولة',
    description: 'إعداد حملة تسويقية شاملة وإدارة الإعلانات على شبكات السوشيال ميديا ومحركات البحث لزيادة المبيعات والوصول المستهدف.',
    price: 3500.00,
    taxRate: 14
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: '000001',
    date: '2026-06-05',
    issueDate: '2026-06-05',
    clientName: 'Abdo Yaser',
    salesAgent: 'Abdo Yaser #000001',
    paymentTerms: '30',
    items: [
      {
        id: 'item1',
        itemName: 'تصميم واجهة وتجربة مستخدم UI/UX',
        description: 'تصميم واجهات وتجربة المستخدم لصفحات الويب وتطبيقات الموبايل بأدق تفاصيل الجمالية وتناسق الألوان لترقية الهوية البصرية.',
        unitPrice: 4500.00,
        quantity: 1,
        discount: 0,
        taxValue: 14,
        total: 5130.00 // 4500 + 14%
      }
    ],
    status: 'paid',
    discountType: 'percentage',
    discountValue: 0,
    adjustment: 0,
    subtotal: 4500.00,
    total: 5130.00,
    notes: 'شكراً لتعاملكم معنا. الدفع عبر حسابنا البنكي الرسمي.',
    alreadyPaid: true,
    currency: 'EGP',
    depositAmount: 0,
    remainingAmount: 0,
    shippingCompany: '',
    trackingNumber: ''
  },
  {
    id: 'inv2',
    invoiceNumber: '000002',
    date: '2026-05-15',
    issueDate: '2026-05-15',
    clientName: 'شركة النيل للحلول الرقمية',
    salesAgent: 'Abdo Yaser #000001',
    paymentTerms: '0',
    items: [
      {
        id: 'item2',
        itemName: 'تطوير تطبيق ويب مخصص',
        description: 'تطوير وتنفيذ تطبيقات الويب والمنصات السحابية باستخدام أحدث التقنيات وبأعلى معايير الأمان الألكتروني.',
        unitPrice: 15400.00,
        quantity: 1,
        discount: 1000.00, // 1000 Discount
        taxValue: 14,
        total: 16416.00 // (15400 - 1000) * 1.14
      },
      {
        id: 'item3',
        itemName: 'استشارات تقنية وهندسة برمجيات',
        description: 'جلسات استشارية مع مهندس برمجيات متخصص لتنظيم وتثبيت البنية التحتية وتحسين أداء خوادم وقواعد البيانات.',
        unitPrice: 1200.00,
        quantity: 2,
        discount: 0,
        taxValue: 0,
        total: 2400.00
      }
    ],
    status: 'paid',
    discountType: 'percentage',
    discountValue: 0,
    adjustment: 0,
    subtotal: 17800.00,
    total: 18816.00,
    notes: 'تم دفع الفاتورة كلياً عبر التحويل الإلكتروني الفوري في تاريخه.',
    alreadyPaid: true,
    currency: 'EGP',
    depositAmount: 0,
    remainingAmount: 0,
    shippingCompany: '',
    trackingNumber: ''
  },
  {
    id: 'inv3',
    invoiceNumber: '000003',
    date: '2026-04-10',
    issueDate: '2026-04-10',
    clientName: 'أحمد علي حسن',
    salesAgent: 'Abdo Yaser #000001',
    paymentTerms: '15',
    items: [
      {
        id: 'item4',
        itemName: 'صيانة ودعم فني سنوي متقدم',
        description: 'باقة دعم فني متكاملة تشمل الصيانة الطارئة والأمنية والمتابعة المستمرة للخوادم والشبكات على مدار العام كامل.',
        unitPrice: 6800.00,
        quantity: 1,
        discount: 500,
        taxValue: 14,
        total: 7182.00
      }
    ],
    status: 'overdue',
    discountType: 'percentage',
    discountValue: 0,
    adjustment: 0,
    subtotal: 6800.00,
    total: 7182.00,
    notes: 'برجاء سرعة سداد القيمة المطلوبة لتجنب انقطاع الخدمة السنوي.',
    alreadyPaid: false,
    currency: 'EGP',
    depositAmount: 0,
    remainingAmount: 0,
    shippingCompany: '',
    trackingNumber: ''
  }
];
