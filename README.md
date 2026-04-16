# personal-transit

אפליקציית ווב אישית ופשוטה לתכנון נסיעה קבועה בין קריית מלאכי לרחובות.

## טכנולוגיה
- React + Vite
- Supabase להתחברות ושמירת הגדרות
- OpenBus כמקור נתוני תחבורה ראשי
- פריסה ל-GitHub Pages

## התקנה והרצה מקומית
1. התקנת תלויות:
   ```bash
   npm install
   ```
2. יצירת קובץ סביבה:
   ```bash
   cp .env.example .env
   ```
3. מילוי משתני הסביבה בקובץ `.env`.
4. הרצה:
   ```bash
   npm run dev
   ```

## משתני סביבה
- `VITE_SUPABASE_URL` - כתובת פרויקט Supabase
- `VITE_SUPABASE_ANON_KEY` - מפתח ציבורי של Supabase
- `VITE_OPENBUS_BASE_URL` - כתובת בסיס ל-API של OpenBus
- `VITE_MAP_STYLE_URL` - כתובת בסיס לתצוגת מפה

## הגדרת Supabase
האפליקציה מצפה לטבלת `user_preferences` עם מזהה משתמש (UUID) ושדות JSON לשמירת:
- תחנות מועדפות למוצא ויעד
- קווים מועדפים
- הגדרות תכנון
- נקודת בית ונקודת עבודה

## בנייה ופריסה
בנייה מקומית:
```bash
npm run build
```

הפריסה מתבצעת אוטומטית על ידי GitHub Actions בקובץ:
`.github/workflows/deploy.yml`

לפני הרצה ראשונה ב-GitHub:
- להפעיל Pages בריפו תחת **Settings → Pages**
- לבחור **Build and deployment source: GitHub Actions**

ההגדרה כוללת:
- בניית פרויקט Vite עם `npm ci`
ההגדרה כוללת:
- בניית פרויקט Vite
- העלאת תיקיית `dist`
- פריסה ל-GitHub Pages תחת הנתיב `/personal-transit/`
