# RTMMG（リアルタイム議事録生成アプリ）

## 概要
スマートフォンで音声をリアルタイム文字起こしし、OpenAI GPT-4.1で議事録を自動生成、PCでリアルタイム表示するWebアプリです。

## ディレクトリ構成
```
rtmmg/
  ├─ main.py
  ├─ requirements.txt
  ├─ README.md
  ├─ static/
  │    ├─ mobile.js
  │    └─ pc.js
  └─ templates/
       ├─ mobile.html
       └─ pc.html
```

## セットアップ手順（Windows例）
1. 仮想環境作成・有効化
   ```
   cd giziroku\rtmmg
   python -m venv venv
   venv\Scripts\activate
   ```
2. 依存パッケージインストール
   ```
   pip install -r requirements.txt
   ```
3. OpenAI APIキーを環境変数にセット
   ```
   set OPENAI_API_KEY=sk-xxxxxxx
   ```
4. サーバー起動
   ```
   python main.py
   ```
5. ブラウザでアクセス
- スマホ: http://<サーバーIP>:300/rtmmg/mobile
- PC:    http://<サーバーIP>:300/rtmmg
- サーバーは0.0.0.0:300（または310）で待受
- 議事録は10秒ごとに自動更新
- AIプロンプトはPC画面のオプションから随時変更可能
