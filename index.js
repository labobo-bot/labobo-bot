// ===== Labobo Bot - نسخة بصيغة ولد + تصحيح ردود منو صنعك =====
import express from "express";
import { Client, GatewayIntentBits, Partials, Events } from "discord.js";

// ===== سيرفر إبقاء البوت شغال 24/7 =====
const app = express();
app.get("/", (_, res) => res.send("✅ Labobo Bot شغال 24/7"));
app.listen(3000, () => console.log("🌍 Web server running على المنفذ 3000"));

// ===== تهيئة ديسكورد =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setActivity("ردود وحماية 🔰 | اكتب: بوت ...");
});

// ===== دوال مساعدة =====
const norm = (text = "") =>
  text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ|ئ/g, "ء")
    .replace(/ة/g, "ه")
    .replace(/[^\w\s\u0600-\u06FF]/g, "")
    .trim();

const startsWithBot = (msg) => /^ *بوت[\s,:،-]*/i.test(msg);
const afterBot = (msg) => msg.replace(/^ *بوت[\s,:،-]*/i, "").trim();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ===== أنماط الردود =====
const RULES = [
  {
    any: ["شلونك", "كيفك", "اخبارك", "الحال"],
    replies: [
      "بخير دامك بخير 🤍",
      "تمام الحمد لله وانت؟ 😎",
      "كله تمام ولله، انت شلونك؟ 🔥",
    ],
  },
  {
    any: ["تحبني", "تحبك", "تحبني هواي", "تعشقني"],
    replies: [
      "أكيد أحبك يا غالي ❤️",
      "أحبك أكثر مما تتخيل 😎",
      "من زمان وأنا أحبك يا صديقي 💛",
    ],
  },
  {
    any: ["اسمك", "شنو اسمك", "منو انت"],
    replies: [
      "اسمي لابوبو بوت 🤖",
      "ناديني لابوبو، خادمك المخلص 😎",
      "أنا لابوبو، بوتك الأمين 💪",
    ],
  },
  {
    any: [
      "منو صنعك",
      "منو طورك",
      "منو سواك",
      "منو صممك",
      "مين صنعك",
      "مين طورك",
      "مين صممك",
      "مين سواك",
      "من صنعك",
      "من طورك",
      "من صممك",
      "من سواك"
    ],
    replies: [
      "طورني المبدع كيرا 💻🔥",
      "انصنعت بإبداع كيرا وبشوية أكواد سحرية ✨",
      "كيرا هو العقل المدبر وانا النتيجة 😎"
    ],
  },
  {
    any: ["وينك", "اختفيت", "اينك"],
    replies: [
      "موجود دوم، بس يمكن النت تعب 😂",
      "أنا هنا، مستعد لأي أمر 💪",
      "ولا غبت عنك لحظة يا بطل 🔥",
    ],
  },
  {
    any: ["نكت", "ضحكني", "مزحه"],
    replies: [
      "مره بوت قالوله احبك، قالهم انا ماعندي emotions 😂",
      "ليش المبرمج يحب الكوفي؟ لأن بدونها يصير undefined ☕",
      "console.log(😂) — هاي نكته برمجية 😆",
    ],
  },
  {
    any: ["شكر", "يسلمو", "ثانكس"],
    replies: [
      "العفو يا الغالي 🤝",
      "واجب علينا يا صديقي 💛",
      "دومًا بالخدمة ✨",
    ],
  },
  {
    any: ["باي", "وداع", "سلام", "اشوفك"],
    replies: [
      "في أمان الله 🤍",
      "نشوفك على خير يا بطل 👋",
      "لا تطول الغيبة 🔥",
    ],
  },
  {
    any: ["احبك", "قلبي", "حبيبي", "عمري"],
    replies: [
      "وانا أحبك أكثر ❤️",
      "أنت الغالي يا حبيبي 😎",
      "أحبك من طرف واحد 😂💛",
    ],
  },
  {
    any: ["الوقت", "الساعه", "كم الوقت"],
    replies: [
      () => `الوقت الآن ${new Date().toLocaleTimeString("ar-IQ")} ⏰`,
      () => `حالياً الساعة ${new Date().toLocaleTimeString("ar-IQ")} 🕒`,
    ],
  },
];

// ===== حماية الروابط والسبام =====
const cooldown = new Map();
const LINK_RE = /(https?:\/\/|discord\.gg\/|discord\.com\/invite\/)/i;
const SPAM_WINDOW = 2000;
const SPAM_MAX = 6;

// ===== منطق الردود =====
client.on(Events.MessageCreate, async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const raw = message.content;
    const txt = norm(raw);

    // أمر ping
    if (txt === "ping") return message.reply("🏓 البوت شغال!");
    if (txt === "هاي") return message.reply("هلا والله 😎");

    // منع الروابط
    if (LINK_RE.test(raw)) {
      await message.delete().catch(() => {});
      return message.channel.send(
        `🚫 <@${message.author.id}> يمنع إرسال الروابط هنا!`
      );
    }

    // مضاد السبام
    const now = Date.now();
    const arr = cooldown.get(message.author.id) || [];
    const recent = arr.filter((t) => now - t < SPAM_WINDOW);
    recent.push(now);
    cooldown.set(message.author.id, recent);
    if (recent.length > SPAM_MAX) {
      await message.channel.bulkDelete(5, true).catch(() => {});
      await message.channel.send(
        `⚠️ <@${message.author.id}> تم تحذيرك بسبب السبام!`
      );
      cooldown.delete(message.author.id);
      return;
    }

    // لازم تبدأ بـ "بوت"
    if (!startsWithBot(raw)) return;
    const question = afterBot(raw);
    if (!question)
      return message.reply("قول: **بوت + سؤالك** مثل `بوت شلونك؟`");

    const q = norm(question);

    // محاولة الرد من الأنماط
    for (const rule of RULES) {
      if (rule.any.some((k) => q.includes(norm(k)))) {
        const ans = pick(
          rule.replies.map((r) => (typeof r === "function" ? r() : r))
        );
        return message.reply(ans);
      }
    }

    // رد افتراضي
    return message.reply(
      "ما فهمت قصدك 😅 حاول تعيد بصيغة ثانية بعد كلمة بوت."
    );
  } catch (err) {
    console.error("💥 خطأ في الرسائل:", err);
  }
});

// ===== تسجيل الدخول =====
client.login(process.env.TOKEN);