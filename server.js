const express = require('express');
const app = express();

// Link Cloudflare của bạn (Cập nhật link mới tại đây hoặc dùng Environment Variable)
// Link Cloudflare (Ưu tiên lấy từ Environment Variable trên Render)
const TARGET_URL = process.env.HOME_PC_URL || "https://moscow-seo-warranty-asset.trycloudflare.com";

app.get('*', (req, res) => {
    // Lệnh chuyển hướng 302 (Tạm thời) sang máy nhà bạn
    console.log(`Đang chuyển hướng khách đến: ${TARGET_URL}`);
    res.redirect(TARGET_URL);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Redirect Server is running on port ${PORT}`);
    console.log(`Redirect Server đang chạy tại Port ${PORT}`);
    console.log(`Đích đến hiện tại: ${TARGET_URL}`);
});
