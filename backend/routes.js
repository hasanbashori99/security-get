const express = require('express');
const router = express.Router();
const db = require('./db');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- SETUP GEMINI ---
// Ganti dengan API Key Anda yang sudah didapatkan dari Google AI Studio
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// ==========================================
// LOGIN
// ==========================================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin')
        return res.json({ success: true, role: 'admin' });

    if (username === 'security' && password === 'sec')
        return res.json({ success: true, role: 'sec' });

    try {
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (users.length > 0)
            return res.json({ success: true, role: users[0].role });

    } catch (err) {
        console.error(err);
    }

    res.status(401).json({ success: false });
});


// ==========================================
// DASHBOARD (PAIR IN & OUT)
// ==========================================
router.get('/dashboard', async (req, res) => {
    try {
        console.log('📊 DASHBOARD REQUEST');

        // Ambil raw scan logs (tidak diproses dulu)
        const [logs] = await db.query(`
            SELECT 
                l.id,
                l.employee_code,
                l.status,
                l.scan_time,
                l.rest_duration,
                l.is_late,
                l.late_duration,
                l.time_out,
                l.verification_pin,
                l.break_duration,
                e.name as emp_name,
                d.name as dept_name
            FROM scan_logs l
            LEFT JOIN employees e ON l.employee_code = e.employee_code
            LEFT JOIN departments d ON e.department_id = d.id
            ORDER BY l.scan_time DESC
        `);

        console.log('✅ RAW LOGS COUNT:', logs.length);
        if (logs.length > 0) {
            console.log('📋 SAMPLE RAW LOG:', logs[0]);
            console.log('🔍 ALL LOGS DETAIL:', logs.map(l => ({ 
                id: l.id,
                employee_code: l.employee_code, 
                status: l.status, 
                is_late: l.is_late,
                verification_pin: l.verification_pin,
                scan_time: l.scan_time 
            })));
            
            // Check specific field
            logs.forEach((log, i) => {
                console.log(`  [${i}] ${log.employee_code}: is_late=${log.is_late}, ver_pin="${log.verification_pin}", keys=${Object.keys(log).join(',')}`);
            });
        }

        const [allEmployees] = await db.query(`
            SELECT e.*, d.name as dept_name
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.id
            ORDER BY e.name ASC
        `);

        console.log('👥 EMPLOYEES COUNT:', allEmployees.length);

        const [departments] = await db.query(`
            SELECT * FROM departments ORDER BY name ASC
        `);

        console.log('🏢 DEPARTMENTS COUNT:', departments.length);

        res.json({ logs, allEmployees, departments });

    } catch (err) {
        console.error('💥 DASHBOARD ERROR:', err.message, err.stack);
        res.status(500).json({ msg: 'Gagal ambil dashboard' });
    }
});


// ==========================================
// DEPARTMENTS
// ==========================================
router.post('/departments', async (req, res) => {
    const { name, prefix } = req.body;

    try {
        await db.query(
            'INSERT INTO departments (name,prefix) VALUES (?,?)',
            [name, prefix.toUpperCase()]
        );

        res.json({ success: true });

    } catch {
        res.status(500).json({ msg: 'Gagal tambah departemen' });
    }
});

router.put('/departments/:id', async (req, res) => {
    const { name, prefix } = req.body;

    try {
        await db.query(
            'UPDATE departments SET name=?,prefix=? WHERE id=?',
            [name, prefix.toUpperCase(), req.params.id]
        );

        res.json({ success: true });

    } catch {
        res.status(500).json({ msg: 'Gagal update departemen' });
    }
});

router.delete('/departments/:id', async (req, res) => {
    try {
        // Dapatkan semua employee_code dari departemen yang akan dihapus
        const [employeesToDelete] = await db.query(
            'SELECT employee_code FROM employees WHERE department_id = ?',
            [req.params.id]
        );

        if (employeesToDelete.length > 0) {
            const employeeCodes = employeesToDelete.map(e => e.employee_code);
            // Hapus semua log yang terkait dengan karyawan di departemen ini
            await db.query('DELETE FROM scan_logs WHERE employee_code IN (?)', [employeeCodes]);
            // Hapus semua karyawan di departemen ini
            await db.query('DELETE FROM employees WHERE department_id = ?', [req.params.id]);
        }

        // Setelah karyawan dan log terkait dihapus, hapus departemennya
        await db.query('DELETE FROM departments WHERE id=?', [req.params.id]);

        res.json({ success: true });
    } catch {
        res.status(500).json({ msg: 'Server error' });
    }
});


