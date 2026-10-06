import type { QuizPackage } from '../types/quiz';

export function generateStandaloneQuizHtml(quiz: QuizPackage): string {
  const quizJson = JSON.stringify(quiz).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${quiz.title} - Phòng Thi Trực Tuyến</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --bg-dark: #090d16;
      --card-dark: #111827;
      --card-border: #1f2937;
      --text-light: #f9fafb;
      --text-muted: #9ca3af;
      --font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: var(--font-family); }
    body { background: var(--bg-dark); color: var(--text-light); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 16px; margin: 0; line-height: 1.5; }
    .quiz-app { width: 100%; max-width: 920px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

    /* Top Bar */
    .top-header { background: var(--card-dark); border: 1px solid var(--card-border); border-radius: 16px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    .header-info h1 { font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 2px; }
    .header-info p { font-size: 0.85rem; color: var(--text-muted); }
    .header-controls { display: flex; align-items: center; gap: 10px; }
    .timer-badge { display: flex; align-items: center; gap: 6px; background: rgba(79, 70, 229, 0.15); border: 1.5px solid var(--primary); padding: 6px 14px; border-radius: 30px; font-weight: 700; font-size: 0.95rem; color: #a5b4fc; }
    .timer-badge.urgent { border-color: var(--danger); color: #fca5a5; background: rgba(239, 68, 68, 0.15); animation: pulse 1s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
    .btn-icon { background: #1f2937; border: 1px solid #374151; color: #d1d5db; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
    .btn-icon:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

    /* Card Panels */
    .card-panel { background: var(--card-dark); border: 1px solid var(--card-border); border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
    .card-title { font-size: 1.15rem; font-weight: 700; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

    /* Forms */
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 0.88rem; font-weight: 600; color: #d1d5db; margin-bottom: 6px; }
    .form-input { width: 100%; padding: 12px 14px; background: #0b0f19; border: 1px solid #374151; border-radius: 10px; color: #fff; font-size: 0.95rem; outline: none; transition: 0.2s; }
    .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25); }

    /* Buttons */
    .btn { padding: 12px 24px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer; border: none; transition: all 0.2s ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
    .btn-primary { background: var(--primary); color: #fff; }
    .btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn-success { background: var(--success); color: #fff; }
    .btn-success:hover { background: #059669; }
    .btn-secondary { background: #374151; color: #e5e7eb; }
    .btn-secondary:hover { background: #4b5563; }

    /* Question Navigator Palette */
    .palette-box { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--card-border); }
    .palette-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #374151; background: #1f2937; color: #9ca3af; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.15s; }
    .palette-btn.active { border-color: var(--primary); background: rgba(79, 70, 229, 0.25); color: #fff; }
    .palette-btn.answered { background: var(--success); color: #fff; border-color: var(--success); }

    /* Question View */
    .q-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .badge { font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
    .badge-easy { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-medium { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
    .badge-hard { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .badge-type { background: #374151; color: #cbd5e1; }
    .q-text { font-size: 1.15rem; font-weight: 600; color: #f3f4f6; margin-bottom: 20px; line-height: 1.6; }

    /* Options */
    .options-grid { display: flex; flex-direction: column; gap: 10px; }
    .opt-label { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #0b0f19; border: 1.5px solid #1f2937; border-radius: 12px; cursor: pointer; transition: 0.2s; color: #e5e7eb; font-size: 0.95rem; }
    .opt-label:hover { border-color: #4b5563; background: #131b2e; }
    .opt-label.selected { border-color: var(--primary); background: rgba(79, 70, 229, 0.12); color: #fff; }
    .opt-char { width: 28px; height: 28px; border-radius: 6px; background: #1f2937; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; color: #9ca3af; }
    .opt-label.selected .opt-char { background: var(--primary); color: #fff; }

    /* Matching style */
    .matching-container { display: flex; flex-direction: column; gap: 12px; }
    .matching-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; background: #0b0f19; padding: 12px 16px; border-radius: 10px; border: 1px solid #1f2937; }
    .match-left { font-weight: 600; color: #c7d2fe; }

    /* Result View */
    .result-screen { text-align: center; padding: 30px 10px; }
    .score-circle { width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 2.2rem; font-weight: 800; border: 4px solid var(--primary); box-shadow: 0 0 30px rgba(79, 70, 229, 0.35); }
    .score-circle.passed { border-color: var(--success); color: var(--success); }
    .score-circle.failed { border-color: var(--danger); color: var(--danger); }
    .result-msg { font-size: 1.4rem; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .result-desc { font-size: 0.95rem; color: var(--text-muted); margin-bottom: 24px; }
    .student-badge { display: inline-block; background: #1f2937; padding: 6px 14px; border-radius: 20px; font-size: 0.88rem; color: #e5e7eb; margin-bottom: 24px; }

    /* Correct/Wrong Answer Review */
    .review-item { text-align: left; background: #0b0f19; border: 1px solid #1f2937; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .review-item.is-correct { border-left: 4px solid var(--success); }
    .review-item.is-wrong { border-left: 4px solid var(--danger); }
    .review-q-title { font-weight: 600; font-size: 0.98rem; margin-bottom: 8px; color: #fff; }
    .review-detail { font-size: 0.88rem; margin-top: 4px; }

    @media (max-width: 640px) {
      .matching-row { grid-template-columns: 1fr; }
      .header-controls { width: 100%; justify-content: space-between; }
    }
  </style>
</head>
<body>
  <div class="quiz-app">
    <!-- Top Header -->
    <header class="top-header">
      <div class="header-info">
        <h1>${quiz.title}</h1>
        <p>${quiz.subject} • ${quiz.questions.length} câu hỏi</p>
      </div>
      <div class="header-controls">
        <div id="timer-badge" class="timer-badge" style="display: none;">
          ⏱️ <span id="timer-text">00:00</span>
        </div>
        <button id="btn-music" class="btn-icon" title="Bật/Tắt nhạc nền thư giãn" onclick="toggleMusic()">🎵</button>
      </div>
    </header>

    <!-- Screen 1: Registration Form -->
    <section id="screen-reg" class="card-panel">
      <h2 class="card-title">📝 Thông Tin Thí Sinh & Quy Chế Thi</h2>
      <p style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 20px;">
        ${quiz.description || 'Vui lòng điền đầy đủ thông tin bên dưới trước khi bắt đầu làm bài thi.'}
      </p>

      <form id="student-form" onsubmit="startExam(event)">
        <div class="form-group">
          <label class="form-label">Họ và tên thí sinh *</label>
          <input type="text" id="reg-name" class="form-input" placeholder="Ví dụ: Nguyễn Văn A" required>
        </div>
        <div class="form-group">
          <label class="form-label">Lớp / Mã sinh viên *</label>
          <input type="text" id="reg-id" class="form-input" placeholder="Ví dụ: CĐ-DƯỢC-K18 hoặc 20240199" required>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            Thời gian: <strong>${quiz.settings.timeLimitMinutes > 0 ? quiz.settings.timeLimitMinutes + ' phút' : 'Không giới hạn'}</strong>
          </div>
          <button type="submit" class="btn btn-primary">🚀 Bắt Đầu Làm Bài</button>
        </div>
      </form>
    </section>

    <!-- Screen 2: Exam View -->
    <section id="screen-exam" class="card-panel" style="display: none;">
      <!-- Navigator -->
      <div id="palette-box" class="palette-box"></div>

      <!-- Question Content -->
      <div id="q-content">
        <div class="q-meta">
          <span id="q-num-badge" class="badge badge-type">Câu 1</span>
          <span id="q-diff-badge" class="badge badge-easy">DỄ</span>
          <span id="q-type-badge" class="badge badge-type">TRẮC NGHIỆM</span>
        </div>
        <div id="q-title" class="q-text"></div>
        <div id="q-options-container"></div>
      </div>

      <!-- Navigation Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--card-border);">
        <button type="button" class="btn btn-secondary" onclick="prevQuestion()">← Câu trước</button>
        <button type="button" class="btn btn-success" onclick="confirmSubmit()">🏁 Nộp Bài Thi</button>
        <button type="button" class="btn btn-primary" onclick="nextQuestion()">Câu sau →</button>
      </div>
    </section>

    <!-- Screen 3: Results -->
    <section id="screen-result" class="card-panel" style="display: none;">
      <div class="result-screen">
        <div id="score-badge" class="score-circle">0</div>
        <h2 id="result-msg" class="result-msg">Hoàn thành bài thi!</h2>
        <div id="student-badge" class="student-badge"></div>
        <p id="result-desc" class="result-desc"></p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 24px;">
          <button type="button" class="btn btn-primary" onclick="location.reload()">🔄 Thi Lại</button>
        </div>
      </div>

      <div id="review-container"></div>
    </section>
  </div>

  <script>
    const QUIZ = ${quizJson};
    let activeQuestions = [];
    let currentIdx = 0;
    let answers = {};
    let studentInfo = { name: '', id: '' };
    let timerSeconds = (QUIZ.settings.timeLimitMinutes || 0) * 60;
    let timerInterval = null;
    let audioCtx = null;
    let isMusicOn = false;

    // Web Audio Procedural Lofi / Ambient loop
    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function toggleMusic() {
      initAudio();
      isMusicOn = !isMusicOn;
      const btn = document.getElementById('btn-music');
      if (isMusicOn) {
        btn.innerText = '🔊';
        btn.style.background = 'var(--primary)';
        playAmbientLoop();
      } else {
        btn.innerText = '🎵';
        btn.style.background = '';
      }
    }

    function playAmbientLoop() {
      if (!isMusicOn || !audioCtx) return;
      const chords = [
        [130.81, 155.56, 196.00, 233.08],
        [174.61, 207.65, 261.63, 311.13],
        [116.54, 146.83, 174.61, 233.08]
      ];
      const chord = chords[Math.floor(Math.random() * chords.length)];
      chord.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioCtx.currentTime);

        const start = audioCtx.currentTime + (idx * 0.05);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 3.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 3.5);
      });
      if (isMusicOn) setTimeout(playAmbientLoop, 3200);
    }

    function playClick() {
      try {
        initAudio();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, audioCtx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch(e) {}
    }

    function selectQuestions() {
      let pool = [...QUIZ.questions];
      const settings = QUIZ.settings;
      if (settings.questionSelectionMode === 'custom_difficulty' && settings.difficultyDistribution) {
        const easyPool = pool.filter(q => q.difficulty === 'easy');
        const medPool = pool.filter(q => q.difficulty === 'medium');
        const hardPool = pool.filter(q => q.difficulty === 'hard');

        const shuffle = arr => [...arr].sort(() => 0.5 - Math.random());
        const selected = [
          ...shuffle(easyPool).slice(0, settings.difficultyDistribution.easyCount || 0),
          ...shuffle(medPool).slice(0, settings.difficultyDistribution.mediumCount || 0),
          ...shuffle(hardPool).slice(0, settings.difficultyDistribution.hardCount || 0)
        ];
        activeQuestions = selected.length > 0 ? selected : pool;
      } else {
        activeQuestions = pool;
      }

      if (settings.shuffleQuestions) {
        activeQuestions = activeQuestions.sort(() => 0.5 - Math.random());
      }
    }

    function startExam(e) {
      e.preventDefault();
      studentInfo.name = document.getElementById('reg-name').value.trim();
      studentInfo.id = document.getElementById('reg-id').value.trim();
      if (!studentInfo.name || !studentInfo.id) return;

      selectQuestions();
      document.getElementById('screen-reg').style.display = 'none';
      document.getElementById('screen-exam').style.display = 'block';

      if (timerSeconds > 0) {
        document.getElementById('timer-badge').style.display = 'flex';
        updateTimerDisplay();
        timerInterval = setInterval(() => {
          timerSeconds--;
          updateTimerDisplay();
          if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            alert('Đã hết thời gian làm bài! Hệ thống tự động nộp bài.');
            submitExam();
          }
        }, 1000);
      }

      renderPalette();
      renderCurrentQuestion();
    }

    function updateTimerDisplay() {
      const m = Math.floor(timerSeconds / 60);
      const s = timerSeconds % 60;
      const el = document.getElementById('timer-text');
      el.innerText = (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
      const badge = document.getElementById('timer-badge');
      if (timerSeconds < 60) badge.classList.add('urgent');
    }

    function renderPalette() {
      const box = document.getElementById('palette-box');
      box.innerHTML = '';
      activeQuestions.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn' + (idx === currentIdx ? ' active' : '') + (answers[q.id] !== undefined ? ' answered' : '');
        btn.innerText = idx + 1;
        btn.onclick = () => { currentIdx = idx; renderCurrentQuestion(); };
        box.appendChild(btn);
      });
    }

    function renderCurrentQuestion() {
      renderPalette();
      const q = activeQuestions[currentIdx];
      document.getElementById('q-num-badge').innerText = 'Câu ' + (currentIdx + 1) + '/' + activeQuestions.length;
      const diffBadge = document.getElementById('q-diff-badge');
      diffBadge.innerText = q.difficulty === 'easy' ? 'DỄ' : (q.difficulty === 'medium' ? 'TRUNG BÌNH' : 'KHÓ');
      diffBadge.className = 'badge ' + (q.difficulty === 'easy' ? 'badge-easy' : (q.difficulty === 'medium' ? 'badge-medium' : 'badge-hard'));

      const typeBadge = document.getElementById('q-type-badge');
      typeBadge.innerText = q.type === 'choice' ? 'TRẮC NGHIỆM' : (q.type === 'multiple_choice' ? 'CHỌN NHIỀU' : (q.type === 'fill_blank' ? 'ĐIỀN KHUYẾT' : (q.type === 'matching' ? 'NỐI CẶP' : 'TỰ LUẬN')));

      document.getElementById('q-title').innerText = q.question;
      const container = document.getElementById('q-options-container');
      container.innerHTML = '';

      if (q.type === 'choice' || q.type === 'multiple_choice') {
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        const chars = ['A', 'B', 'C', 'D', 'E', 'F'];
        (q.options || []).forEach((opt, idx) => {
          const isSelected = q.type === 'choice' ? answers[q.id] === opt : (answers[q.id] || []).includes(opt);
          const label = document.createElement('div');
          label.className = 'opt-label' + (isSelected ? ' selected' : '');
          label.innerHTML = '<span class="opt-char">' + (chars[idx] || idx + 1) + '</span><span>' + opt + '</span>';
          label.onclick = () => {
            if (q.type === 'choice') {
              answers[q.id] = opt;
            } else {
              const current = answers[q.id] || [];
              answers[q.id] = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt];
            }
            renderCurrentQuestion();
          };
          grid.appendChild(label);
        });
        container.appendChild(grid);
      } else if (q.type === 'fill_blank') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input';
        input.placeholder = 'Gõ câu trả lời của bạn vào đây...';
        input.value = answers[q.id] || '';
        input.oninput = (e) => { answers[q.id] = e.target.value; renderPalette(); };
        container.appendChild(input);
      } else if (q.type === 'matching') {
        const mWrap = document.createElement('div');
        mWrap.className = 'matching-container';
        const userMatches = answers[q.id] || {};
        const rights = (q.matchingPairs || []).map(p => p.right).sort();
        (q.matchingPairs || []).forEach(p => {
          const row = document.createElement('div');
          row.className = 'matching-row';
          row.innerHTML = '<div class="match-left">' + p.left + '</div>';
          const select = document.createElement('select');
          select.className = 'form-input';
          select.innerHTML = '<option value="">-- Chọn ghép nối --</option>' + rights.map(r => '<option value="' + r + '"' + (userMatches[p.left] === r ? ' selected' : '') + '>' + r + '</option>').join('');
          select.onchange = (e) => {
            if (!answers[q.id]) answers[q.id] = {};
            answers[q.id][p.left] = e.target.value;
            renderPalette();
          };
          row.appendChild(select);
          mWrap.appendChild(row);
        });
        container.appendChild(mWrap);
      } else if (q.type === 'essay') {
        const textarea = document.createElement('textarea');
        textarea.className = 'form-input';
        textarea.rows = 4;
        textarea.placeholder = 'Nhập câu trả lời tự luận ngắn của bạn...';
        textarea.value = answers[q.id] || '';
        textarea.oninput = (e) => { answers[q.id] = e.target.value; renderPalette(); };
        container.appendChild(textarea);
      }
    }

    function prevQuestion() { if (currentIdx > 0) { currentIdx--; renderCurrentQuestion(); } }
    function nextQuestion() { if (currentIdx < activeQuestions.length - 1) { currentIdx++; renderCurrentQuestion(); } }

    function confirmSubmit() {
      const unanswered = activeQuestions.filter(q => answers[q.id] === undefined || answers[q.id] === '');
      let msg = 'Bạn có chắc chắn muốn nộp bài thi không?';
      if (unanswered.length > 0) {
        msg = 'CẢNH BÁO: Còn ' + unanswered.length + ' câu hỏi bạn chưa hoàn thành. Bạn vẫn muốn nộp bài chứ?';
      }
      if (confirm(msg)) submitExam();
    }

    function submitExam() {
      if (timerInterval) clearInterval(timerInterval);
      document.getElementById('screen-exam').style.display = 'none';
      document.getElementById('screen-result').style.display = 'block';

      let earnedPoints = 0;
      let totalPoints = 0;
      const reviewDetails = [];

      activeQuestions.forEach(q => {
        const pts = q.points || 1;
        totalPoints += pts;
        let isCorrect = false;
        const userAns = answers[q.id];

        if (q.type === 'choice') {
          isCorrect = userAns === q.correctAnswer;
        } else if (q.type === 'multiple_choice') {
          const u = (userAns || []).sort().join('|');
          const c = (q.correctAnswers || []).sort().join('|');
          isCorrect = u === c;
        } else if (q.type === 'fill_blank') {
          const cleanUser = (userAns || '').trim().toLowerCase();
          const cleanCorrect = (q.correctAnswer || '').split(/[;/]+/).map(s => s.trim().toLowerCase());
          isCorrect = cleanCorrect.includes(cleanUser);
        } else if (q.type === 'matching') {
          let allMatch = true;
          (q.matchingPairs || []).forEach(p => {
            if ((userAns || {})[p.left] !== p.right) allMatch = false;
          });
          isCorrect = allMatch;
        } else if (q.type === 'essay') {
          // Check keyword overlap
          const keywords = (q.correctAnswer || '').toLowerCase().split(/[,;]+/).map(s => s.trim());
          const userText = (userAns || '').toLowerCase();
          isCorrect = keywords.some(k => k && userText.includes(k));
        }

        if (isCorrect) earnedPoints += pts;
        reviewDetails.push({ question: q, userAns, isCorrect });
      });

      const score10 = Math.round((earnedPoints / (totalPoints || 1)) * 100) / 10;
      const pct = Math.round((earnedPoints / (totalPoints || 1)) * 100);
      const passed = pct >= (QUIZ.settings.passingScorePercent || 50);

      const circle = document.getElementById('score-badge');
      circle.innerText = score10;
      circle.className = 'score-circle ' + (passed ? 'passed' : 'failed');

      document.getElementById('result-msg').innerText = passed ? '🎉 CHÚC MỪNG: BẠN ĐÃ ĐẠT!' : '⚠️ CHƯA ĐẠT - HÃY ÔN TẬP THÊM!';
      document.getElementById('student-badge').innerText = 'Thí sinh: ' + studentInfo.name + ' • Lớp/MSSV: ' + studentInfo.id;
      document.getElementById('result-desc').innerText = 'Đúng: ' + earnedPoints + '/' + totalPoints + ' điểm (' + pct + '%) • Chuẩn qua môn: ' + (QUIZ.settings.passingScorePercent || 50) + '%';

      // Render review
      const revBox = document.getElementById('review-container');
      revBox.innerHTML = '<h3 style="margin-bottom: 16px; color: #fff;">📋 Chi tiết bài làm:</h3>';
      reviewDetails.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'review-item ' + (item.isCorrect ? 'is-correct' : 'is-wrong');
        let correctDisplay = item.question.correctAnswer || (item.question.correctAnswers || []).join(', ');
        if (item.question.type === 'matching') {
          correctDisplay = (item.question.matchingPairs || []).map(p => p.left + ' → ' + p.right).join(' | ');
        }
        div.innerHTML = '<div class="review-q-title">Câu ' + (idx + 1) + ': ' + item.question.question + '</div>' +
          '<div class="review-detail" style="color: ' + (item.isCorrect ? 'var(--success)' : 'var(--danger)') + ';">' +
          (item.isCorrect ? '✅ Bạn trả lời đúng' : '❌ Bạn trả lời: ' + (typeof item.userAns === 'object' ? JSON.stringify(item.userAns) : (item.userAns || 'Chưa trả lời'))) + '</div>' +
          (!item.isCorrect ? '<div class="review-detail" style="color: #60a5fa;">💡 Đáp án đúng: <strong>' + correctDisplay + '</strong></div>' : '') +
          (item.question.explanation ? '<div class="review-detail" style="color: var(--text-muted); font-style: italic;">Giải thích: ' + item.question.explanation + '</div>' : '');
        revBox.appendChild(div);
      });
    }
  </script>
</body>
</html>`;
}
