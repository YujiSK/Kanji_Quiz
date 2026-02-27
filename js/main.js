/**
 * main.js - エントリーポイント・画面遷移・問題ループ制御
 */

// ゲーム状態
const state = {
  currentLevel: null,
  stageData: null,
  questionIndex: 0,
  results: [],       // { question, isCorrect }
  totalCoins: 0,
};

/* ========================================
   初期化
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  // ステージ一覧を描画
  renderStageList(STAGES, startStage);

  // タイトル → ステージ選択
  document.getElementById('btn-start').addEventListener('click', () => {
    showScreen('screen-select');
  });

  // ステージ選択 → タイトルへ戻る
  document.getElementById('btn-back-title').addEventListener('click', () => {
    showScreen('screen-title');
  });

  // 「つぎへ」ボタン
  document.getElementById('btn-next').addEventListener('click', () => {
    nextQuestion();
  });

  // クリア画面 → もういちど
  document.getElementById('btn-retry').addEventListener('click', () => {
    startStage(state.currentLevel);
  });

  // クリア画面 → ステージ選択
  document.getElementById('btn-stage-select').addEventListener('click', () => {
    showScreen('screen-select');
  });
});

/* ========================================
   ステージ開始
   ======================================== */
async function startStage(level) {
  state.currentLevel = level;
  state.questionIndex = 0;
  state.results = [];
  state.totalCoins = 0;

  try {
    state.stageData = await loadStage(level);
  } catch (e) {
    alert('ステージデータの読み込みに失敗しました。');
    return;
  }

  showScreen('screen-quiz');
  showQuestion();
}

/* ========================================
   問題表示
   ======================================== */
function showQuestion() {
  const q = state.stageData.questions[state.questionIndex];
  const total = state.stageData.questions.length;

  updateQuizHeader(
    state.stageData.sea_area,
    state.questionIndex + 1,
    total,
    state.totalCoins
  );

  renderQuestion(q);

  // 選択肢クリックイベントを設定
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => onChoiceSelected(btn.dataset.value));
  });
}

/* ========================================
   選択肢が選ばれたとき
   ======================================== */
function onChoiceSelected(selected) {
  const q = state.stageData.questions[state.questionIndex];
  const isCorrect = checkAnswer(selected, q.answer);

  // 選択されたボタンにマーク
  markSelectedChoice(selected);

  // 結果を記録
  state.results.push({ question: q, isCorrect });

  // コインを加算（正解時のみ）
  if (isCorrect) {
    state.totalCoins += q.reward.coins;
  }

  // フィードバック表示
  showFeedback(isCorrect, q, q.reward.coins, state.totalCoins);
}

/* ========================================
   次の問題へ
   ======================================== */
function nextQuestion() {
  state.questionIndex++;
  const total = state.stageData.questions.length;

  if (state.questionIndex >= total) {
    // 全問終了 → クリア画面
    renderClearScreen(state.stageData, state.results);
    showScreen('screen-clear');
  } else {
    showQuestion();
  }
}
