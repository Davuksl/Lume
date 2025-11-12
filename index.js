const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOADS_FOLDER = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_FOLDER)) {
    fs.mkdirSync(UPLOADS_FOLDER);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads'); // папка для файлов
    },
    filename: (req, file, cb) => {
        // Генерируем случайное имя
        const randomName = crypto.randomBytes(3).toString('hex'); // 32 символа
        const ext = path.extname(file.originalname); // сохраняем расширение
        cb(null, `${randomName}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|bmp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Только изображения в формате jpeg, jpg, png, bmp'));
    }
};

const upload = multer({ storage, fileFilter });

app.use('/uploads', express.static(UPLOADS_FOLDER));

app.get('/', (req, res) => {
    res.send(`
        <h1>Загрузка изображения</h1>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="image" />
            <button type="submit">Загрузить</button>
        </form>
    `);
});

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('Файл не загружен');
    res.send(`Файл загружен: <a href="/uploads/${req.file.filename}">${req.file.filename}</a>`);
});

app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ status: 400, data: { link: null } });

    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.json({ 
        status: 200,
        data: {
            link: fullUrl
        }
    });
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message.includes('Только изображения')) {
        res.status(400).send(err.message);
    } else {
        next(err);
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
