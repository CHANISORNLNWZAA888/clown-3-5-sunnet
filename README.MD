# 🤡 Clown 3.5 Sonnet

> แชทบอท AI ที่ฉลาดสุดๆ... จนกว่า Token ฟรีจะหมดกลางประโยค
> *An AI chatbot that's brilliant right up until it runs out of tokens mid-sentence.*

ผลงานสำหรับ **Stupid Hackathon** — ล้อเลียนประสบการณ์ใช้ AI แพลน Free ที่ข้อความโดนตัดตอนสำคัญที่สุด

> ⚠️ นี่คือโปรเจกต์ล้อเลียน (parody) ไม่เกี่ยวข้องกับ Anthropic หรือ Claude แต่อย่างใด
> This is a parody project and is not affiliated with Anthropic or Claude.

## ✨ มีอะไรบ้าง

- **💬 แชทจริง** — ต่อ Gemini API ตอบเป็นภาษาไทย (ไม่มีคีย์ก็เล่นได้ด้วยคำตอบจำลอง)
- **🚨 Token หมดกลางประโยค** — เสียทุก 12 ตัวอักษร พอหมดข้อความที่เหลือจะ "ถูกอายัด" และเบลอ
- **🏪 โรงรับจำนำ Token** — มินิเกมแลก Token คืน
  - 🧘 สงบนิ่ง 5 วินาที (ห้ามขยับเมาส์)
  - 🙏 สารภาพบาป (พิมพ์ข้อความโดยห้ามกดลบ)
  - 🎁 รับฟรี 50T (ปุ่มที่หนีเมาส์ตลอดเวลา)
- **🔓 ไถ่ถอนข้อความ** — ได้ Token คืนเมื่อไหร่ ข้อความที่ถูกเบลอจะเปิดให้อ่านทั้งหมด
- **💖 โหมดลับ Senpai** — กดปุ่ม `*` เพื่อเจอ Clown-chan สาวหูแมวที่เขินเก่ง คุยด้วยแล้วได้ Token คืน
  - พิมพ์คำว่า **"ชม"** หรือ **"ดุ"** แล้วจะมีเสียงพิเศษ

## 🚀 วิธีรัน

ไม่มี build step ใช้ HTML + CSS + JavaScript ล้วนๆ

1. โหลดโปรเจกต์ (หรือ `git clone`)
2. เปิดด้วย local server เช่น VS Code **Live Server** หรือ
   ```bash
   python3 -m http.server 5500
   ```
   แล้วเปิด `http://127.0.0.1:5500`
3. กดปุ่ม **🔑 ตั้งค่า Gemini API Key** ที่แถบซ้ายล่าง แล้ววางคีย์
   (สร้างฟรีที่ [Google AI Studio](https://aistudio.google.com/apikey))

> 🔒 คีย์เก็บใน `localStorage` ของเบราว์เซอร์คุณเท่านั้น ไม่ถูกเขียนลงไฟล์และไม่ถูกส่งไปที่ไหนนอกจาก Google
> **ห้าม commit คีย์ลง repo** เด็ดขาด

## 🔊 ไฟล์เสียง

วางไว้ในโฟลเดอร์ `sounds/`

| ไฟล์ | ใช้ตอนไหน |
|---|---|
| `senpai-voice.mp3` | เปิดโหมด Senpai และตอนบอทตอบทั่วไป |
| `your-the-best-senpai.mp3` | ผู้ใช้พิมพ์คำว่า "ชม" |
| `senpai.mp3` | ผู้ใช้พิมพ์คำว่า "ดุ" |

ถ้าไฟล์ไหนหาย จะถอยไปเล่น `senpai-voice.mp3` แทน แก้ชื่อไฟล์ได้ที่ `SENPAI_SOUNDS` ใน `app.js`

## 🗂️ โครงสร้าง

```
├─ index.html   โครงหน้าเว็บ + โมดัลทั้งหมด + SVG ตัวละคร
├─ style.css    ธีมครีม-ส้ม + โหมด Senpai สีชมพู
├─ app.js       แชท, สตรีมข้อความ, ระบบ Token, มินิเกม, เสียง, Gemini API
└─ sounds/      ไฟล์เสียง .mp3
```

## ⚙️ ปรับแต่ง (ใน `app.js`)

- `MODEL_PRIORITY` — ลำดับโมเดล Gemini ที่จะลอง (ถ้าตัวแรก 503 จะลองซ้ำแล้วตกไปตัวถัดไป)
- `SENPAI_SOUNDS` — ชื่อไฟล์เสียง
- เสีย Token ทุก 12 ตัวอักษร: ดูใน `handleSubmit` (`i % 12`)

## 🙏 เครดิต

- ฟอนต์: Prompt, Instrument Serif, Mali (Google Fonts)
- ไฟล์เสียงมาจาก Myinstants Senpai Soundboard และ Soundbuttonspro Senpai Soundboard 

---
*Made with 🤡 and zero tokens remaining.*
