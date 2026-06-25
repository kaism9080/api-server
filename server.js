const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "my-secret-key-123";

app.use(cors());
app.use(express.json());

// ==============================
//  قاعدة بيانات مؤقتة (في الذاكرة)
// ==============================
const db = {
    users: {},
    tasks: {},
    mails: {},
    invites: {},
    feedbacks: [],
    gameMaps: {
        "1": { name: "المستوى 1", levels: 10 },
        "2": { name: "المستوى 2", levels: 20 },
    },
};

// ==============================
//  Middleware: التحقق من التوكن
// ==============================
function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ code: 401, msg: "Unauthorized" });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ code: 401, msg: "Invalid token" });
    }
}

// ==============================
//  المسارات (Routes)
// ==============================

// --- IP Check ---
app.post("/v1/ip/check", (req, res) => {
    res.json({ code: 200, data: { ip: req.ip, country: "US" } });
});

// --- Login ---
app.post("/v1/login/device", (req, res) => {
    const { device_id } = req.body;
    if (!device_id) return res.json({ code: 400, msg: "device_id required" });

    let user = Object.values(db.users).find(u => u.deviceId === device_id);
    if (!user) {
        user = { id: uuidv4(), deviceId: device_id, coins: 100, cash: 0, createdAt: new Date() };
        db.users[user.id] = user;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ code: 200, data: { token, userId: user.id } });
});

app.post("/v1/login/google", (req, res) => {
    const { token: googleToken } = req.body;
    res.json({ code: 200, data: { token: jwt.sign({ userId: "google-user-1" }, JWT_SECRET), userId: "google-user-1" } });
});

app.post("/v1/login/facebook", (req, res) => {
    const { token: fbToken } = req.body;
    res.json({ code: 200, data: { token: jwt.sign({ userId: "fb-user-1" }, JWT_SECRET), userId: "fb-user-1" } });
});

// --- User Info ---
app.post("/v1/wow/info", auth, (req, res) => {
    const user = db.users[req.user.userId];
    if (!user) return res.json({ code: 404, msg: "User not found" });
    res.json({ code: 200, data: { coins: user.coins, cash: user.cash } });
});

app.post("/v1/wow/sync_balance", auth, (req, res) => {
    const user = db.users[req.user.userId];
    res.json({ code: 200, data: { coins: user.coins, cash: user.cash } });
});

app.post("/v1/wow/duration", auth, (req, res) => {
    res.json({ code: 200, data: { duration: 120 } });
});

// --- User Management ---
app.post("/v1/user/delete", auth, (req, res) => {
    delete db.users[req.user.userId];
    res.json({ code: 200, msg: "Account deleted" });
});

app.post("/v1/user/restore", auth, (req, res) => {
    res.json({ code: 200, msg: "Account restored" });
});

app.post("/v1/user/language", auth, (req, res) => {
    const { lang } = req.body;
    res.json({ code: 200, data: { lang } });
});

// --- Coin / Cash Logs ---
app.post("/v1/user/coin_logs", auth, (req, res) => {
    res.json({ code: 200, data: { list: [], total: 0 } });
});

app.post("/v1/user/cash_logs", auth, (req, res) => {
    res.json({ code: 200, data: { list: [], total: 0 } });
});

// --- Withdraw ---
app.post("/v1/withdraw/coin", auth, (req, res) => {
    res.json({ code: 200, data: { min: 1000, max: 100000, rate: 0.01 } });
});

app.post("/v1/withdraw/do_coin", auth, (req, res) => {
    const { amount } = req.body;
    res.json({ code: 200, data: { orderId: uuidv4(), amount, status: "pending" } });
});

app.post("/v1/withdraw/cash", auth, (req, res) => {
    res.json({ code: 200, data: { min: 1, max: 100 } });
});

app.post("/v1/withdraw/do_cash", auth, (req, res) => {
    const { amount } = req.body;
    res.json({ code: 200, data: { orderId: uuidv4(), amount, status: "pending" } });
});

app.post("/v1/withdraw/accounts", auth, (req, res) => {
    res.json({ code: 200, data: { list: [] } });
});

app.post("/v1/withdraw/save_account", auth, (req, res) => {
    const { type, account } = req.body;
    res.json({ code: 200, msg: "Account saved" });
});

app.post("/v1/withdraw/logs", auth, (req, res) => {
    res.json({ code: 200, data: { list: [], total: 0 } });
});

