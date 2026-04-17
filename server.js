const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Hàm lấy Cookie từ file để gắn vào header
function getHeaders() {
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // Tìm CSRF Token trong file cookies.json
    const csrfToken = cookies.find(c => c.name === 'csrftoken')?.value || '';

    return {
        'Cookie': cookieStr,
        'X-CSRFToken': csrfToken,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Referer': 'https://affiliate.shopee.vn/offer/custom_link'
    };
}

app.post('/get-link', async (req, res) => {
    const { userLink } = req.body;
    try {
        const response = await axios.post('https://affiliate.shopee.vn/api/v3/origin_link/convert', {
            origin_url: userLink
        }, { headers: getHeaders() });

        if (response.data && response.data.data && response.data.data.short_url) {
            res.json({ success: true, link: response.data.data.short_url });
        } else {
            res.json({ success: false, message: "Không thể lấy link, hãy kiểm tra lại Cookie." });
        }
    } catch (e) {
        res.json({ success: false, message: "Lỗi kết nối Shopee." });
    }
});

app.listen(10000, '0.0.0.0', () => {
    console.log("Bot Shopee đang chạy trên Codespaces port 10000");
});