// ==========================================
// GENERATE EMPLOYEE
// ==========================================
router.post('/employees', async (req, res) => {
    try {

        const { department_id } = req.body;

        const [dept] = await db.query(
            'SELECT prefix FROM departments WHERE id=?',
            [department_id]
        );

        if (!dept.length)
            return res.status(404).json({ msg: 'Dept tidak ditemukan' });

        const prefix = dept[0].prefix;

        const [last] = await db.query(`
            SELECT employee_code 
            FROM employees 
            WHERE employee_code LIKE '${prefix}-%'
            ORDER BY id DESC LIMIT 1
        `);

        let num = 1;

        if (last.length) {
            const parts = last[0].employee_code.split('-');
            num = parseInt(parts[1]) + 1;
        }

        const newCode = `${prefix}-${String(num).padStart(4, '0')}`;

        await db.query(
            'INSERT INTO employees (employee_code,department_id,name) VALUES (?,?,"Tanpa Nama")',
            [newCode, department_id]
        );

        res.json({ success: true, new_code: newCode });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Gagal generate ID' });
    }
});


// ==========================================
// DELETE LOG RANGE
// ==========================================
router.delete('/logs/range', async (req, res) => {

    const { startDate, endDate } = req.body;

    if (!startDate || !endDate)
        return res.status(400).json({ msg: 'Tanggal wajib diisi' });

    try {
        await db.query(
            'DELETE FROM scan_logs WHERE DATE(scan_time) BETWEEN ? AND ?',
            [startDate, endDate]
        );

        res.json({ success: true });

    } catch {
        res.status(500).json({ msg: 'Gagal hapus data' });
    }
});


// ==========================================
// SCAN QR
// ==========================================
router.post('/scan', async (req, res) => {

    const { qr_code, status, verification_pin, break_duration } = req.body;
    
    console.log('📱 SCAN REQUEST:', { qr_code, status, verification_pin, break_duration });

    try {

        const [emp] = await db.query(
            'SELECT * FROM employees WHERE employee_code=?',
            [qr_code]
        );

        if (!emp.length) {
            console.log('❌ QR tidak terdaftar:', qr_code);
            return res.status(404).json({ msg: 'QR tidak terdaftar' });
        }

        const [lastLog] = await db.query(
            'SELECT status FROM scan_logs WHERE employee_code=? ORDER BY id DESC LIMIT 1',
            [qr_code]
        );

        if (lastLog.length) {

            if (status === 'IN' && lastLog[0].status === 'IN')
                return res.status(400).json({ msg: 'Masih di dalam' });

            if (status === 'OUT' && lastLog[0].status === 'OUT')
                return res.status(400).json({ msg: 'Sudah di luar' });

        } else {

            if (status === 'IN')
                return res.status(400).json({ msg: 'Harus scan OUT dulu' });
        }

        let isLate = false;
        let lateMins = 0;
        let restDuration = 0;
        let timeOut = null;

        if (status === 'IN') {

            // Ambil log KELUAR terakhir untuk mendapatkan durasi istirahat yang seharusnya
            const [lastOut] = await db.query(
                'SELECT scan_time, break_duration FROM scan_logs WHERE employee_code=? AND status="OUT" ORDER BY scan_time DESC LIMIT 1',
                [qr_code]
            );

            if (lastOut.length) {

                timeOut = lastOut[0].scan_time;
                // Hitung durasi istirahat aktual (dalam menit)
                restDuration = Math.floor((new Date() - new Date(timeOut)) / 60000);

                // Gunakan durasi dari log 'OUT', atau fallback ke pengaturan global jika tidak ada
                const limit = lastOut[0].break_duration || (await db.query('SELECT setting_value FROM settings WHERE setting_key="late_limit"'))[0][0]?.setting_value || 60;

                if (restDuration > limit) {

                    isLate = true;
                    lateMins = restDuration - limit;

                    if (!verification_pin)
                        return res.json({
                            require_pin: true,
                            msg: `Telat ${lateMins} menit`
                        });
                }
            }
        }

        await db.query(`
            INSERT INTO scan_logs
            (employee_code,status,is_late,late_duration,rest_duration,time_out,verification_pin,break_duration,scan_time)
            VALUES (?,?,?,?,?,?,?,?,NOW())
        `, [
            qr_code,
            status,
            isLate,
            lateMins,
            restDuration,
            timeOut,
            verification_pin || null,
            status === 'OUT' ? (break_duration || null) : null // Simpan durasi hanya saat scan OUT
        ]);

        console.log('✅ SCAN SUCCESS:', { qr_code, status, isLate });

        res.json({
            success: true,
            msg: status === 'OUT'
                ? 'Keluar berhasil'
                : isLate
                    ? `Masuk telat ${lateMins} menit`
                    : 'Masuk berhasil'
        });

    } catch (err) {
        console.error('💥 SCAN ERROR:', err.message);
        res.status(500).json({ msg: 'Server error scan' });
    }
});