// --- Charge ---
app.post("/v1/charge/progress", auth, (req, res) => {
    res.json({ code: 200, data: { progress: 0 } });
});

app.post("/v1/withdraw/do_charge", auth, (req, res) => {
    res.json({ code: 200, data: { orderId: uuidv4(), status: "success" } });
});

app.post("/v1/charge/receive", auth, (req, res) => {
    res.json({ code: 200, msg: "Charge received" });
});

app.post("/v1/charge/charging", auth, (req, res) => {
    res.json({ code: 200, data: { status: "charging" } });
});

// --- Ads ---
app.post("/v1/gg/config", auth, (req, res) => {
    res.json({ code: 200, data: { ads: [{ type: "video", placement: "reward" }] } });
});

app.post("/v1/gg/start", auth, (req, res) => {
    const { gg_id, gg_code_id, ab_test } = req.body;
    res.json({ code: 200, data: { ggLogId: uuidv4(), ggToken: uuidv4() } });
});

app.post("/v1/gg/completed", auth, (req, res) => {
    const { gg_log_id, gg_token } = req.body;
    res.json({ code: 200, msg: "Ad completed" });
});

app.post("/v1/gg/revenue", auth, (req, res) => {
    const { data } = req.body;
    res.json({ code: 200, has_merge_bonus: false, revenue_coin: 10, revenue_cash: 0 });
});

// --- Interactive Ads ---
app.post("/v1/interactive/get_ad", auth, (req, res) => {
    res.json({ code: 200, data: { adId: uuidv4(), url: "https://example.com/ad" } });
});

app.post("/v1/interactive/award", auth, (req, res) => {
    res.json({ code: 200, data: { coins: 50 } });
});

// --- Feedback ---
app.post("/v1/feedback/evaluate", auth, (req, res) => {
    const { star, content } = req.body;
    db.feedbacks.push({ userId: req.user.userId, star, content, createdAt: new Date() });
    res.json({ code: 200, msg: "Thank you!" });
});

app.post("/v1/feedback/show_evaluate", auth, (req, res) => {
    res.json({ code: 200, data: { show: true } });
});

app.post("/v1/feedback/qas", auth, (req, res) => {
    res.json({ code: 200, data: { list: [] } });
});

app.post("/v1/feedback/lists", auth, (req, res) => {
    res.json({ code: 200, data: { list: [] } });
});

app.post("/v1/feedback/submit", auth, (req, res) => {
    const { content } = req.body;
    res.json({ code: 200, msg: "Submitted" });
});

// --- Invite ---
app.post("/v1/invite/index", auth, (req, res) => {
    res.json({ code: 200, data: { code: "ABC123", count: 0, reward: 50 } });
});

app.post("/v1/invite/bindAward", auth, (req, res) => {
    const { code } = req.body;
    res.json({ code: 200, data: { coins: 50 } });
});

// --- Tasks ---
app.post("/v1/task/index", auth, (req, res) => {
    res.json({ code: 200, data: { tasks: [], dailyDone: false } });
});

app.post("/v1/task/receive_daily_award", auth, (req, res) => {
    res.json({ code: 200, data: { coins: 100 } });
});

// --- Mail ---
app.post("/v1/mail/lists", auth, (req, res) => {
    res.json({ code: 200, data: { list: [], unread: 0 } });
});

app.post("/v1/mail/del", auth, (req, res) => {
    res.json({ code: 200, msg: "Deleted" });
});

app.post("/v1/mail/read", auth, (req, res) => {
    res.json({ code: 200, msg: "Marked as read" });
});

app.post("/v1/mail/receive_attachment", auth, (req, res) => {
    res.json({ code: 200, data: { coins: 50 } });
});

// --- Game ---
app.post("/v1/game/map", auth, (req, res) => {
    res.json({ code: 200, data: db.gameMaps });
});

// --- Popup ---
app.post("/v1/pop/upgrade", auth, (req, res) => {
    res.json({ code: 200, data: { show: false } });
});

app.post("/v1/pop/lang", auth, (req, res) => {
    res.json({ code: 200, data: { lang: "en" } });
});

// --- Root ---
app.get("/", (req, res) => {
    res.json({ name: "PuzzleOcean API", version: "1.0.0", status: "running" });
});

// ==============================
//  تشغيل السيرفر
// ==============================
app.listen(PORT, () => {
    console.log(`✅ PuzzleOcean API running on http://localhost:${PORT}`);
    console.log(`📡 Test: http://localhost:${PORT}/v1/ip/check`);
});
