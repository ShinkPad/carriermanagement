const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// データファイルパス
const dataFile = path.join(__dirname, 'data.json');

// データを初期化または読み込む
function loadData() {
  if (fs.existsSync(dataFile)) {
    try {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    } catch (e) {
      console.error('Error reading data file:', e);
    }
  }
  return {
    revisions: [
      { id: 1, text: '調査対象場所の写真を追加する', completed: false, createdBy: 'System', createdAt: new Date().toLocaleString('ja-JP') },
      { id: 2, text: 'リスクレベル表を色分けで見やすくする', completed: false, createdBy: 'System', createdAt: new Date().toLocaleString('ja-JP') },
      { id: 3, text: 'UI配色をカラフルにする', completed: true, createdBy: 'System', createdAt: new Date().toLocaleString('ja-JP') },
      { id: 4, text: 'ページアイコン（favicon）を設定する', completed: false, createdBy: 'System', createdAt: new Date().toLocaleString('ja-JP') }
    ],
    accessHistory: []
  };
}

// データを保存
function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

// 修正案一覧取得
app.get('/api/revisions', (req, res) => {
  const data = loadData();
  res.json(data.revisions);
});

// 修正案を追加
app.post('/api/revisions', (req, res) => {
  const { text, createdBy } = req.body;
  const data = loadData();
  
  const newRevision = {
    id: Math.max(...data.revisions.map(r => r.id), 0) + 1,
    text: text.trim(),
    completed: false,
    createdBy: createdBy || 'Unknown',
    createdAt: new Date().toLocaleString('ja-JP')
  };
  
  data.revisions.push(newRevision);
  saveData(data);
  res.json(newRevision);
});

// 修正案のチェック状態を更新
app.put('/api/revisions/:id', (req, res) => {
  const { completed } = req.body;
  const data = loadData();
  const revision = data.revisions.find(r => r.id === parseInt(req.params.id));
  
  if (revision) {
    revision.completed = completed;
    saveData(data);
    res.json(revision);
  } else {
    res.status(404).json({ error: 'Revision not found' });
  }
});

// 修正案を削除
app.delete('/api/revisions/:id', (req, res) => {
  const data = loadData();
  data.revisions = data.revisions.filter(r => r.id !== parseInt(req.params.id));
  saveData(data);
  res.json({ success: true });
});

// 訪問履歴を記録
app.post('/api/access-history', (req, res) => {
  const { userName } = req.body;
  const data = loadData();
  
  const timestamp = new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const visit = {
    userName: userName || 'Anonymous',
    timestamp: timestamp,
    visitNumber: data.accessHistory.length + 1
  };
  
  data.accessHistory.push(visit);
  saveData(data);
  res.json(visit);
});

// 訪問履歴一覧取得
app.get('/api/access-history', (req, res) => {
  const data = loadData();
  res.json(data.accessHistory);
});

// 訪問履歴をクリア
app.delete('/api/access-history', (req, res) => {
  const data = loadData();
  data.accessHistory = [];
  saveData(data);
  res.json({ success: true });
});

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log('複数人でページにアクセスすると、データが自動共有されます。');
});
