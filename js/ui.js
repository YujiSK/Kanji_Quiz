/**
 * ui.js - UI描画・アニメーション
 */

/* ========================================
   画面切り替え
   ======================================== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ========================================
   ステージ選択画面
   ======================================== */
function renderStageList(stages, onSelect) {
  const list = document.getElementById('stage-list');
  list.innerHTML = '';

  stages.forEach(stage => {
    const card = document.createElement('div');
    card.className = 'stage-card';
    card.innerHTML = `
      <div class="stage-card-icon">${stage.icon}</div>
      <div class="stage-card-info">
        <div class="stage-card-title">${stage.area}</div>
        <div class="stage-card-meta">小学${stage.level}年生レベル・7問</div>
      </div>
      <div class="stage-card-badge">Lv${stage.level}</div>
    `;
    card.addEventListener('click', () => onSelect(stage.level));
    list.appendChild(card);
  });
}

/* ========================================
   問題画面
   ======================================== */

/**
 * ヘッダーを更新する
 */
function updateQuizHeader(areaName, currentQ, totalQ, coins) {
  document.getElementById('quiz-area-label').textContent = `⛵ ${areaName}`;
  document.getElementById('quiz-progress').textContent = `${currentQ} / ${totalQ}`;
  document.getElementById('quiz-coins').textContent = `🪙 ${coins}`;
}

/**
 * 問題カードを描画する
 */
function renderQuestion(q) {
  // タイプバッジ
  const label = QUESTION_TYPE_LABELS[q.question_type] || q.question_type;
  const typeBadge = document.getElementById('question-type-badge');
  typeBadge.textContent = label;

  // ボスバッジ
  if (q.rescue_mission) {
    typeBadge.innerHTML = `${label} <span class="boss-badge">⚔️ BOSS</span>`;
  }

  // 問題文
  document.getElementById('question-text').textContent = q.question;

  // 選択肢エリア
  const choicesArea = document.getElementById('choices-area');
  choicesArea.innerHTML = '';

  // 2択のときはクラスを追加して大きく表示
  if (q.choices.length === 2) {
    choicesArea.classList.add('two-choice');
  } else {
    choicesArea.classList.remove('two-choice');
  }

  q.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice;
    btn.dataset.value = choice;
    choicesArea.appendChild(btn);
  });

  // フィードバックを非表示
  document.getElementById('feedback-panel').classList.add('hidden');
}

/**
 * 正誤フィードバックを表示する
 */
function showFeedback(isCorrect, question, earnedCoins, totalCoins) {
  // 選択肢ボタンを無効化して正解を強調
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.value === question.answer) {
      btn.classList.add('correct');
    } else if (!isCorrect && btn.classList.contains('selected')) {
      btn.classList.add('wrong');
    }
  });

  // フィードバックパネル
  const panel = document.getElementById('feedback-panel');
  panel.classList.remove('hidden');

  document.getElementById('feedback-icon').textContent = isCorrect ? '🎉' : '🌊';
  document.getElementById('feedback-praise').textContent = isCorrect
    ? question.praise
    : '惜しい！もういちど！';
  document.getElementById('feedback-explanation').textContent = question.explanation_short;

  // 報酬表示（正解時のみ）
  const rewardEl = document.getElementById('reward-display');
  if (isCorrect) {
    rewardEl.innerHTML = `
      <span class="reward-coins">🪙 +${earnedCoins}</span>
      <span class="reward-card ${question.reward.card_rarity}">
        ${question.reward.card_rarity} カード
      </span>
    `;
    // コイン表示を更新
    document.getElementById('quiz-coins').textContent = `🪙 ${totalCoins}`;
  } else {
    rewardEl.innerHTML = '';
  }
}

/**
 * 選択されたボタンにマークをつける
 */
function markSelectedChoice(value) {
  document.querySelectorAll('.choice-btn').forEach(btn => {
    if (btn.dataset.value === value) {
      btn.classList.add('selected');
    }
  });
}

/* ========================================
   クリア画面
   ======================================== */

/**
 * ステージクリア画面を描画する
 * @param {Object}  stageData    - ステージデータ
 * @param {Array}   results      - { question, isCorrect } の配列
 * @param {boolean} isRescueMode - レスキューチャレンジ中かどうか
 * @param {number}  rescueBonus  - レスキュー全問正解ボーナスコイン（0のとき非表示）
 */
function renderClearScreen(stageData, results, isRescueMode, rescueBonus = 0) {
  const { totalCoins, cards } = calcReward(results);
  const { correct, total, accuracy } = calcStats(results);
  const rescues = getRescueMissions(results);

  // タイトル・クリアアイコン
  const clearIcon = document.querySelector('.clear-icon');
  if (isRescueMode) {
    const allRescued = results.every(r => r.isCorrect);
    clearIcon.textContent = allRescued ? '🦈' : '🆘';
    document.getElementById('clear-title').textContent = allRescued
      ? '海のレスキュー隊 認定！'
      : 'レスキュー完了！⚓';
  } else {
    clearIcon.textContent = '🏆';
    document.getElementById('clear-title').textContent = `${stageData.sea_area} クリア！`;
  }

  // 統計
  const statsEl = document.getElementById('clear-stats');
  const srCount = cards.filter(c => c.rarity === 'SR').length;
  const rCount  = cards.filter(c => c.rarity === 'R').length;
  const nCount  = cards.filter(c => c.rarity === 'N').length;

  // レスキューボーナス行（全問正解時のみ）
  const bonusRow = rescueBonus > 0
    ? `<div class="clear-stat-row">
        <span>🦈 レスキューボーナス</span>
        <span class="clear-stat-value">🪙 +${rescueBonus}</span>
       </div>`
    : '';

  statsEl.innerHTML = `
    <div class="clear-stat-row">
      <span>正解数</span>
      <span class="clear-stat-value">${correct} / ${total}</span>
    </div>
    <div class="clear-stat-row">
      <span>正解率</span>
      <span class="clear-stat-value">${accuracy}%</span>
    </div>
    <div class="clear-stat-row">
      <span>獲得コイン</span>
      <span class="clear-stat-value">🪙 ${totalCoins}</span>
    </div>
    ${bonusRow}
    <div class="clear-stat-row">
      <span>ゲットしたカード</span>
      <span class="clear-stat-value">
        ${srCount > 0 ? `⭐SR×${srCount} ` : ''}
        ${rCount  > 0 ? `💙R×${rCount} `  : ''}
        ${nCount  > 0 ? `⬜N×${nCount}`   : ''}
        ${cards.length === 0 ? 'なし' : ''}
      </span>
    </div>
  `;

  // レスキュー対象表示 & レスキューボタン制御
  const rescueEl  = document.getElementById('rescue-missions');
  const rescueBtn = document.getElementById('btn-rescue');

  // レスキューモード中はボス失敗が出ても再度のレスキューボタンは出さない
  if (!isRescueMode && rescues.length > 0) {
    rescueEl.classList.remove('hidden');
    rescueEl.innerHTML = `
      <div class="rescue-title">🆘 レスキュー対象の問題：</div>
      ${rescues.map(r => `
        <div class="rescue-item">・${r.question.question}</div>
      `).join('')}
    `;
    rescueBtn.classList.remove('hidden');
  } else {
    rescueEl.classList.add('hidden');
    rescueBtn.classList.add('hidden');
  }
}
