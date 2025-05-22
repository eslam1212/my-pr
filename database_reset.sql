-- إفراغ كامل لكل الكائنات في المخطط العام
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- إعادة منح الأذونات الافتراضية
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- تعليق: هذا سيحذف كل شيء تمامًا في المخطط العام وينشئ مخطط جديد فارغ
-- بهذه الطريقة لن تظهر أي رسائل خطأ تتعلق بعدم وجود جداول محددة 