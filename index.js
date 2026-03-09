const puppeteer = require("puppeteer");
const fetch = require("node-fetch");

(async () => {
  const email = process.env.CS_EMAIL;
  const password = process.env.CS_PASSWORD;
  const webhook = process.env.DISCORD_WEBHOOK;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"]
  });
  const page = await browser.newPage();

  // ▼ 正しいログインURLに変更
  await page.goto("https://chouseisan.com/users/sign_in");

  // ▼ セレクタはこのページに対応
  await page.type('#user_email', email);
  await page.type('#user_password', password);

  await page.click('input[type="submit"]');
  await page.waitForNavigation();

  // ▼ 新規作成ページへ
  await page.goto("https://chouseisan.com/schedule/new");

  const today = new Date();
  const monday = new Date(today.setDate(today.getDate() - today.getDay() + 1));
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const formatted = `${d.getMonth() + 1}/${d.getDate()}（${"日月火水木金土"[d.getDay()]}） 22:30〜`;
    dates.push(formatted);
  }

  await page.type('input[name="title"]', `${dates[0]}〜${dates[6]} 今週の出欠`);
  await page.type('textarea[name="description"]', "今週の出欠登録をお願いします！");
  await page.type('textarea[name="schedule"]', dates.join("\n"));

  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  const url = page.url();

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `@everyone\n今週の出欠登録をお願いします！\n${url}`
    })
  });

  await browser.close();
})();
