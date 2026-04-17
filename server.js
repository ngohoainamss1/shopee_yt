const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Hàm lấy dữ liệu bảo mật từ cookies.json
function getShopeeConfig() {
    if (!fs.existsSync('cookies.json')) return null;
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const csrfToken = cookies.find(c => c.name === 'csrftoken')?.value || '';

    return { cookieStr, csrfToken };
}

app.post('/get-link', async (req, res) => {
    const { userLink } = req.body;
    const config = getShopeeConfig();

    if (!config) {
        return res.json({ success: false, message: "Thiếu file cookies.json" });
    }

    try {
        const response = await axios.post('https://affiliate.shopee.vn/api/v3/origin_link/convert', {
            origin_url: userLink
        }, {
            headers: {
                'Cookie': config.cookieStr,
                'X-CSRFToken': config.csrfToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Content-Type': 'application/json',
                'Referer': 'https://affiliate.shopee.vn/offer/custom_link'
            }
        });

        if (response.data && response.data.data && response.data.data.short_url) {
            res.json({ success: true, link: response.data.data.short_url });
        } else {
            res.json({ success: false, message: "Cookie hết hạn hoặc link không hợp lệ." });
        }
    } catch (e) {
        res.json({ success: false, message: "Lỗi kết nối đến Shopee API." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server đang chạy trên port ${PORT}`);
});