// ==========================================
// DEBUG ENDPOINT - Check Database Data
// ==========================================
router.get('/debug-logs', async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT id, employee_code, status, is_late, late_duration, verification_pin, scan_time
            FROM scan_logs
            ORDER BY id DESC
            LIMIT 20
        `);

        res.json({
            count: logs.length,
            logs: logs.map(l => ({
                id: l.id,
                emp_code: l.employee_code,
                status: l.status,
                is_late: l.is_late,
                late_duration: l.late_duration,
                verification_pin: l.verification_pin,
                scan_time: l.scan_time
            }))
        });
    } catch(err) {
        res.json({ error: err.message });
    }
});

// ==========================================
// AI ASSISTANT (GEMINI)
// ==========================================
router.post('/ask-ai', async (req, res) => {
    const { prompt, contextData = [] } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt wajib diisi." });
    }

    // --- SISTEM JAWABAN MANUAL (RULE-BASED) ---
    // Helper untuk format tanggal
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Cari tanggal terawal dan terakhir dari data yang ada
    let dateRangeInfo = "";
    if (contextData.length > 0) {
        const dates = contextData.map(log => new Date(log.time_in || log.time_out)).filter(d => !isNaN(d));
        if (dates.length > 0) {
            const minDate = new Date(Math.min.apply(null, dates));
            const maxDate = new Date(Math.max.apply(null, dates));
            dateRangeInfo = `Untuk periode data ${formatDate(minDate)} - ${formatDate(maxDate)}, `;
        }
    }

    const promptLower = prompt.toLowerCase();
    let reply = "Maaf, saya tidak mengerti pertanyaan Anda. Coba tanya 'berapa yang telat?', 'dept yang telat?', 'ekspor rekap telat', atau 'ekspor dari [tanggal] sampai [tanggal] = format tanggal 2024-07-01'.";

    const lateLogs = contextData.filter(log => log.is_late);

    if (promptLower.includes('berapa') && promptLower.includes('telat')) {
        const lateCount = lateLogs.length;
        if (lateCount > 0) {
            reply = `${dateRangeInfo}terdapat ${lateCount} karyawan yang terlambat.`;
        } else {
            reply = `${dateRangeInfo}tidak ada karyawan yang terlambat. Kerja bagus!`;
        }
    }
    else if ((promptLower.includes('siapa') || promptLower.includes('dept')) && promptLower.includes('telat')) {
        if (lateLogs.length > 0) {
            const lateDepts = [...new Set(lateLogs.map(log => log.dept_name || 'N/A'))];
            reply = `${dateRangeInfo}departemen yang memiliki keterlambatan adalah: ${lateDepts.join(', ')}.`;
        } else {
            reply = `${dateRangeInfo}tidak ada keterlambatan yang tercatat di departemen manapun.`;
        }
    }
    else if (promptLower.includes('pin') && promptLower.includes('telat')) {
        const pins = lateLogs
            .map(log => log.verification_pin)
            .filter(pin => pin); // Filter pin yang tidak null/kosong

        if (pins.length > 0) {
            const uniquePins = [...new Set(pins)];
            reply = `${dateRangeInfo}PIN verifikasi yang digunakan untuk keterlambatan adalah: ${uniquePins.join(', ')}.`;
        } else {
            reply = `${dateRangeInfo}tidak ada PIN verifikasi yang digunakan untuk keterlambatan.`;
        }
    }
    // --- LOGIKA BARU UNTUK EKSPOR ---
    else if (promptLower.includes('ekspor') || promptLower.includes('cetak') || promptLower.includes('rekap')) {
        // Cek apakah ada permintaan rentang tanggal (format YYYY-MM-DD)
        const dateRegex = /(\d{4}-\d{2}-\d{2})/g;
        const datesFound = prompt.match(dateRegex);

        if (datesFound && datesFound.length >= 2) {
            const startDate = datesFound[0];
            const endDate = datesFound[1];
            const exportType = promptLower.includes('telat') ? 'LATE_ONLY' : 'ALL';
            
            reply = `Baik, saya siapkan rekap dari ${startDate} sampai ${endDate}. Klik tombol di bawah untuk mengunduh.\n[ACTION:EXPORT_PDF_DATERANGE:${exportType}:${startDate}:${endDate}]`;
        } else {
            // Logika ekspor biasa (tanpa tanggal spesifik)
            if (promptLower.includes('telat')) {
                // Format jawaban khusus untuk ditangkap frontend
                reply = `Tentu, saya akan siapkan rekap data yang terlambat. Silakan klik tombol di bawah untuk mengunduh file PDF.\n[ACTION:EXPORT_PDF:LATE_ONLY]`;
            } else {
                // Format jawaban khusus untuk ditangkap frontend
                reply = `Tentu, saya akan siapkan rekap semua data. Silakan klik tombol di bawah untuk mengunduh file PDF.\n[ACTION:EXPORT_PDF:ALL]`;
            }
        }
    }

    // Mengirimkan jawaban manual
    res.json({ reply });
});


// ==========================================
// TEST ENDPOINT - Lihat data di HTML
// ==========================================
router.get('/test-dashboard', async (req, res) => {
    try {
        const [logs] = await db.query(`
            SELECT 
                l.id,
                l.employee_code,
                l.status,
                l.scan_time,
                l.rest_duration,
                l.is_late,
                l.late_duration,
                l.time_out,
                l.verification_pin,
                e.name as emp_name,
                d.name as dept_name
            FROM scan_logs l
            LEFT JOIN employees e ON l.employee_code = e.employee_code
            LEFT JOIN departments d ON e.department_id = d.id
            ORDER BY l.scan_time DESC
        `);

        const html = `
        <html>
        <head>
            <title>Dashboard Test</title>
            <style>
                body { font-family: Arial; padding: 20px; background: #f5f5f5; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; background: white; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background: #333; color: white; }
                .info { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
                .success { color: green; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <h1>Dashboard Test</h1>
            <div class="info">
                <h3>Database Connection Status</h3>
                <p class="success">✅ Database Connected</p>
            </div>

            <div class="info">
                <h3>Logs Data</h3>
                <p><strong>Total Logs:</strong> ${logs.length}</p>
                ${logs.length > 0 ? `
                    <table>
                        <tr>
                            <th>Employee Code</th>
                            <th>Employee Name</th>
                            <th>Status</th>
                            <th>Scan Time</th>
                            <th>Department</th>
                        </tr>
                        ${logs.map(log => `
                            <tr>
                                <td>${log.employee_code}</td>
                                <td>${log.emp_name || 'Tanpa Nama'}</td>
                                <td>${log.status}</td>
                                <td>${new Date(log.scan_time).toLocaleString('id-ID')}</td>
                                <td>${log.dept_name}</td>
                            </tr>
                        `).join('')}
                    </table>
                ` : '<p class="error">No logs found!</p>'}
            </div>

            <div class="info">
                <h3>Raw JSON</h3>
                <pre>${JSON.stringify({logs}, null, 2)}</pre>
            </div>
        </body>
        </html>
        `;
        res.send(html);
    } catch (err) {
        res.send(`<h1>Error</h1><p>${err.message}</p><pre>${err.stack}</pre>`);
    }
});

module.exports = router;
