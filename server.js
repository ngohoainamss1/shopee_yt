const app = express();

// Link Cloudflare (Ưu tiên lấy từ Environment Variable trên Render)
const TARGET_URL = process.env.HOME_PC_URL || "https://kelkoo-participating-tell-patrol.trycloudflare.com";
const TARGET_URL = process.env.HOME_PC_URL || "https://servers-employer-doubt-soil.trycloudflare.com";

app.get('*', (req, res) => {
    console.log(`Đang chuyển hướng khách đến: ${TARGET_URL}`);
    res.redirect(TARGET_URL);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Redirect Server đang chạy tại Port ${PORT}`);
    console.log(`Đích đến hiện tại: ${TARGET_URL}`);
});
