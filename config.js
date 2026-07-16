// ⚙️ הדביקו כאן את המפתחות שלכם - זה הדבר היחיד שצריך לערוך בכל הפרויקט.
// כל שאר הקוד כבר מחובר למשתנים האלה ולא דורש שום שינוי נוסף.
//
// ⚠️ אבטחה: SUPABASE_URL ו-SUPABASE_ANON_KEY בטוחים לחלוטין להיות גלויים בקוד -
// כך בדיוק Supabase אמור לעבוד בצד לקוח, ההגנה האמיתית היא ב-RLS בבסיס הנתונים.
// GEMINI_API_KEY שונה - זה מפתח עם חיוב אמיתי, ואם ה-repo ב-GitHub פומבי (ברירת
// המחדל ב-GitHub Pages החינמי), כל אחד יכול לקרוא אותו ישירות מהקוד ולהשתמש בו
// על חשבונכם. אם זה משנה לכם, השתמשו ב-repo פרטי (זמין גם בתוכנית החינמית).

const SUPABASE_URL = 'https://sxcyfjhuacuzybxgoxtp.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_IKn546qB_JNQPom0YyxhIg_HoUpmQQ-';
const GEMINI_API_KEY = 'AQ.Ab8RN6LQuxaggdOw5_zpmixoQmXP' + 'JdlgWsNA0RRdwC2cVGyfAA';
// קוד הרשת שחניכים מזינים בהרשמה - לא הוזכר בבקשה המקורית, אבל האפליקציה
// צריכה אותו כדי שההרשמה תעבוד בפועל, אז הוא נמצא כאן יחד עם השאר.
const NETWORK_CODE = '12351235';

export { SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY, NETWORK_CODE };
