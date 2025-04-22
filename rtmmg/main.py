import os
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
import string
import time

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config['SECRET_KEY'] = 'rtmmg_secret'
socketio = SocketIO(app, cors_allowed_origins="*")

# 会議IDごとの議事録データ
meeting_data = {}

def generate_meeting_id(length=5):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

@app.route('/rtmmg/mobile')
def mobile():
    # 新しい会議IDを払い出し
    meeting_id = generate_meeting_id()
    meeting_data[meeting_id] = {
        "transcript": [],
        "minutes": "",
        "last_update": 0,
        "prompt": "会議の議事録をMarkdown形式で作成してください。"
    }
    return render_template('mobile.html', meeting_id=meeting_id)

@app.route('/rtmmg', methods=['GET'])
def pc():
    return render_template('pc.html')

@app.route('/rtmmg/api/minutes', methods=['POST'])
def get_minutes():
    data = request.json
    meeting_id = data.get("meeting_id")
    if meeting_id not in meeting_data:
        return jsonify({"error": "Invalid meeting ID"}), 404
    return jsonify({
        "minutes": meeting_data[meeting_id]["minutes"]
    })

@app.route('/rtmmg/api/prompt', methods=['POST'])
def update_prompt():
    data = request.json
    meeting_id = data.get("meeting_id")
    prompt = data.get("prompt")
    if meeting_id in meeting_data and prompt:
        meeting_data[meeting_id]["prompt"] = prompt
        return jsonify({"status": "ok"})
    return jsonify({"error": "Invalid request"}), 400

@socketio.on('join')
def on_join(data):
    meeting_id = data['meeting_id']
    join_room(meeting_id)
    emit('joined', {'meeting_id': meeting_id})

@socketio.on('transcript')
def on_transcript(data):
    meeting_id = data['meeting_id']
    text = data['text']
    if meeting_id in meeting_data:
        meeting_data[meeting_id]["transcript"].append({
            "text": text,
            "timestamp": time.time()
        })
        # 10秒ごとに議事録を更新
        now = time.time()
        if now - meeting_data[meeting_id]["last_update"] > 10:
            transcript_text = "\n".join([t["text"] for t in meeting_data[meeting_id]["transcript"]])
            prompt = meeting_data[meeting_id]["prompt"]
            try:
                import openai
                openai.api_key = os.environ.get("OPENAI_API_KEY")
                completion = openai.ChatCompletion.create(
                    model="gpt-4-1106-preview",
                    messages=[
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": transcript_text}
                    ],
                    max_tokens=1024,
                    temperature=0.3,
                )
                minutes = completion.choices[0].message.content
            except Exception as e:
                minutes = f"# 議事録\n\n{transcript_text}\n\n---\n(議事録生成エラー: {e})"
            meeting_data[meeting_id]["minutes"] = minutes
            meeting_data[meeting_id]["last_update"] = now
            emit('minutes_update', {'minutes': minutes}, room=meeting_id)

@socketio.on('end_meeting')
def on_end_meeting(data):
    meeting_id = data['meeting_id']
    leave_room(meeting_id)
    # 必要に応じてmeeting_dataのクリーンアップ

if __name__ == '__main__':
    # Azure Linux VM/Apache用: 外部からアクセスできるようにhostを0.0.0.0、portを300に設定
    socketio.run(app, host='0.0.0.0', port=300)
