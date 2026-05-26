const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const AsyncLock = require('async-lock');

const app = express();
const lock = new AsyncLock();

app.use(express.json());
app.use(express.static('public'));

let globalBrowser;
let globalPage;

const randomDelay = (min, max) => new Promise(res => setTimeout(res, Math.floor(Math.random() * (max - min + 1) + min)));

async function initBrowser() {
    console.log(">>> Đang khởi tạo trình duyệt dùng chung...");
    globalBrowser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized', '--disable-blink-features=AutomationControlled'] 
    });
    globalPage = await globalBrowser.newPage();
    if (fs.existsSync('cookies.json')) {
        const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
        await globalPage.setCookie(...cookies);
    }
    await globalPage.goto('https://affiliate.shopee.vn/offer/custom_link', { waitUntil: 'networkidle2' });
}

app.post('/get-link', async (req, res) => {
    const { userLink } = req.body;

    lock.acquire("shopee-process", async () => {
        if (!globalBrowser || !globalBrowser.connected) {
            await initBrowser();
        }

        try {
            console.log(`>>> Đang xử lý link: ${userLink}`);

            // Đóng Modal cũ nếu còn sót lại
            await globalPage.keyboard.press('Escape');
            await randomDelay(500, 800);

            const textareaSelector = 'textarea';
            await globalPage.waitForSelector(textareaSelector);

            // BƯỚC FIX LỖI: Xóa sạch link cũ bằng Javascript trực tiếp cho chắc chắn
            await globalPage.evaluate((selector) => {
                const el = document.querySelector(selector);
                if (el) {
                    el.value = ''; // Xóa sạch nội dung
                    el.dispatchEvent(new Event('input', { bubbles: true })); // Báo cho Shopee biết đã thay đổi
                }
            }, textareaSelector);

            // Click vào lại để lấy tiêu điểm (Focus)
            await globalPage.click(textareaSelector);
            await randomDelay(500, 800);

            // Gõ link mới (Gõ từng chữ có nhịp nghỉ)
            const chars = userLink.split('');
            for (let char of chars) {
                await globalPage.keyboard.type(char);
                await randomDelay(20, 80);
            }

            // Chờ Shopee kiểm tra link (Tăng nhẹ lên 7s cho người dùng sau ổn định)
            console.log("Đang đợi Shopee duyệt link...");
            await randomDelay(2000, 3000);

            // Click nút lấy link
            const btnSelector = 'button.ant-btn-primary';
            await globalPage.click(btnSelector);

            // Lấy kết quả
            await globalPage.waitForSelector('.ant-modal-content textarea', { visible: true, timeout: 15000 });
            await randomDelay(1000, 2000);
            const shortLink = await globalPage.$eval('.ant-modal-content textarea', el => el.value);

            // Đóng Modal để dọn chỗ cho người tiếp theo
            await globalPage.keyboard.press('Escape');
            await randomDelay(1000, 1500);

            console.log("✅ Thành công trả kết quả!");
            res.json({ success: true, link: shortLink });

        } catch (e) {
            console.log("❌ Lỗi:", e.message);
            res.json({ success: false, message: "Lỗi xử lý, vui lòng thử lại." });
            // Nếu lỗi nặng quá thì refresh lại trang cho người sau sạch sẽ
            await globalPage.reload({ waitUntil: 'networkidle2' }).catch(() => {});
        }
    });
});

app.listen(10000, '0.0.0.0', async () => {
    console.log("Bot Đa Người Dùng (Fix lỗi xóa link) đang chạy!");
    await initBrowser();
});
